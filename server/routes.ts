import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompanySchema, insertDepartmentSchema, insertPositionSchema, insertGalleryItemSchema, insertIndustryTagSchema, fileAttachments, departments, companies } from "@shared/schema";

import { initializeGalleryData } from "./init-gallery-data";
import { uploadSingle } from "./middleware/upload";
import { db } from "./db";
import { eq } from "drizzle-orm";
import path from "path";
import express from "express";
import { processWebhookData } from "./webhook";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // Health check endpoint for webhook
  app.get('/webhook', (req, res) => {
    res.json({ 
      status: 'Webhook endpoint is active',
      url: 'https://career.millatumidi.uz/webhook',
      method: 'POST',
      timestamp: new Date().toISOString()
    });
  });
  
  // Telegram webhook endpoint - direct implementation
  app.post('/webhook', async (req, res) => {
    try {
      console.log('='.repeat(100));
      console.log('[WEBHOOK-DEBUG] 🚀 INCOMING PUZZLEBOT REQUEST - FULL DEBUG MODE');
      console.log('='.repeat(100));
      console.log('[WEBHOOK-DEBUG] Timestamp:', new Date().toISOString());
      console.log('[WEBHOOK-DEBUG] Request URL:', req.url);
      console.log('[WEBHOOK-DEBUG] Request method:', req.method);
      console.log('[WEBHOOK-DEBUG] Content-Type:', req.headers['content-type']);
      console.log('[WEBHOOK-DEBUG] User-Agent:', req.headers['user-agent']);
      console.log('[WEBHOOK-DEBUG] Content-Length:', req.headers['content-length']);
      console.log('[WEBHOOK-DEBUG] Origin:', req.headers['origin'] || 'Not set');
      console.log('[WEBHOOK-DEBUG] Referer:', req.headers['referer'] || 'Not set');
      console.log('');
      console.log('[WEBHOOK-DEBUG] 📋 FULL REQUEST HEADERS:');
      console.log(JSON.stringify(req.headers, null, 2));
      console.log('');
      console.log('[WEBHOOK-DEBUG] 📦 RAW REQUEST BODY:');
      console.log('- Body type:', typeof req.body);
      console.log('- Body constructor:', req.body?.constructor?.name || 'Unknown');
      console.log('- Body length:', req.body ? Object.keys(req.body).length : 'No keys');
      console.log('- Full body:', JSON.stringify(req.body, null, 2));
      
      // Log each field individually if it's an object
      if (req.body && typeof req.body === 'object') {
        console.log('');
        console.log('[WEBHOOK-DEBUG] 🔍 INDIVIDUAL FIELD ANALYSIS:');
        Object.keys(req.body).forEach(key => {
          const value = req.body[key];
          console.log(`  ✓ ${key}:`);
          console.log(`    - Value: ${JSON.stringify(value)}`);
          console.log(`    - Type: ${typeof value}`);
          console.log(`    - Length: ${value?.length || 'N/A'}`);
          console.log(`    - Is Empty: ${!value || value === ''}`);
        });
      }
      
      console.log('');
      console.log('[WEBHOOK-DEBUG] 🔄 STARTING WEBHOOK PROCESSING...');
      console.log('='.repeat(100));
      
      const result = await processWebhookData(req.body);
      
      console.log('');
      console.log('[WEBHOOK-DEBUG] ✅ WEBHOOK PROCESSING COMPLETED');
      console.log('[WEBHOOK-DEBUG] Result:', JSON.stringify(result, null, 2));
      console.log('='.repeat(100));
      
      res.status(200).json(result);

    } catch (error: any) {
      console.log('');
      console.log('[WEBHOOK-DEBUG] ❌ WEBHOOK ERROR OCCURRED');
      console.log('[WEBHOOK-DEBUG] Error type:', error?.constructor?.name);
      console.log('[WEBHOOK-DEBUG] Error message:', error?.message);
      console.log('[WEBHOOK-DEBUG] Error response data:', error?.response?.data);
      console.log('[WEBHOOK-DEBUG] Full error:', error);
      console.log('='.repeat(100));
      
      res.status(500).json({
        message: 'Error processing webhook',
        error: error?.response?.data || error.message,
        requestBody: req.body, // Include request body for debugging
      });
    }
  });



  // Companies endpoints with caching headers
  app.get("/api/companies", async (req, res) => {
    try {
      // Disable cache headers to prevent caching issues
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      const language = req.query.language as string || 'en';
      const rawData = req.query.raw === 'true'; // For admin interface
      
      console.log(`[Companies API] Raw data requested: ${rawData}, language: ${language}`);
      
      if (rawData) {
        // Return raw LocalizedContent objects for admin editing
        const companies = await storage.getAllCompanies(); // No language parameter
        console.log(`[Companies API] Raw companies count: ${companies.length}`);
        console.log(`[Companies API] Raw companies IDs: ${companies.map(c => c.id).join(', ')}`);
        
        // Create a simple test response with just essential data
        const simplifiedCompanies = companies.map(company => ({
          id: company.id,
          name: company.name,
          description: company.description,
          logoUrl: company.logoUrl,
          color: company.color,
          address: company.address,
          phone: company.phone,
          email: company.email,
          city: company.city,
          country: company.country,
          adminId: company.adminId,
          createdAt: company.createdAt,
          industries: company.industries.map(industry => ({
            id: industry.id,
            name: industry.name,
            description: industry.description,
            createdAt: industry.createdAt
          }))
        }));
        
        const responseData = { success: true, data: simplifiedCompanies };
        const responseJson = JSON.stringify(responseData);
        console.log(`[Companies API] Response size: ${responseJson.length} characters`);
        
        res.json(responseData);
      } else {
        // Return localized content for public use
        const companies = await storage.getAllCompanies(language);
        console.log(`[Companies API] Localized companies count: ${companies.length}`);
        res.json({ success: true, data: companies });
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ success: false, error: "Failed to fetch companies" });
    }
  });

  app.get("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const language = req.query.language as string || 'en';
      const rawData = req.query.raw === 'true'; // For admin interface
      
      if (rawData) {
        // Return raw LocalizedContent objects for admin editing
        const company = await storage.getCompanyById(id); // No language parameter
        if (!company) {
          return res.status(404).json({ success: false, error: "Company not found" });
        }
        res.json({ success: true, data: company });
      } else {
        // Return localized content for public use
        const company = await storage.getCompanyById(id, language);
        if (!company) {
          return res.status(404).json({ success: false, error: "Company not found" });
        }
        res.json({ success: true, data: company });
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      res.status(500).json({ success: false, error: "Failed to fetch company" });
    }
  });

  app.post("/api/companies", async (req, res) => {
    try {
      let companyData;
      
      // Handle both FormData and JSON payloads
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        // For FormData uploads
        companyData = {
          name: req.body.name,
          description: req.body.description,
          logoUrl: req.body.logoUrl,
          color: req.body.color,
          address: req.body.address,
          phone: req.body.phone,
          email: req.body.email,
          city: req.body.city,
          country: req.body.country,
          adminId: req.body.adminId,
        };
      } else {
        // For JSON payloads
        companyData = req.body;
      }

      console.log('Company creation data:', JSON.stringify(companyData, null, 2));

      // Extract industry tags from companyData
      const { industries, ...companyDataWithoutIndustries } = companyData;
      
      const validatedData = insertCompanySchema.parse(companyDataWithoutIndustries);
      const company = await storage.createCompany(validatedData);
      
      // Handle industry tags if provided
      if (industries && Array.isArray(industries)) {
        try {
          const industryTagIds = industries.map(industry => parseInt(industry.id));
          await storage.setCompanyIndustryTags(company.id, industryTagIds);
          console.log(`Company ${company.id} created with ${industryTagIds.length} industry tags`);
        } catch (dbError) {
          console.warn('Failed to set company industry tags:', dbError);
        }
      }
      
      // If company has a logo URL, link it to the file attachments
      if (company.logoUrl && company.logoUrl.includes('/uploads/')) {
        try {
          const filename = company.logoUrl.split('/').pop();
          if (filename) {
            await db.insert(fileAttachments).values({
              entityType: 'company_logo',
              entityId: company.id.toString(),
              filename: filename,
              originalName: filename,
              filepath: `uploads/${filename}`,
              mimetype: 'image/*',
              size: 0
            });
            console.log(`Company ${company.id} created with logo: ${company.logoUrl}`);
          }
        } catch (dbError) {
          console.warn('Failed to link company logo to file attachments:', dbError);
        }
      }
      
      // Fetch the company with industry tags for response
      const rawData = req.query.raw === 'true'; // For admin interface
      
      if (rawData) {
        // Return raw LocalizedContent objects for admin editing
        const companyWithIndustries = await storage.getCompanyById(company.id); // No language parameter
        res.json({ success: true, data: companyWithIndustries });
      } else {
        // Return localized content for public use
        const language = req.query.language as string || 'en';
        const companyWithIndustries = await storage.getCompanyById(company.id, language);
        res.json({ success: true, data: companyWithIndustries });
      }
    } catch (error) {
      console.error('Error creating company:', error);
      res.status(400).json({ success: false, error: error.message || "Failed to create company" });
    }
  });

  app.put("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      let updateData;
      
      // Handle both FormData and JSON payloads
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        updateData = {
          name: req.body.name,
          description: req.body.description,
          logoUrl: req.body.logoUrl,
          color: req.body.color,
          address: req.body.address,
          phone: req.body.phone,
          email: req.body.email,
          city: req.body.city,
          country: req.body.country,
          adminId: req.body.adminId,
        };
      } else {
        updateData = req.body;
      }

      // Extract industry tags from updateData
      const { industries, ...updateDataWithoutIndustries } = updateData;
      
      const company = await storage.updateCompany(id, updateDataWithoutIndustries);
      if (!company) {
        return res.status(404).json({ success: false, error: "Company not found" });
      }

      // Handle industry tags if provided
      if (industries && Array.isArray(industries)) {
        try {
          const industryTagIds = industries.map(industry => parseInt(industry.id));
          await storage.setCompanyIndustryTags(id, industryTagIds);
          console.log(`Company ${id} updated with ${industryTagIds.length} industry tags`);
        } catch (dbError) {
          console.warn('Failed to update company industry tags:', dbError);
        }
      }

      // If logo was updated and is from uploads, link it to file attachments
      if (updateDataWithoutIndustries.logoUrl && updateDataWithoutIndustries.logoUrl.includes('/uploads/')) {
        try {
          const filename = updateDataWithoutIndustries.logoUrl.split('/').pop();
          if (filename) {
            await db.insert(fileAttachments).values({
              entityType: 'company_logo',
              entityId: id.toString(),
              filename: filename,
              originalName: filename,
              filepath: `uploads/${filename}`,
              mimetype: 'image/*',
              size: 0
            });
            console.log(`Company ${id} updated with logo: ${updateDataWithoutIndustries.logoUrl}`);
          }
        } catch (dbError) {
          console.warn('Failed to link updated company logo to file attachments:', dbError);
        }
      }
      
      // Fetch the company with industry tags for response
      const rawData = req.query.raw === 'true'; // For admin interface
      
      if (rawData) {
        // Return raw LocalizedContent objects for admin editing
        const companyWithIndustries = await storage.getCompanyById(id); // No language parameter
        res.json({ success: true, data: companyWithIndustries });
      } else {
        // Return localized content for public use
        const language = req.query.language as string || 'en';
        const companyWithIndustries = await storage.getCompanyById(id, language);
        res.json({ success: true, data: companyWithIndustries });
      }
    } catch (error) {
      console.error('Error updating company:', error);
      res.status(400).json({ success: false, error: error.message || "Failed to update company" });
    }
  });

  app.delete("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCompany(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Company not found" });
      }
      res.json({ success: true, message: "Company deleted successfully" });
    } catch (error) {
      console.error('Error deleting company:', error);
      res.status(500).json({ success: false, error: "Failed to delete company" });
    }
  });

  // General file upload endpoint for permanent storage
  app.post("/api/upload", uploadSingle, async (req, res) => {
    try {
      const file = req.file;
      const { entityType, entityId } = req.body;

      if (!file) {
        return res.status(400).json({ success: false, error: "No file uploaded" });
      }

      // Create the URL path for the uploaded file
      const fileUrl = `/uploads/${file.filename}`;

      // Save file metadata to database if entity info provided
      if (entityType && entityId) {
        try {
          await db.insert(fileAttachments).values({
            entityType: entityType,
            entityId: entityId,
            filename: file.filename,
            originalName: file.originalname,
            filepath: file.path,
            mimetype: file.mimetype,
            size: file.size
          });
          console.log(`File uploaded and linked to ${entityType} ${entityId}: ${fileUrl}`);
        } catch (dbError) {
          console.warn('Failed to save file metadata:', dbError);
        }
      } else {
        console.log(`File uploaded (unlinked): ${fileUrl}`);
      }

      res.json({ 
        success: true, 
        fileUrl: fileUrl,
        filename: file.filename,
        message: "File uploaded successfully" 
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ success: false, error: "Failed to upload file" });
    }
  });

  // Company logo upload endpoint for existing companies
  app.post("/api/companies/:id/logo", uploadSingle, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, error: "No file uploaded" });
      }

      // Create the URL path for the uploaded file
      const logoUrl = `/uploads/${file.filename}`;

      // Save file metadata to database
      try {
        await db.insert(fileAttachments).values({
          entityType: 'company_logo',
          entityId: id.toString(),
          filename: file.filename,
          originalName: file.originalname,
          filepath: file.path,
          mimetype: file.mimetype,
          size: file.size
        });
        console.log('File metadata saved for company logo');
      } catch (dbError) {
        console.warn('Failed to save file metadata:', dbError);
        // Continue with the upload even if metadata save fails
      }

      // Update company with the logo URL
      const company = await storage.updateCompany(id, { logoUrl });

      if (!company) {
        return res.status(404).json({ success: false, error: "Company not found" });
      }

      console.log(`Logo uploaded for company ${id}: ${logoUrl}`);

      res.json({ 
        success: true, 
        logoUrl: logoUrl,
        message: "Logo uploaded successfully" 
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      res.status(500).json({ success: false, error: "Failed to upload logo" });
    }
  });

  // Company-industry tag association endpoints
  app.put("/api/companies/:id/industry-tags", async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const { industryTagIds } = req.body;
      
      if (!Array.isArray(industryTagIds)) {
        return res.status(400).json({ success: false, error: "industryTagIds must be an array" });
      }
      
      await storage.setCompanyIndustryTags(companyId, industryTagIds);
      
      res.json({ 
        success: true, 
        message: "Company industry tags updated successfully" 
      });
    } catch (error) {
      console.error('Error updating company industry tags:', error);
      res.status(500).json({ success: false, error: "Failed to update company industry tags" });
    }
  });

  app.get("/api/companies/:id/industry-tags", async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const language = req.query.language as string || 'en';
      const industryTags = await storage.getCompanyIndustryTags(companyId, language);
      
      res.json({ 
        success: true, 
        data: industryTags 
      });
    } catch (error) {
      console.error('Error fetching company industry tags:', error);
      res.status(500).json({ success: false, error: "Failed to fetch company industry tags" });
    }
  });

  // Industry tags endpoints
  app.get("/api/industry-tags", async (req, res) => {
    try {
      const language = req.query.language as string || 'en';
      const tags = await storage.getAllIndustryTags(language);
      res.json({ success: true, data: tags });
    } catch (error) {
      console.error('Error fetching industry tags:', error);
      res.status(500).json({ success: false, error: "Failed to fetch industry tags" });
    }
  });

  app.post("/api/industry-tags", async (req, res) => {
    try {
      const validation = insertIndustryTagSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          success: false, 
          error: "Invalid industry tag data",
          details: validation.error.errors 
        });
      }
      
      const newTag = await storage.createIndustryTag(validation.data);
      
      res.json({ 
        success: true, 
        data: newTag,
        message: "Industry tag created successfully" 
      });
    } catch (error) {
      console.error('Error creating industry tag:', error);
      res.status(500).json({ success: false, error: "Failed to create industry tag" });
    }
  });

  // Departments endpoints
  app.get("/api/departments", async (req, res) => {
    try {
      // Disable caching for departments debugging
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      
      // Debug logging for companyId parsing
      console.log('[Departments API] Raw companyId query:', req.query.companyId);
      console.log('[Departments API] Parsed companyId:', companyId);
      const includePositions = req.query.includePositions === 'true';
      const language = req.query.language as string || 'en';
      const rawData = req.query.raw === 'true'; // For admin interface
      
      console.log('[Departments API] Request params:', { companyId, includePositions, language, raw: rawData, query: req.query });
      
      if (includePositions) {
        console.log('[Departments API] Fetching departments with position counts');
        if (rawData) {
          const departments = await storage.getAllDepartmentsWithPositionCounts(companyId); // No language parameter for raw data
          console.log('[Departments API] Returning raw departments with counts:', departments);
          res.json({ success: true, data: departments });
        } else {
          const departments = await storage.getAllDepartmentsWithPositionCounts(companyId, language);
          console.log('[Departments API] Returning localized departments with counts:', departments);
          res.json({ success: true, data: departments });
        }
      } else {
        console.log('[Departments API] Fetching departments without position counts');
        if (rawData) {
          const departments = await storage.getAllDepartments(companyId); // No language parameter for raw data
          console.log('[Departments API] Returning raw departments without counts:', departments);
          res.json({ success: true, data: departments });
        } else {
          const departments = await storage.getAllDepartments(companyId, language);
          console.log('[Departments API] Returning localized departments without counts:', departments);
          res.json({ success: true, data: departments });
        }
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ success: false, error: "Failed to fetch departments" });
    }
  });

  app.get("/api/departments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const language = req.query.language as string || 'en';
      const department = await storage.getDepartmentById(id, language);
      if (!department) {
        return res.status(404).json({ success: false, error: "Department not found" });
      }
      res.json({ success: true, data: department });
    } catch (error) {
      console.error('Error fetching department:', error);
      res.status(500).json({ success: false, error: "Failed to fetch department" });
    }
  });

  app.post("/api/departments", async (req, res) => {
    try {
      let departmentData = req.body;
      console.log('[Department Create] Raw request data:', JSON.stringify(departmentData, null, 2));
      
      // Convert companyId to number if it's a string
      if (departmentData.companyId && typeof departmentData.companyId === 'string') {
        departmentData.companyId = parseInt(departmentData.companyId);
      }
      
      // Inherit fields from company if not provided
      if (departmentData.companyId && (!departmentData.city || !departmentData.country)) {
        const company = await storage.getCompanyById(parseInt(departmentData.companyId));
        if (company) {
          departmentData = {
            ...departmentData,
            city: departmentData.city || company.city,
            country: departmentData.country || company.country,
            // Inherit other company fields as needed
          };
        }
      }
      
      console.log('[Department Create] Data before validation:', JSON.stringify(departmentData, null, 2));
      
      const validatedData = insertDepartmentSchema.parse(departmentData);
      console.log('[Department Create] Validated data:', JSON.stringify(validatedData, null, 2));
      
      const department = await storage.createDepartment(validatedData);
      console.log('[Department Create] Created department:', department);
      
      res.json({ success: true, data: department });
    } catch (error) {
      console.error('Error creating department:', error);
      console.error('Error details:', error.message);
      if (error.errors) {
        console.error('Validation errors:', error.errors);
      }
      res.status(400).json({ success: false, error: error.message || "Failed to create department" });
    }
  });

  app.put("/api/departments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const department = await storage.updateDepartment(id, req.body);
      if (!department) {
        return res.status(404).json({ success: false, error: "Department not found" });
      }
      res.json({ success: true, data: department });
    } catch (error) {
      console.error('Error updating department:', error);
      res.status(400).json({ success: false, error: error.message || "Failed to update department" });
    }
  });

  app.delete("/api/departments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDepartment(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Department not found" });
      }
      res.json({ success: true, message: "Department deleted successfully" });
    } catch (error) {
      console.error('Error deleting department:', error);
      res.status(500).json({ success: false, error: "Failed to delete department" });
    }
  });

  // Positions endpoints with caching headers
  app.get("/api/positions", async (req, res) => {
    try {
      // Disable caching for positions to ensure fresh apply links
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      const departmentId = req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined;
      const language = req.query.language as string || 'en';
      const rawData = req.query.raw === 'true'; // For admin interface
      
      console.log('[Positions API] Request params:', { departmentId, language, raw: rawData, query: req.query });
      
      if (rawData) {
        // Return raw LocalizedContent objects for admin editing
        const positions = await storage.getAllPositions(departmentId); // No language parameter for raw data
        console.log('[Positions API] Returning raw positions:', positions);
        res.json({ success: true, data: positions });
      } else {
        // Return localized content for public use
        const positions = await storage.getAllPositions(departmentId, language);
        console.log('[Positions API] Returning localized positions:', positions);
        res.json({ success: true, data: positions });
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      res.status(500).json({ success: false, error: "Failed to fetch positions" });
    }
  });

  // Position stats endpoint - must come before /api/positions/:id
  app.get("/api/positions/stats", async (req, res) => {
    try {
      let positionId: number | undefined = undefined;
      
      // Robust query parameter validation
      if (req.query.positionId) {
        const parsed = parseInt(req.query.positionId as string);
        if (isNaN(parsed)) {
          return res.status(400).json({ 
            success: false, 
            error: "Invalid positionId parameter. Must be a valid number." 
          });
        }
        positionId = parsed;
      }
      
      const stats = await storage.getPositionClickStats(positionId);
      
      res.json({ 
        success: true, 
        data: stats 
      });
    } catch (error) {
      console.error('Error fetching position stats:', error);
      res.status(500).json({ success: false, error: "Failed to fetch position stats" });
    }
  });

  app.get("/api/positions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const language = req.query.language as string || 'en';
      
      // Check if ID is valid
      if (isNaN(id)) {
        console.error('Invalid position ID:', req.params.id);
        return res.status(400).json({ success: false, error: "Invalid position ID" });
      }
      
      const position = await storage.getPositionById(id, language);
      if (!position) {
        return res.status(404).json({ success: false, error: "Position not found" });
      }
      res.json({ success: true, data: position });
    } catch (error) {
      console.error('Error fetching position:', error);
      res.status(500).json({ success: false, error: "Failed to fetch position" });
    }
  });

  app.post("/api/positions", async (req, res) => {
    try {
      let positionData = req.body;
      
      // Inherit fields from department if not provided
      if (positionData.departmentId && (!positionData.city || !positionData.country)) {
        // Get raw department data (without localization) to preserve LocalizedContent objects
        const rawDepartment = await db.select().from(departments).where(eq(departments.id, parseInt(positionData.departmentId)));
        if (rawDepartment[0]) {
          const department = rawDepartment[0];
          positionData = {
            ...positionData,
            city: positionData.city || department.city,
            country: positionData.country || department.country,
            // Inherit location and other department fields as needed
          };
          
          // If department doesn't have location, inherit from company
          if (department.companyId && (!positionData.city || !positionData.country)) {
            const rawCompany = await db.select().from(companies).where(eq(companies.id, department.companyId));
            if (rawCompany[0]) {
              const company = rawCompany[0];
              positionData = {
                ...positionData,
                city: positionData.city || company.city,
                country: positionData.country || company.country,
              };
            }
          }
        }
      }
      

      console.log('[Position Creation] Incoming data:', JSON.stringify(positionData, null, 2));
      console.log('[Position Creation] applyLink field:', positionData.applyLink);
      
      const validatedData = insertPositionSchema.parse(positionData);
      console.log('[Position Creation] Validated data:', JSON.stringify(validatedData, null, 2));
      
      const position = await storage.createPosition(validatedData);
      res.json({ success: true, data: position });
    } catch (error) {
      console.error('Error creating position:', error);
      res.status(400).json({ success: false, error: error.message || "Failed to create position" });
    }
  });

  app.put("/api/positions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const position = await storage.updatePosition(id, req.body);
      if (!position) {
        return res.status(404).json({ success: false, error: "Position not found" });
      }
      res.json({ success: true, data: position });
    } catch (error) {
      console.error('Error updating position:', error);
      res.status(400).json({ success: false, error: error.message || "Failed to update position" });
    }
  });

  app.delete("/api/positions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePosition(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Position not found" });
      }
      res.json({ success: true, message: "Position deleted successfully" });
    } catch (error) {
      console.error('Error deleting position:', error);
      res.status(500).json({ success: false, error: "Failed to delete position" });
    }
  });

  // Candidates endpoints
  app.get("/api/candidates", async (req, res) => {
    try {
      const positionId = req.query.positionId ? req.query.positionId as string : undefined;
      const candidates = await storage.getAllCandidates(positionId);
      res.json({ success: true, data: candidates });
    } catch (error) {
      console.error('Error fetching candidates:', error);
      res.status(500).json({ success: false, error: "Failed to fetch candidates" });
    }
  });

  app.get("/api/candidates/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const candidate = await storage.getCandidateById(id);
      if (!candidate) {
        return res.status(404).json({ success: false, error: "Candidate not found" });
      }
      res.json({ success: true, data: candidate });
    } catch (error) {
      console.error('Error fetching candidate:', error);
      res.status(500).json({ success: false, error: "Failed to fetch candidate" });
    }
  });

  app.post("/api/candidates", async (req, res) => {
    try {
      const candidate = await storage.createCandidate(req.body);
      res.status(201).json({ success: true, data: candidate });
    } catch (error) {
      console.error('Error creating candidate:', error);
      res.status(400).json({ success: false, error: error.message || "Failed to create candidate" });
    }
  });

  app.put("/api/candidates/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const candidate = await storage.updateCandidate(id, req.body);
      if (!candidate) {
        return res.status(404).json({ success: false, error: "Candidate not found" });
      }
      res.json({ success: true, data: candidate });
    } catch (error) {
      console.error('Error updating candidate:', error);
      res.status(400).json({ success: false, error: error.message || "Failed to update candidate" });
    }
  });

  app.delete("/api/candidates/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteCandidate(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Candidate not found" });
      }
      res.json({ success: true, message: "Candidate deleted successfully" });
    } catch (error) {
      console.error('Error deleting candidate:', error);
      res.status(500).json({ success: false, error: "Failed to delete candidate" });
    }
  });

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      const departments = await storage.getAllDepartments();
      const positions = await storage.getAllPositions();
      
      const candidatesData = await storage.getAllCandidates();
      const stats = {
        companies: companies.length,
        departments: departments.length,
        positions: positions.length,
        candidates: candidatesData.length
      };
      
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ success: false, error: "Failed to fetch dashboard stats" });
    }
  });

  // Database health and stats endpoints
  app.get("/api/db/stats", async (req, res) => {
    try {
      // Get basic table information
      const companies = await storage.getAllCompanies();
      const departments = await storage.getAllDepartments();
      const positions = await storage.getAllPositions();
      const candidates = await storage.getAllCandidates();
      
      const dbStats = {
        connectionStatus: "connected",
        totalTables: 4,
        totalRows: companies.length + departments.length + positions.length + candidates.length,
        lastUpdated: new Date().toISOString(),
        databaseSize: "Small",
        tables: [
          { table_name: "companies", row_count: companies.length },
          { table_name: "departments", row_count: departments.length },
          { table_name: "positions", row_count: positions.length },
          { table_name: "candidates", row_count: candidates.length }
        ],
        recentActivity: []
      };
      
      res.json({ success: true, data: dbStats });
    } catch (error) {
      console.error('Error fetching database stats:', error);
      res.json({ 
        success: true, 
        data: { 
          connectionStatus: "disconnected",
          error: error.message 
        } 
      });
    }
  });

  app.get("/api/db/health", async (req, res) => {
    try {
      // Simple health check by trying to fetch companies
      await storage.getAllCompanies();
      res.json({ success: true, status: "connected", timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Database health check failed:', error);
      res.json({ success: false, status: "disconnected", error: error.message });
    }
  });

  // Job positions with applicants endpoint
  app.get("/api/job-positions-with-applicants", async (req, res) => {
    try {
      const lang = req.query.lang as string || 'en';
      const acceptLanguage = req.headers['accept-language'] || 'en';
      
      // Get all positions with their applicant counts
      const positionsWithApplicants = await storage.getAllAppliedPositions();
      
      // Filter out positions with zero applicants
      const filteredPositions = positionsWithApplicants.filter(pos => pos.appliedCount > 0);
      
      // Get full position details for the filtered positions
      const positionDetails = await Promise.all(
        filteredPositions.map(async (pos) => {
          const position = await storage.getPositionById(pos.positionId);
          return {
            position_id: pos.positionId,
            position_name: {
              en: position?.title || pos.positionTitle,
              ru: position?.title || pos.positionTitle, // TODO: Add proper multilingual support
              uz: position?.title || pos.positionTitle
            },
            applied_count: pos.appliedCount
          };
        })
      );
      
      // Sort by applied count in descending order
      const sortedPositions = positionDetails.sort((a, b) => b.applied_count - a.applied_count);
      
      res.json({ success: true, data: sortedPositions });
    } catch (error) {
      console.error('Error fetching job positions with applicants:', error);
      res.status(500).json({ success: false, error: "Failed to fetch job positions with applicants" });
    }
  });

  // Gallery endpoints
  app.get("/api/gallery", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const language = req.query.language as string || 'en';
      const galleryItems = await storage.getAllGalleryItems(category, language);
      res.json({ success: true, data: galleryItems });
    } catch (error) {
      console.error('Error fetching gallery items:', error);
      res.status(500).json({ success: false, error: "Failed to fetch gallery items" });
    }
  });

  app.get("/api/gallery/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const language = req.query.language as string || 'en';
      const galleryItem = await storage.getGalleryItemById(id, language);
      
      if (!galleryItem) {
        return res.status(404).json({ success: false, error: "Gallery item not found" });
      }
      
      res.json({ success: true, data: galleryItem });
    } catch (error) {
      console.error('Error fetching gallery item:', error);
      res.status(500).json({ success: false, error: "Failed to fetch gallery item" });
    }
  });

  app.post("/api/gallery", uploadSingle, async (req, res) => {
    try {
      let galleryData = { ...req.body };
      
      // Parse JSON strings from FormData
      if (galleryData.tags && typeof galleryData.tags === 'string') {
        try {
          galleryData.tags = JSON.parse(galleryData.tags);
        } catch (e) {
          galleryData.tags = [];
        }
      }
      
      // Parse LocalizedContent objects from FormData
      ['title', 'description'].forEach(field => {
        if (galleryData[field] && typeof galleryData[field] === 'string') {
          try {
            galleryData[field] = JSON.parse(galleryData[field]);
          } catch (e) {
            console.warn(`Failed to parse ${field} as JSON:`, galleryData[field]);
          }
        }
      });
      
      // Convert string booleans and numbers from FormData
      if (galleryData.isActive !== undefined) {
        galleryData.isActive = galleryData.isActive === 'true' || galleryData.isActive === true;
      }
      if (galleryData.sortOrder !== undefined) {
        galleryData.sortOrder = parseInt(galleryData.sortOrder) || 0;
      }
      
      // If a file was uploaded, set the imageUrl
      if (req.file) {
        const imageUrl = `/uploads/${req.file.filename}`;
        galleryData.imageUrl = imageUrl;
      }
      
      console.log('Gallery data after processing:', galleryData);
      
      const validation = insertGalleryItemSchema.safeParse(galleryData);
      
      if (!validation.success) {
        console.error('Validation failed:', validation.error.errors);
        return res.status(400).json({ 
          success: false, 
          error: "Invalid gallery item data",
          details: validation.error.errors 
        });
      }
      
      const galleryItem = await storage.createGalleryItem(validation.data);
      
      // If a file was uploaded, save the metadata now that we have the gallery item ID
      if (req.file) {
        try {
          await db.insert(fileAttachments).values({
            entityType: 'gallery_item',
            entityId: galleryItem.id.toString(),
            filename: req.file.filename,
            originalName: req.file.originalname,
            filepath: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size
          });
          console.log(`Gallery item ${galleryItem.id} created with file: ${galleryData.imageUrl}`);
        } catch (dbError) {
          console.warn('Failed to save gallery file metadata:', dbError);
        }
      }
      
      res.json({ success: true, data: galleryItem });
    } catch (error) {
      console.error('Error creating gallery item:', error);
      res.status(500).json({ success: false, error: "Failed to create gallery item" });
    }
  });

  app.put("/api/gallery/:id", uploadSingle, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      let updateData = { ...req.body };
      
      // Parse JSON strings from FormData
      if (updateData.tags && typeof updateData.tags === 'string') {
        try {
          updateData.tags = JSON.parse(updateData.tags);
        } catch (e) {
          updateData.tags = [];
        }
      }
      
      // Parse LocalizedContent objects from FormData
      ['title', 'description'].forEach(field => {
        if (updateData[field] && typeof updateData[field] === 'string') {
          try {
            updateData[field] = JSON.parse(updateData[field]);
          } catch (e) {
            console.warn(`Failed to parse ${field} as JSON:`, updateData[field]);
          }
        }
      });
      
      // Convert string booleans and numbers from FormData
      if (updateData.isActive !== undefined) {
        updateData.isActive = updateData.isActive === 'true' || updateData.isActive === true;
      }
      if (updateData.sortOrder !== undefined) {
        updateData.sortOrder = parseInt(updateData.sortOrder) || 0;
      }
      
      // If a new file was uploaded, update the imageUrl
      if (req.file) {
        const imageUrl = `/uploads/${req.file.filename}`;
        updateData.imageUrl = imageUrl;
        
        // Save file metadata to database
        try {
          await db.insert(fileAttachments).values({
            entityType: 'gallery_item',
            entityId: id.toString(),
            filename: req.file.filename,
            originalName: req.file.originalname,
            filepath: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size
          });
          console.log(`Gallery item ${id} updated with new file: ${imageUrl}`);
        } catch (dbError) {
          console.warn('Failed to save updated gallery file metadata:', dbError);
        }
      }
      
      console.log('Update data after processing:', updateData);
      
      const validation = insertGalleryItemSchema.partial().safeParse(updateData);
      
      if (!validation.success) {
        console.error('Validation failed:', validation.error.errors);
        return res.status(400).json({ 
          success: false, 
          error: "Invalid gallery item data",
          details: validation.error.errors 
        });
      }
      
      const galleryItem = await storage.updateGalleryItem(id, validation.data);
      
      if (!galleryItem) {
        return res.status(404).json({ success: false, error: "Gallery item not found" });
      }
      
      res.json({ success: true, data: galleryItem });
    } catch (error) {
      console.error('Error updating gallery item:', error);
      res.status(500).json({ success: false, error: "Failed to update gallery item" });
    }
  });

  app.delete("/api/gallery/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGalleryItem(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Gallery item not found" });
      }
      
      res.json({ success: true, message: "Gallery item deleted successfully" });
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      res.status(500).json({ success: false, error: "Failed to delete gallery item" });
    }
  });

  // Position click tracking endpoints
  app.post("/api/positions/:id/track-click", async (req, res) => {
    try {
      const positionId = parseInt(req.params.id);
      const { clickType } = req.body; // 'view' or 'apply'
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      if (!clickType || !['view', 'apply'].includes(clickType)) {
        return res.status(400).json({ 
          success: false, 
          error: "Invalid click type. Must be 'view' or 'apply'" 
        });
      }

      const click = await storage.trackPositionClick(positionId, clickType, ipAddress, userAgent);
      
      res.json({ 
        success: true, 
        data: click,
        message: `${clickType} tracked successfully` 
      });
    } catch (error) {
      console.error('Error tracking position click:', error);
      res.status(500).json({ success: false, error: "Failed to track position click" });
    }
  });

  app.get("/api/dashboard/click-stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      
      res.json({ 
        success: true, 
        data: stats 
      });
    } catch (error) {
      console.error('Error fetching dashboard click stats:', error);
      res.status(500).json({ success: false, error: "Failed to fetch dashboard click stats" });
    }
  });

  // Get position applicant counts
  app.get("/api/positions/applicant-counts", async (req, res) => {
    try {
      const applicantCounts = await storage.getPositionApplicantCounts();
      res.json({ success: true, data: applicantCounts });
    } catch (error) {
      console.error('Error getting position applicant counts:', error);
      res.status(500).json({ success: false, error: "Failed to get position applicant counts" });
    }
  });

  // Dashboard endpoint for position applicant counts
  app.get("/api/dashboard/position-applicant-counts", async (req, res) => {
    try {
      const applicantCounts = await storage.getPositionApplicantCounts();
      res.json({ success: true, data: applicantCounts });
    } catch (error) {
      console.error('Error getting dashboard position applicant counts:', error);
      res.status(500).json({ success: false, error: "Failed to get position applicant counts" });
    }
  });

  // Top Applied Positions endpoint (up to 3 positions with most apply clicks)
  app.get("/api/top-applied-positions", async (req, res) => {
    try {
      const language = req.query.language as string || 'en';
      const topPositions = await storage.getTopAppliedPositions();
      
      // Extract localized titles from the JSON objects
      const localizedResults = topPositions.map(pos => ({
        positionId: pos.positionId,
        positionTitle: typeof pos.positionTitle === 'string' ? pos.positionTitle : 
          (pos.positionTitle[language] || pos.positionTitle.en || pos.positionTitle.ru || pos.positionTitle.uz || 'Unknown Position'),
        appliedCount: pos.appliedCount
      }));
      
      res.json({ success: true, data: localizedResults });
    } catch (error) {
      console.error('Error getting top applied positions:', error);
      res.status(500).json({ success: false, error: "Failed to get top applied positions" });
    }
  });

  // All Applied Positions endpoint (full list of all positions with apply clicks)
  app.get("/api/all-applied-positions", async (req, res) => {
    try {
      const language = req.query.language as string || 'en';
      const result = await storage.getAllAppliedPositions();
      
      // Extract localized titles from the JSON objects  
      const localizedResults = result.map(pos => ({
        positionId: pos.positionId,
        positionTitle: typeof pos.positionTitle === 'string' ? pos.positionTitle :
          (pos.positionTitle[language] || pos.positionTitle.en || pos.positionTitle.ru || pos.positionTitle.uz || 'Unknown Position'),
        appliedCount: pos.appliedCount
      }));
      
      res.json({ success: true, data: localizedResults });
    } catch (error) {
      console.error('Error getting all applied positions:', error);
      res.status(500).json({ success: false, error: "Failed to get all applied positions" });
    }
  });

  // SEO Routes for Central Asia optimization
  
  // Generate dynamic sitemap.xml
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const positions = await storage.getAllPositions();
      const languages = ['en', 'ru', 'uz'];
      const baseUrl = 'https://career.millatumidi.uz';
      const currentDate = new Date().toISOString().split('T')[0];
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

      // Homepage URLs for each language
      languages.forEach(lang => {
        const url = lang === 'en' ? baseUrl : `${baseUrl}/${lang}`;
        const hreflangs = languages.map(l => {
          const href = l === 'en' ? baseUrl : `${baseUrl}/${l}`;
          const hreflang = l === 'en' ? 'en' : `${l}-UZ`;
          return `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}/" />`;
        }).join('\n');
        
        sitemap += `
  <url>
    <loc>${url}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
${hreflangs}
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/" />
  </url>`;
      });

      // Blog URLs for each language
      languages.forEach(lang => {
        const url = lang === 'en' ? `${baseUrl}/blog` : `${baseUrl}/${lang}/blog`;
        const hreflangs = languages.map(l => {
          const href = l === 'en' ? `${baseUrl}/blog` : `${baseUrl}/${l}/blog`;
          const hreflang = l === 'en' ? 'en' : `${l}-UZ`;
          return `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}" />`;
        }).join('\n');
        
        sitemap += `
  <url>
    <loc>${url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
${hreflangs}
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/blog" />
  </url>`;
      });

      sitemap += `
</urlset>`;

      res.setHeader('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('[SEO] Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Meta tags API for dynamic SEO
  app.get('/api/seo/meta/:page', async (req, res) => {
    try {
      const page = req.params.page;
      const language = req.query.language as string || 'en';
      const baseUrl = 'https://career.millatumidi.uz';
      
      const metaData: any = {
        en: {
          home: {
            title: 'Jobs in Uzbekistan | Millat Umidi Career Portal | Tashkent Employment',
            description: 'Find top career opportunities in Uzbekistan with Millat Umidi. Leading HR platform connecting talent with employers in Tashkent, Samarkand, and across Central Asia. Apply now!',
            keywords: 'jobs Uzbekistan, careers Tashkent, employment Central Asia, Millat Umidi jobs, work in Uzbekistan, HR platform, job search Tashkent, career opportunities, remote work Uzbekistan',
            image: `${baseUrl}/logo png.png`
          },
          blog: {
            title: 'Career Insights & HR News | Millat Umidi Blog | Job Market Uzbekistan',
            description: 'Stay updated with the latest career trends, HR insights, and job market news in Uzbekistan and Central Asia. Expert advice for professionals and employers.',
            keywords: 'HR blog Uzbekistan, career advice, job market trends, professional development, employment news Central Asia, workplace tips',
            image: `${baseUrl}/logo png.png`
          }
        },
        ru: {
          home: {
            title: 'Работа в Узбекистане | Портал карьеры Миллат Умиди | Трудоустройство в Ташкенте',
            description: 'Найдите лучшие карьерные возможности в Узбекистане с Миллат Умиди. Ведущая HR платформа, соединяющая таланты с работодателями в Ташкенте, Самарканде и по всей Центральной Азии.',
            keywords: 'работа Узбекистан, карьера Ташкент, трудоустройство Центральная Азия, вакансии Миллат Умиди, работа в Узбекистане, HR платформа, поиск работы Ташкент, карьерные возможности, удаленная работа',
            image: `${baseUrl}/logo png.png`
          },
          blog: {
            title: 'Карьерные инсайты и HR новости | Блог Миллат Умиди | Рынок труда Узбекистан',
            description: 'Следите за последними карьерными трендами, HR инсайтами и новостями рынка труда в Узбекистане и Центральной Азии. Экспертные советы для профессионалов и работодателей.',
            keywords: 'HR блог Узбекистан, карьерные советы, тренды рынка труда, профессиональное развитие, новости трудоустройства Центральная Азия',
            image: `${baseUrl}/logo png.png`
          }
        },
        uz: {
          home: {
            title: 'Oʻzbekistonda ish | Millat Umidi karyera portali | Toshkentda bandlik',
            description: 'Millat Umidi bilan Oʻzbekistonda eng yaxshi karyera imkoniyatlarini toping. Toshkent, Samarqand va butun Markaziy Osiyoda iqtidorlarni ish beruvchilar bilan bogʻlovchi yetakchi HR platforma.',
            keywords: 'ish Oʻzbekiston, karyera Toshkent, bandlik Markaziy Osiya, Millat Umidi ish, Oʻzbekistonda ishlash, HR platforma, ish qidirish Toshkent, karyera imkoniyatlari, masofaviy ish',
            image: `${baseUrl}/logo png.png`
          },
          blog: {
            title: 'Karyera tushunchalari va HR yangiliklari | Millat Umidi blogi | Oʻzbekiston mehnat bozori',
            description: 'Oʻzbekiston va Markaziy Osiyodagi eng soʻnggi karyera tendensiyalari, HR tushunchalari va mehnat bozori yangiliklari bilan tanishib turing. Mutaxassislar va ish beruvchilar uchun ekspert maslahatlari.',
            keywords: 'HR blog Oʻzbekiston, karyera maslahatlari, mehnat bozori tendensiyalari, kasbiy rivojlanish, bandlik yangiliklari Markaziy Osiya',
            image: `${baseUrl}/logo png.png`
          }
        }
      };

      const langData = metaData[language] || metaData.en;
      const pageData = langData[page] || langData.home;

      res.json({
        ...pageData,
        canonical: `${baseUrl}${language === 'en' ? '' : `/${language}`}${page === 'home' ? '' : `/${page}`}`,
        locale: language === 'en' ? 'en_UZ' : `${language}_UZ`,
        alternates: [
          { hreflang: 'en', href: `${baseUrl}${page === 'home' ? '' : `/${page}`}` },
          { hreflang: 'ru-UZ', href: `${baseUrl}/ru${page === 'home' ? '' : `/${page}`}` },
          { hreflang: 'uz-UZ', href: `${baseUrl}/uz${page === 'home' ? '' : `/${page}`}` },
          { hreflang: 'x-default', href: `${baseUrl}${page === 'home' ? '' : `/${page}`}` }
        ]
      });
    } catch (error) {
      console.error('[SEO] Error generating meta data:', error);
      res.status(500).json({ error: 'Error generating meta data' });
    }
  });

  // Individual position endpoint for SEO pages
  app.get('/api/positions/:id', async (req, res) => {
    try {
      const positionId = parseInt(req.params.id);
      if (isNaN(positionId)) {
        return res.status(400).json({ success: false, error: 'Invalid position ID' });
      }

      const position = await storage.getPositionById(positionId);
      if (!position) {
        return res.status(404).json({ success: false, error: 'Position not found' });
      }

      res.json({ success: true, data: position });
    } catch (error) {
      console.error('Error getting position by ID:', error);
      res.status(500).json({ success: false, error: 'Failed to get position' });
    }
  });

  // Individual company endpoint
  app.get('/api/companies/:id', async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      if (isNaN(companyId)) {
        return res.status(400).json({ success: false, error: 'Invalid company ID' });
      }

      const company = await storage.getCompanyById(companyId);
      if (!company) {
        return res.status(404).json({ success: false, error: 'Company not found' });
      }

      res.json({ success: true, data: company });
    } catch (error) {
      console.error('Error getting company by ID:', error);
      res.status(500).json({ success: false, error: 'Failed to get company' });
    }
  });

  // Individual department endpoint
  app.get('/api/departments/:id', async (req, res) => {
    try {
      const departmentId = parseInt(req.params.id);
      if (isNaN(departmentId)) {
        return res.status(400).json({ success: false, error: 'Invalid department ID' });
      }

      const department = await storage.getDepartmentById(departmentId);
      if (!department) {
        return res.status(404).json({ success: false, error: 'Department not found' });
      }

      res.json({ success: true, data: department });
    } catch (error) {
      console.error('Error getting department by ID:', error);
      res.status(500).json({ success: false, error: 'Failed to get department' });
    }
  });

  // Dynamic sitemap generation for SEO
  app.get('/sitemap.xml', async (req, res) => {
    try {
      console.log('[SEO] Generating dynamic sitemap');
      
      const baseUrl = 'https://career.millatumidi.uz';
      const languages = ['en', 'ru', 'uz'];
      
      // Get all positions for individual pages
      const positions = await storage.getAllPositions();
      
      // Static pages
      const staticPages = [
        { url: '', priority: '1.0', changefreq: 'daily' },
        { url: '/blog', priority: '0.8', changefreq: 'weekly' }
      ];
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

      // Add static pages with language alternates
      staticPages.forEach(page => {
        languages.forEach(lang => {
          const url = lang === 'en' ? `${baseUrl}${page.url}` : `${baseUrl}/${lang}${page.url}`;
          
          sitemap += `
  <url>
    <loc>${url}</loc>
    <priority>${page.priority}</priority>
    <changefreq>${page.changefreq}</changefreq>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>`;

          // Add hreflang alternates
          languages.forEach(alternateLang => {
            const alternateUrl = alternateLang === 'en' ? 
              `${baseUrl}${page.url}` : 
              `${baseUrl}/${alternateLang}${page.url}`;
            
            sitemap += `
    <xhtml:link rel="alternate" hreflang="${alternateLang}" href="${alternateUrl}" />`;
          });

          sitemap += `
  </url>`;
        });
      });

      // Add individual position pages
      positions.forEach(position => {
        languages.forEach(lang => {
          const url = `${baseUrl}/positions/${position.id}`;
          
          sitemap += `
  <url>
    <loc>${url}</loc>
    <priority>0.9</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${position.createdAt ? new Date(position.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>`;

          // Add hreflang alternates for position pages
          languages.forEach(alternateLang => {
            sitemap += `
    <xhtml:link rel="alternate" hreflang="${alternateLang}" href="${url}?lang=${alternateLang}" />`;
          });

          sitemap += `
  </url>`;
        });
      });

      sitemap += `
</urlset>`;

      res.set('Content-Type', 'text/xml');
      res.send(sitemap);
      
      console.log(`[SEO] Sitemap generated with ${staticPages.length * languages.length + positions.length * languages.length} URLs`);
    } catch (error) {
      console.error('[SEO] Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Robots.txt for Central Asia SEO optimization
  app.get('/robots.txt', (req, res) => {
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /uploads/private/

# Sitemap location
Sitemap: https://career.millatumidi.uz/sitemap.xml

# Google bot optimization for Central Asia
User-agent: Googlebot
Allow: /
Crawl-delay: 1

# Yandex bot optimization for Russian-speaking users
User-agent: YandexBot
Allow: /
Crawl-delay: 1

# Bing bot for international reach
User-agent: Bingbot
Allow: /
Crawl-delay: 2

# Block unwanted bots
User-agent: BadBot
Disallow: /

# Cache optimization
User-agent: *
Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term`;

    res.set('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  const httpServer = createServer(app);

  // Initialize gallery data on startup
  setTimeout(async () => {
    try {
      await initializeGalleryData();
      console.log("Gallery data initialized successfully");
    } catch (error) {
      console.error("Error initializing gallery data:", error);
    }
  }, 2000);

  return httpServer;
}

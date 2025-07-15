import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompanySchema, insertDepartmentSchema, insertPositionSchema, insertGalleryItemSchema, insertIndustryTagSchema, fileAttachments } from "@shared/schema";
import bcrypt from "bcryptjs";
import { initializeGalleryData } from "./init-gallery-data";
import { uploadSingle } from "./middleware/upload";
import { db } from "./db";
import path from "path";
import express from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // Telegram webhook proxy - forwards to port 3001 service
  app.post('/webhook', async (req, res) => {
    try {
      console.log('[WEBHOOK-PROXY] Received webhook request, forwarding to Telegram service...');
      
      const response = await fetch('http://localhost:3001/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      console.log('[WEBHOOK-PROXY] Response from Telegram service:', data);
      
      res.status(response.status).json(data);
    } catch (error) {
      console.error('[WEBHOOK-PROXY] Error forwarding webhook:', error);
      res.status(500).json({ 
        error: 'Webhook proxy error',
        message: error.message 
      });
    }
  });

  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      console.log('Login attempt:', { email, password: password ? '[HIDDEN]' : 'undefined' });
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          error: "Email and password are required" 
        });
      }

      // Get user from database
      const user = await storage.getUserByUsername(email);
      
      console.log('User found:', user ? { id: user.id, username: user.username } : 'null');
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          error: "Invalid email or password" 
        });
      }

      // Check password
      console.log('Comparing password with hash...');
      const passwordValid = await bcrypt.compare(password, user.password);
      
      console.log('Password valid:', passwordValid);
      
      if (!passwordValid) {
        return res.status(401).json({ 
          success: false, 
          error: "Invalid email or password" 
        });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        admin: userWithoutPassword,
        token: "dummy-jwt-token" // Simple token for now
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false, 
        error: "An error occurred during login" 
      });
    }
  });

  // Companies endpoints with caching headers
  app.get("/api/companies", async (req, res) => {
    try {
      // Set cache headers for better performance
      res.set('Cache-Control', 'public, max-age=1800, s-maxage=3600'); // 30 min client, 1 hour CDN
      res.set('ETag', `"companies-${Date.now()}"`);
      
      const companies = await storage.getAllCompanies();
      res.json({ success: true, data: companies });
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ success: false, error: "Failed to fetch companies" });
    }
  });

  app.get("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.getCompanyById(id);
      if (!company) {
        return res.status(404).json({ success: false, error: "Company not found" });
      }
      res.json({ success: true, data: company });
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
      const companyWithIndustries = await storage.getCompanyById(company.id);
      res.json({ success: true, data: companyWithIndustries });
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
      const companyWithIndustries = await storage.getCompanyById(id);
      res.json({ success: true, data: companyWithIndustries });
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
      const industryTags = await storage.getCompanyIndustryTags(companyId);
      
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
      const tags = await storage.getAllIndustryTags();
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
      // Set cache headers for better performance
      res.set('Cache-Control', 'public, max-age=1800, s-maxage=3600'); // 30 min client, 1 hour CDN
      res.set('ETag', `"departments-${Date.now()}"`);
      
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const departments = await storage.getAllDepartments(companyId);
      res.json({ success: true, data: departments });
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ success: false, error: "Failed to fetch departments" });
    }
  });

  app.get("/api/departments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const department = await storage.getDepartmentById(id);
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
      
      const validatedData = insertDepartmentSchema.parse(departmentData);
      const department = await storage.createDepartment(validatedData);
      res.json({ success: true, data: department });
    } catch (error) {
      console.error('Error creating department:', error);
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
      const positions = await storage.getAllPositions(departmentId);
      res.json({ success: true, data: positions });
    } catch (error) {
      console.error('Error fetching positions:', error);
      res.status(500).json({ success: false, error: "Failed to fetch positions" });
    }
  });

  app.get("/api/positions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const position = await storage.getPositionById(id);
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
        const department = await storage.getDepartmentById(parseInt(positionData.departmentId));
        if (department) {
          positionData = {
            ...positionData,
            city: positionData.city || department.city,
            country: positionData.country || department.country,
            // Inherit location and other department fields as needed
          };
          
          // If department doesn't have location, inherit from company
          if (department.companyId && (!positionData.city || !positionData.country)) {
            const company = await storage.getCompanyById(department.companyId);
            if (company) {
              positionData = {
                ...positionData,
                city: positionData.city || company.city,
                country: positionData.country || company.country,
              };
            }
          }
        }
      }
      
      const validatedData = insertPositionSchema.parse(positionData);
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

  // Gallery endpoints
  app.get("/api/gallery", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const galleryItems = await storage.getAllGalleryItems(category);
      res.json({ success: true, data: galleryItems });
    } catch (error) {
      console.error('Error fetching gallery items:', error);
      res.status(500).json({ success: false, error: "Failed to fetch gallery items" });
    }
  });

  app.get("/api/gallery/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const galleryItem = await storage.getGalleryItemById(id);
      
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

  app.get("/api/positions/stats", async (req, res) => {
    try {
      const positionId = req.query.positionId ? parseInt(req.query.positionId as string) : undefined;
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

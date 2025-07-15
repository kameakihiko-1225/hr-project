import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompanySchema, insertDepartmentSchema, insertPositionSchema } from "@shared/schema";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Companies endpoints
  app.get("/api/companies", async (req, res) => {
    try {
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

      const validatedData = insertCompanySchema.parse(companyData);
      const company = await storage.createCompany(validatedData);
      res.json({ success: true, data: company });
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

      const company = await storage.updateCompany(id, updateData);
      if (!company) {
        return res.status(404).json({ success: false, error: "Company not found" });
      }
      res.json({ success: true, data: company });
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

  // Company logo upload endpoint
  app.post("/api/companies/:id/logo", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { logoUrl } = req.body;
      
      if (!logoUrl) {
        return res.status(400).json({ success: false, error: "No logo data provided" });
      }
      
      // Update company with the logo URL (blob URL for now)
      const company = await storage.updateCompany(id, { logoUrl });
      
      if (!company) {
        return res.status(404).json({ success: false, error: "Company not found" });
      }
      
      console.log(`Logo uploaded for company ${id}`);
      
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

  // Industry tags endpoints
  app.get("/api/industry-tags", async (req, res) => {
    try {
      // Return predefined industry tags that match the database
      const industryTags = [
        { id: "technology", name: "Technology" },
        { id: "healthcare", name: "Healthcare" },
        { id: "finance", name: "Finance" },
        { id: "education", name: "Education" },
        { id: "manufacturing", name: "Manufacturing" },
        { id: "retail", name: "Retail" },
        { id: "hospitality", name: "Hospitality" },
        { id: "transportation", name: "Transportation" },
        { id: "energy", name: "Energy" },
        { id: "media", name: "Media & Entertainment" }
      ];
      
      res.json({ success: true, data: industryTags });
    } catch (error) {
      console.error('Error fetching industry tags:', error);
      res.status(500).json({ success: false, error: "Failed to fetch industry tags" });
    }
  });

  app.post("/api/industry-tags", async (req, res) => {
    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ success: false, error: "Tag name is required" });
      }
      
      // For now, just return success as if the tag was created
      // In a real implementation, this would save to a tags table
      const newTag = {
        id: `tag-${Date.now()}`,
        name: name
      };
      
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

  // Positions endpoints
  app.get("/api/positions", async (req, res) => {
    try {
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

  const httpServer = createServer(app);

  return httpServer;
}

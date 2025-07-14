import express from 'express';
import cors from 'cors';
import { PrismaClient } from './generated/prisma/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import * as entityValidationHandler from './src/api/validation/entityValidationHandler.js';
import { initRedisClient } from './src/lib/cache.js';
import { cacheMiddleware, invalidateCache } from './src/api/middleware/cacheMiddleware.js';
import dotenv from 'dotenv';
import { z } from 'zod';
import * as aiHandler from './src/api/ai/aiHandler.js';
import { processUpload as trainDocumentUpload } from './src/api/training/documentTrainingService.js';

// Load environment variables from .env file (gracefully handle Jest mocks or unusual module resolutions)
if (dotenv && typeof dotenv.config === 'function') {
dotenv.config();
}

// Initialize Redis client
initRedisClient().catch(console.error);

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Log database connection status
if (process.env.DATABASE_URL) {
  console.log('Using DATABASE_URL from environment variables');
} else {
  console.warn('DATABASE_URL not found in environment variables');
}

// Initialize Prisma with connection retries
let prisma;
const initPrisma = async () => {
  try {
    prisma = new PrismaClient();
    await prisma.$connect();
    console.log('Database connection established successfully');
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
};

// Try to initialize Prisma but don't block server startup (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  initPrisma().then(success => {
    if (success) {
      // Initialize reminder scheduler after successful database connection
      console.log('🚀 Starting reminder scheduler...');
      // reminderScheduler.initializeScheduler(); // Removed as per edit hint
    }
  }).catch(error => {
  console.error('Initial database connection failed:', error);
  console.log('Server will continue running, but database features may not work');
});
}

// Check if we're in development mode
const isDev = process.env.NODE_ENV !== 'production';

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Import company handler
import * as companyHandler from './src/api/company/companyHandler.js';

// JWT Secret
const JWT_SECRET = process.env.VITE_JWT_SECRET || '4f3eaa46d4f4c2f2eb8ba7fd95630f9b6e7afb883a8107c4f9e951f92d031b5d';
const JWT_EXPIRES_IN = process.env.VITE_JWT_EXPIRES_IN || '7d';

// Basic authentication middleware
const authMiddleware = async (req, res, next) => {
  // Skip auth in development
  if (isDev) {
    return next();
  }
  return next();
};

// Basic health check endpoint
app.get('/api/health', async (req, res) => {
  return res.status(200).json({
    status: 'healthy',
    message: 'Server is running'
  });
});

// Company logo upload endpoint
app.post('/api/companies/:id/logo', authMiddleware, upload.single('logo'), (req, res) => {
  return companyHandler.uploadLogo(req, req.params.id);
});

// Database health check endpoint
app.get('/api/db/health', async (req, res) => {
  try {
    // Check if prisma is initialized
    if (!prisma) {
      throw new Error('Database client not initialized');
    }
    
    // Try to connect to the database
    await prisma.$queryRaw`SELECT 1`;
    
    // If successful, return healthy status
    return res.status(200).json({
      status: 'healthy',
      message: 'Database connection is healthy'
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    
    // If failed, return unhealthy status
    return res.status(503).json({
      status: 'unhealthy',
      message: 'Database connection is not healthy',
      error: error.message
    });
  }
});

// Auth login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Processing login request');
    
    // Get request body
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    // Allow mock auth only when explicitly enabled
    if (process.env.ENABLE_MOCK_AUTH === 'true') {
      // Mock login for development
      return res.status(200).json({
        success: true,
        admin: {
          id: 'mock-admin-id',
          email: 'admin@example.com',
          isSuperAdmin: true
        },
        token: jwt.sign(
          { id: 'mock-admin-id', email: 'admin@example.com' },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        )
      });
    }
    
    // Find user in database
    const admin = await prisma.admin.findUnique({
      where: { email }
    });
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Return admin data (without password) and token
    const { passwordHash, ...adminData } = admin;
    
    return res.status(200).json({
      success: true,
      admin: adminData,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during login'
    });
  }
});

// Auth register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Processing registration request');
    
    // Get request body
    const { email, password, inviteCode } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    // Allow mock registration only when explicitly enabled
    if (process.env.ENABLE_MOCK_AUTH === 'true') {
      // Check if super admin code is provided
      const isSuperAdmin = inviteCode === 'SUPER_ADMIN_SECRET_CODE';
      
      // Mock registration for development
      return res.status(201).json({
        success: true,
        admin: {
          id: 'mock-admin-id',
          email,
          isSuperAdmin
        },
        token: jwt.sign(
          { id: 'mock-admin-id', email },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        )
      });
    }
    
    // Check if email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email }
    });
    
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Email already in use'
      });
    }
    
    // In a real application, we would verify the invite code
    // For now, we'll just check if it's the super admin code
    const isSuperAdmin = inviteCode === 'SUPER_ADMIN_SECRET_CODE';
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create new admin
    const admin = await prisma.admin.create({
      data: {
        id: uuidv4(),
        email,
        passwordHash,
        isSuperAdmin
      }
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Return admin data (without password) and token
    const { passwordHash: _, ...adminData } = admin;
    
    return res.status(201).json({
      success: true,
      admin: adminData,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during registration'
    });
  }
});

// Auth reset password endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    console.log('Processing password reset request');
    
    // Get request body
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    // Allow mock response only when explicitly enabled
    if (process.env.ENABLE_MOCK_AUTH === 'true') {
      return res.status(200).json({
        success: true,
        message: 'Password reset instructions sent to your email'
      });
    }
    
    // Check if user exists
    const admin = await prisma.admin.findUnique({
      where: { email }
    });
    
    if (!admin) {
      // For security reasons, don't reveal that the email doesn't exist
      return res.status(200).json({
        success: true,
        message: 'Password reset instructions sent to your email'
      });
    }
    
    // In a real application, we would:
    // 1. Generate a reset token
    // 2. Store it in the database with an expiration
    // 3. Send an email with a link containing the token
    
    // For now, we'll just return a success message
    return res.status(200).json({
      success: true,
      message: 'Password reset instructions sent to your email'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during password reset'
    });
  }
});

// Companies endpoints
app.get('/api/companies', async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
        color: true,
      }
    });
    
    return res.status(200).json({ success: true, data: companies });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch companies' });
  }
});

// Get company by ID endpoint with validation
app.get('/api/companies/:id', authMiddleware, async (req, res) => {
  // Validate ID param
  const parseResult = idParamSchema.safeParse(req.params);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: parseResult.error.flatten()
    });
  }
  const { id } = parseResult.data;
  try {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }
    return res.status(200).json({ success: true, data: company });
  } catch (error) {
    console.error('Error getting company:', error);
    return res.status(500).json({ success: false, error: 'Failed to get company' });
  }
});

// Upload company logo endpoint
app.post('/api/companies/:id/logo', authMiddleware, upload.single('logo'), async (req, res) => {
  try {
    // Validate ID param
    const parseResult = idParamSchema.safeParse(req.params);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parseResult.error.flatten()
      });
    }
    const { id } = parseResult.data;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No logo file provided'
      });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only images are allowed.'
      });
    }

    try {
      // Store file in FileStorage
      const file = await prisma.fileStorage.create({
        data: {
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
          fileData: req.file.buffer,
          uploadedBy: req.adminId || 'system' // Use authenticated admin ID or fallback
        }
      });

      // Update company with new logo URL
      const company = await prisma.company.update({
        where: { id },
        data: {
          logoUrl: `/api/files/${file.id}`
        }
      });

      return res.status(200).json({
        success: true,
        data: company
      });
    } catch (dbError) {
      console.error('Database error during logo upload:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Failed to store logo'
      });
    }
  } catch (error) {
    console.error('Error uploading company logo:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload logo'
    });
  }
});

// Company schemas
const createCompanySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  logoUrl: z.string().optional(),
  color: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
});
const updateCompanySchema = createCompanySchema.partial();

// Create company endpoint with validation
app.post('/api/companies', authMiddleware, async (req, res) => {
  // Validate input
  const parseResult = createCompanySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: parseResult.error.flatten()
    });
  }
  try {
    const company = await prisma.company.create({ data: parseResult.data });
    return res.status(201).json({ success: true, data: company });
  } catch (error) {
    console.error('Error creating company:', error);
    return res.status(500).json({ success: false, error: 'Failed to create company' });
  }
});

// Update company endpoint with validation
app.put('/api/companies/:id', authMiddleware, async (req, res) => {
  // Validate ID param
  const idResult = idParamSchema.safeParse(req.params);
  if (!idResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: idResult.error.flatten()
    });
  }
  // Validate input
  const parseResult = updateCompanySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: parseResult.error.flatten()
    });
  }
  const { id } = idResult.data;
  try {
    const company = await prisma.company.update({ where: { id }, data: parseResult.data });
    return res.status(200).json({ success: true, data: company });
  } catch (error) {
    console.error('Error updating company:', error);
    return res.status(500).json({ success: false, error: 'Failed to update company' });
  }
});

// Departments endpoints
app.get('/api/departments', async (req, res) => {
  try {
    const { companyId, withPositions } = req.query;

    const departments = await prisma.department.findMany({
      where: companyId ? { companyId: String(companyId) } : undefined,
      include: {
      company: true,
        ...(withPositions === 'true' && {
          positions: {
            include: {
              position: true,
            }
          }
        })
      },
      orderBy: { name: 'asc' }
    });

    return res.status(200).json({ success: true, data: departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch departments' });
  }
});

// Get department by ID endpoint with validation
app.get('/api/departments/:id', authMiddleware, async (req, res) => {
  // Validate ID param
  const parseResult = idParamSchema.safeParse(req.params);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: parseResult.error.flatten()
    });
  }
  const { id } = parseResult.data;
  try {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        company: true,
        positions: { include: { position: true } }
      }
    });
    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    return res.status(200).json({ success: true, data: department });
  } catch (error) {
    console.error('Error getting department:', error);
    return res.status(500).json({ success: false, error: 'Failed to get department' });
  }
});

// Zod schemas for validation
const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  companyId: z.string().min(1, 'Company ID is required'),
  positionIds: z.array(z.string()).optional()
});

const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  positionIds: z.array(z.string()).optional()
});

const createPositionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  salaryRange: z.string().optional(),
  employmentType: z.string().optional(),
  departmentId: z.string().min(1, 'Department ID is required')
});

const updatePositionSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  salaryRange: z.string().optional(),
  employmentType: z.string().optional(),
  departmentId: z.string().optional(),
  companyId: z.string().optional(),
  expectedStartDate: z.string().optional(),
  languageRequirements: z.string().optional(),
  responsibilities: z.string().optional(),
  interviewQuestions: z.array(z.string()).optional()
});

app.post('/api/departments', authMiddleware, async (req, res) => {
  try {
    // Validate input
    const parseResult = createDepartmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parseResult.error.flatten()
      });
    }
    const { name, description, companyId, positionIds = [] } = parseResult.data;
    // Create department in database
    const department = await prisma.department.create({
      data: {
        name,
        description,
        companyId,
        positions: {
          create: positionIds.map(positionId => ({
            position: { connect: { id: positionId } }
          }))
        }
      },
      include: {
        company: true,
        positions: { include: { position: true } }
      }
    });
    return res.status(201).json({ success: true, data: department });
  } catch (error) {
    console.error('Error creating department:', error);
    return res.status(500).json({ success: false, error: 'Failed to create department' });
  }
});

// Positions endpoints
app.get('/api/positions', async (req, res) => {
  try {
    const { departmentId } = req.query;

    const positions = await prisma.position.findMany({
      where: departmentId ? {
                departments: {
          some: { departmentId: String(departmentId) }
        }
      } : undefined,
          include: {
        company: true,
            departments: {
        include: {
            department: {
              include: {
                company: true
              }
            }
          }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

    return res.status(200).json({ success: true, data: positions });
  } catch (error) {
    console.error('Error fetching positions:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch positions' });
  }
});

// Get position by ID endpoint with validation
app.get('/api/positions/:id', authMiddleware, async (req, res) => {
  // Validate ID param
  const parseResult = idParamSchema.safeParse(req.params);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: parseResult.error.flatten()
    });
  }
  const { id } = parseResult.data;
  try {
    const position = await prisma.position.findUnique({ where: { id } });
    if (!position) {
      return res.status(404).json({ success: false, error: 'Position not found' });
    }
    return res.status(200).json({ success: true, data: position });
  } catch (error) {
    console.error('Error getting position:', error);
    return res.status(500).json({ success: false, error: 'Failed to get position' });
  }
});

// Database stats endpoint
app.get('/api/db/stats', authMiddleware, async (req, res) => {
  try {
    console.log('Getting database stats');
    
    // Get table names from Prisma
    const tableNames = [
      'admins',
      'companies',
      'departments',
      'positions',
      'candidates',
      'interviews',
      'bots',
      'industry_tags'
    ];
    
    // Create simple table info
    const tables = [];
    let totalRows = 0;
    let totalSize = 0;
    
    // Get counts for each table
    for (const tableName of tableNames) {
      try {
        // Convert table name to model name (e.g., 'admins' -> 'admin')
        const modelName = tableName === 'industry_tags' ? 'industryTag' : 
          tableName.endsWith('s') ? tableName.slice(0, -1) : tableName;
        
        // Check if model exists in prisma
        if (prisma[modelName]) {
          const count = await prisma[modelName].count();
          
          // Add to tables array
          tables.push({
            table_name: tableName,
            row_count: count,
            size_bytes: count * 1000, // Rough estimate
            last_updated: new Date().toISOString()
          });
          
          totalRows += count;
          totalSize += count * 1000;
        }
      } catch (err) {
        console.error(`Error getting count for ${tableName}:`, err);
      }
    }
    
    // Get recent activity
    const recentCompanies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });
    
    const recentDepartments = await prisma.department.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        name: true,
        createdAt: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });
    
    const recentPositions = await prisma.position.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        createdAt: true
      }
    });
    
    // Format recent activity
    const recentActivity = [
      ...recentCompanies.map(company => ({
        id: company.id,
        type: 'company',
        name: company.name,
        company: null,
        action: 'created',
        date: company.createdAt.toISOString()
      })),
      ...recentDepartments.map(dept => ({
        id: dept.id,
        type: 'department',
        name: dept.name,
        company: dept.company?.name || null,
        action: 'created',
        date: dept.createdAt.toISOString()
      })),
      ...recentPositions.map(position => ({
        id: position.id,
        type: 'job',
        name: position.title,
        action: 'created',
        date: position.createdAt.toISOString()
      }))
    ]
    // Sort by date, newest first
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    // Take the 5 most recent
    .slice(0, 5);
    
    // Return stats in the expected format
    return res.status(200).json({
      success: true,
      data: {
        tables,
        totalTables: tables.length,
        totalRows,
        totalSize,
        lastUpdated: new Date().toISOString(),
        databaseSize: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`,
        connectionStatus: 'connected',
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error getting database stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get database stats'
    });
  }
});

// Dashboard statistics endpoint
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Parallel counts
    const [
      companyCount,
      departmentCount,
      positionCount,
      candidateCount,
      interviewCount,
      botCount,
      adminCount
    ] = await Promise.all([
      prisma.company.count(),
      prisma.department.count(),
      prisma.position.count(),
      prisma.candidate.count(),
      prisma.interview.count(),
      prisma.bot.count({ where: { active: true } }),
      prisma.admin.count()
    ]);
    
    // Build recent activity (last created entities)
    const [recentCompanies, recentPositions, recentDepartments] = await Promise.all([
      prisma.company.findMany({ orderBy: { createdAt: 'desc' }, take: 3, select: { id: true, name: true, createdAt: true } }),
      prisma.position.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          title: true,
          createdAt: true,
          company: {
            select: { name: true }
          }
        }
      }),
      prisma.department.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          name: true,
          createdAt: true,
          company: { select: { name: true } }
        }
      })
    ]);

    const recentActivity = [
      ...recentCompanies.map(c => ({ id: c.id, type: 'company', name: c.name, company: undefined, action: 'created', date: c.createdAt })),
      ...recentPositions.map(p => ({ id: p.id, type: 'job', name: p.title, company: p.company?.name, action: 'created', date: p.createdAt })),
      ...recentDepartments.map(d => ({ id: d.id, type: 'department', name: d.name, company: d.company?.name, action: 'created', date: d.createdAt }))
    ].sort((a,b)=> new Date(b.date) - new Date(a.date)).slice(0,5);

    const stats = {
        companies: companyCount,
        departments: departmentCount,
        positions: positionCount,
      jobs: positionCount,
        bots: botCount,
      admins: adminCount,
        candidates: candidateCount,
        interviews: interviewCount,
      applications: candidateCount,
      conversionRate: companyCount > 0 ? Math.min(100, Math.round((candidateCount / (positionCount || 1)) * 10)) : 0,
      activeDeals: 0,
      recentActivity
    };

    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// Auth verification endpoint
app.get('/api/auth/verify', authMiddleware, async (req, res) => {
  try {
    // Allow mock admin data only when explicitly enabled
    if (process.env.ENABLE_MOCK_AUTH === 'true') {
      return res.status(200).json({
        success: true,
        admin: {
          id: 'mock-admin-id',
          email: 'admin@example.com',
          isSuperAdmin: true
        }
      });
    }
    
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get admin from database
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id }
      });
      
      if (!admin) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      }
      
      // Return admin data (without password)
      const { passwordHash, ...adminData } = admin;
      return res.status(200).json({
        success: true,
        admin: adminData
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during token verification'
    });
  }
});

// Entity Validation Routes
app.get('/api/validation/entity/:type/:id', authMiddleware, entityValidationHandler.validateEntity);
app.put('/api/validation/entity/:type/:id', authMiddleware, entityValidationHandler.updateEntityFields);
app.post('/api/validation/campaign-entities', authMiddleware, entityValidationHandler.validateCampaignEntities);
app.get('/api/validation/required-fields/:type', authMiddleware, entityValidationHandler.getRequiredFieldsConfig);

// Industry Tags endpoints
app.get('/api/industry-tags', authMiddleware, async (req, res) => {
  try {
    console.log('Getting all industry tags');
    
    // Get industry tags from database
    const tags = await prisma.industryTag.findMany({
      orderBy: { name: 'asc' }
    });
    
    return res.status(200).json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('Error getting industry tags:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get industry tags'
    });
  }
});

// Files endpoints
// Get file by ID endpoint with validation
app.get('/api/files/:id', authMiddleware, async (req, res) => {
  // Validate ID param
  const parseResult = idParamSchema.safeParse(req.params);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: parseResult.error.flatten()
    });
  }
  const { id } = parseResult.data;
  try {
    const file = await prisma.fileStorage.findUnique({ where: { id } });
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    res.setHeader('Content-Type', file.fileType);
    res.setHeader('Content-Length', file.fileSize);
    return res.send(file.fileData);
  } catch (error) {
    console.error('Error getting file:', error);
    return res.status(500).json({ success: false, error: 'Failed to get file' });
  }
});

// File upload endpoint with validation (multipart/form-data, so only companyId can be validated)
const uploadFileSchema = z.object({
  companyId: z.string().optional(),
  positionId: z.string().optional()
});
app.post('/api/files', authMiddleware, upload.single('file'), async (req, res) => {
  // Validate companyId if present
  const parseResult = uploadFileSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: parseResult.error.flatten()
    });
  }
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const { buffer, originalname, mimetype, size } = req.file;
    const { companyId, positionId } = parseResult.data;
    const file = await prisma.fileStorage.create({
      data: {
        fileName: originalname,
        fileType: mimetype,
        fileData: buffer,
        fileSize: size,
        companyId: companyId || null
      }
    });

    // If a positionId is supplied trigger document-training pipeline
    if (positionId) {
      try {
        await trainDocumentUpload(buffer, originalname, mimetype, positionId);
      } catch (trainErr) {
        console.error('Document training failed:', trainErr);
        // Do NOT fail the whole request – the raw file is already saved.
      }
    }

    return res.status(201).json({
      success: true,
      data: {
        id: file.id,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        companyId: file.companyId,
        uploadedAt: file.uploadedAt
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ success: false, error: 'Failed to upload file' });
  }
});

// Update department endpoint with validation
app.put('/api/departments/:id', authMiddleware, async (req, res) => {
  try {
    // Validate input
    const parseResult = updateDepartmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parseResult.error.flatten()
      });
    }
    const { name, description, positionIds = [] } = parseResult.data;
    const { id } = req.params;
    // Update department in database
    const department = await prisma.department.update({
      where: { id },
      data: {
        name,
        description,
        // Optionally update positions if provided
        ...(positionIds.length > 0 && {
          positions: {
            set: [], // Remove all existing
            create: positionIds.map(positionId => ({
              position: { connect: { id: positionId } }
            }))
          }
        })
      },
      include: {
        company: true,
        positions: { include: { position: true } }
      }
    });
    return res.status(200).json({ success: true, data: department });
  } catch (error) {
    console.error('Error updating department:', error);
    return res.status(500).json({ success: false, error: 'Failed to update department' });
  }
});

// Create position endpoint with validation and inheritance
app.post('/api/positions', authMiddleware, async (req, res) => {
  try {
    console.log('🚀 Creating position with data:', req.body);
    
    // Validate input
    const parseResult = createPositionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parseResult.error.flatten()
      });
    }
    const { title, description, salaryRange, employmentType, departmentId } = parseResult.data;
    
    console.log('📋 Validated data:', { title, description, salaryRange, employmentType, departmentId });
    
    // Apply inheritance from parent entities
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: { company: true }
    });
    
    console.log('🏢 Department found:', department ? {
      id: department.id,
      name: department.name,
      companyId: department.companyId,
      company: department.company ? {
        id: department.company.id,
        name: department.company.name,
        city: department.company.city,
        country: department.company.country
      } : null
    } : 'No department found');
    
    let positionData = {
      title,
      description,
      salaryRange,
      employmentType
    };
    
    // Inherit location data from company if not provided
    if (department?.company) {
      const company = department.company;
      
      console.log('🔧 Applying inheritance from company:', {
        city: company.city,
        country: company.country
      });
      
      // Inherit location if missing
      if (!req.body.location && (company.city || company.country)) {
          positionData.location = `${company.city}, ${company.country}`;
      }
      
      // Inherit city if missing
      if (!req.body.city && company.city) {
        positionData.city = company.city;
      }
      
      // Inherit country if missing
      if (!req.body.country && company.country) {
        positionData.country = company.country;
      }
    }
    
    console.log('✅ Position data with inheritance:', positionData);
    
    // Create position and connect to department; also set companyId for direct link
    const position = await prisma.position.create({
      data: {
        ...positionData,
        companyId: department?.companyId || null,
        departments: {
          create: [{ department: { connect: { id: departmentId } } }]
        }
      }
    });
    
    console.log(`✅ Created position "${position.title}" with inherited data:`, {
      id: position.id,
      location: position.location,
      city: position.city,
      country: position.country
    });
    
    return res.status(201).json({ success: true, data: position });
  } catch (error) {
    console.error('❌ Error creating position:', error);
    return res.status(500).json({ success: false, error: 'Failed to create position' });
  }
});

// Update position endpoint with validation and inheritance
app.put('/api/positions/:id', authMiddleware, async (req, res) => {
  try {
    // Validate input
    const parseResult = updatePositionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parseResult.error.flatten()
      });
    }
    const { title, description, salaryRange, employmentType, departmentId, companyId, expectedStartDate, languageRequirements, responsibilities, interviewQuestions } = parseResult.data;
    const { id } = req.params;
    
    // Get current position with department and company data
    const currentPosition = await prisma.position.findUnique({
      where: { id },
      include: {
        departments: {
          include: {
            department: {
              include: {
                company: true
              }
            }
          }
        }
      }
    });
    
    if (!currentPosition) {
      return res.status(404).json({
        success: false,
        error: 'Position not found'
      });
    }
    
    let updateData = {
      title,
      description,
      salaryRange,
      employmentType,
      expectedStartDate: expectedStartDate ? new Date(expectedStartDate) : undefined,
      languageRequirements,
      responsibilities,
      interviewQuestions
    };

    // Apply explicit companyId if provided
    if (companyId) {
      updateData.companyId = companyId;
    }

    // Handle department change: reset join table to only new department
    let departmentConnectOps = undefined;
    if (departmentId) {
      departmentConnectOps = {
        set: [],
        create: [{ department: { connect: { id: departmentId } } }]
      };
    }
    
    // Determine department to use for inheritance (newly supplied or existing)
    const department = departmentId ? await prisma.department.findUnique({ where: { id: departmentId }, include: { company: true } }) : currentPosition.departments[0]?.department;
    
    // Apply inheritance from parent entities if fields are missing
    if (department?.company) {
      const company = department.company;
      
      // Inherit location if missing and not provided in update
      if (!currentPosition.location && !req.body.location && (company.city || company.country)) {
          updateData.location = `${company.city}, ${company.country}`;
      }
      
      // Inherit city if missing and not provided in update
      if (!currentPosition.city && !req.body.city && company.city) {
        updateData.city = company.city;
      }
      
      // Inherit country if missing and not provided in update
      if (!currentPosition.country && !req.body.country && company.country) {
        updateData.country = company.country;
      }

      // If position lacks companyId and not explicitly provided, set from department
      if (!updateData.companyId && (!currentPosition.companyId || departmentId) && department.companyId) {
        updateData.companyId = department.companyId;
      }
    }
    
    // Update position in database
    const position = await prisma.position.update({
      where: { id },
      data: {
        ...updateData,
        departments: departmentConnectOps
      }
    });
    
    console.log(`✅ Updated position "${position.title}" with inherited data:`, {
      location: updateData.location,
      city: updateData.city,
      country: updateData.country
    });
    
    return res.status(200).json({ success: true, data: position });
  } catch (error) {
    console.error('Error updating position:', error);
    return res.status(500).json({ success: false, error: 'Failed to update position' });
  }
});

// Zod schema for validating ID params
const idParamSchema = z.object({ id: z.string().min(1, 'ID is required') });

// Delete department endpoint with validation
app.delete('/api/departments/:id', authMiddleware, async (req, res) => {
  // Validate ID param
  const parseResult = idParamSchema.safeParse(req.params);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: parseResult.error.flatten()
    });
  }
  const { id } = parseResult.data;
  try {
    // Delete department from database
    await prisma.department.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete department' });
  }
});

// Delete position endpoint with validation
app.delete('/api/positions/:id', authMiddleware, async (req, res) => {
  // Validate ID param
  const parseResult = idParamSchema.safeParse(req.params);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: parseResult.error.flatten()
    });
  }
  const { id } = parseResult.data;
  try {
    // Delete position from database
    await prisma.position.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Position deleted successfully' });
  } catch (error) {
    console.error('Error deleting position:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete position' });
  }
});

// Delete company endpoint with validation
app.delete('/api/companies/:id', authMiddleware, async (req, res) => {
  // Validate ID param
  const parseResult = idParamSchema.safeParse(req.params);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: parseResult.error.flatten()
    });
  }
  const { id } = parseResult.data;
  try {
    // Delete company from database
    await prisma.company.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete company' });
  }
});

// Delete file endpoint with validation
app.delete('/api/files/:id', authMiddleware, async (req, res) => {
  // Validate ID param
  const parseResult = idParamSchema.safeParse(req.params);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: parseResult.error.flatten()
    });
  }
  const { id } = parseResult.data;
  try {
    // Delete file from database
    await prisma.fileStorage.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete file' });
  }
});

// PATCH endpoints (example for company)
app.patch('/api/companies/:id', authMiddleware, async (req, res) => {
  // Validate ID param
  const idResult = idParamSchema.safeParse(req.params);
  if (!idResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: idResult.error.flatten()
    });
  }
  // Validate input
  const parseResult = updateCompanySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: parseResult.error.flatten()
    });
  }
  const { id } = idResult.data;
  try {
    const company = await prisma.company.update({ where: { id }, data: parseResult.data });
    return res.status(200).json({ success: true, data: company });
  } catch (error) {
    console.error('Error patching company:', error);
    return res.status(500).json({ success: false, error: 'Failed to patch company' });
  }
});

// AI Endpoints
app.post('/api/ai/chat', aiHandler.chat);
app.post('/api/ai/embedding', aiHandler.embedding);

// Webhook setup & removal
// app.post('/api/bots/:id/webhook', authMiddleware, botHandler.setupWebhook); // Removed as per edit hint
// app.delete('/api/bots/:id/webhook', authMiddleware, botHandler.removeWebhook); // Removed as per edit hint

// Deep-link: create candidate & return Telegram start link
app.post('/api/bots/:id/deeplink', async (req, res) => {
  try {
    const { id } = req.params;
    const { positionId, fullName } = req.body;

    if (!id || !positionId) {
      return res.status(400).json({ success: false, error: 'Bot ID and positionId required' });
    }

    let bot = await prisma.bot.findUnique({ where: { id } });
    if (!bot) return res.status(404).json({ success:false, error:'Bot not found' });

    // If bot username is null, fetch via Telegram API and persist
    if (!bot.username) {
      try {
        const tgResp = await fetch(`https://api.telegram.org/bot${bot.token}/getMe`);
        const tgData = await tgResp.json();
        if (tgData.ok && tgData.result?.username) {
          bot = await prisma.bot.update({ where: { id: bot.id }, data: { username: tgData.result.username } });
        }
      } catch (e) {
        console.warn('Could not fetch bot username from Telegram:', e);
      }
    }

    const position = await prisma.position.findUnique({ where: { id: positionId } });
    if (!position) return res.status(404).json({ success:false, error:'Position not found' });

    // Generate unique token
    const token = uuidv4();

    // Pre-create candidate row
    const candidate = await prisma.candidate.create({
      data: {
        fullName: fullName || null,
        positionId: position.id,
        botId: bot.id,
        status: 'new',
        startToken: token
      }
    });

    // Build deep link – if bot.username exists use it, else return token only (client can append)
    const link = bot.username ? `https://t.me/${bot.username}?start=${token}` : token;

    return res.status(201).json({ success: true, data: { link, token, candidateId: candidate.id } });
  } catch (error) {
    console.error('DeepLink error:', error);
    return res.status(500).json({ success:false, error:'Internal error' });
  }
});

// Start the server
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('No REDIS_URL provided, using in-memory cache');
    console.log('Checking if database needs seeding...');
  });
}

// Handle server shutdown gracefully
if (process.env.NODE_ENV !== 'test') {
  process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    // Close database connection if it exists
    if (prisma) {
      await prisma.$disconnect();
      console.log('Database connection closed');
    }
    server.close(() => {
      console.log('Server shutdown complete');
      process.exit(0);
    });
  });
}

// ----------------- Training Session Endpoints -----------------

const createTrainingSessionSchema = z.object({
  adminId: z.string().min(1, 'Admin ID is required'),
  positionId: z.string().min(1, 'Position ID is required'),
  sessionName: z.string().optional()
});

// Create training session
app.post('/api/training-sessions', authMiddleware, async (req, res) => {
  const parseResult = createTrainingSessionSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ success: false, error: 'Validation error', details: parseResult.error.flatten() });
  }
  try {
    const { adminId, positionId, sessionName } = parseResult.data;
    const session = await prisma.trainingSession.create({
      data: { adminId, positionId, sessionName }
    });
    return res.status(201).json({ success: true, data: session });
  } catch (err) {
    console.error('Error creating training session:', err);
    return res.status(500).json({ success: false, error: 'Failed to create session' });
  }
});

// List sessions for a position (or all)
app.get('/api/training-sessions', authMiddleware, async (req, res) => {
  try {
    const { positionId, adminId } = req.query;
    const sessions = await prisma.trainingSession.findMany({
      where: {
        ...(positionId ? { positionId: String(positionId) } : {}),
        ...(adminId ? { adminId: String(adminId) } : {})
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({ success: true, data: sessions });
  } catch (err) {
    console.error('Error fetching sessions:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
});

// ----------------- Position Document Info Endpoint -----------------

app.get('/api/positions/:id/documents', authMiddleware, async (req, res) => {
  const parseResult = idParamSchema.safeParse(req.params);
  if (!parseResult.success) {
    return res.status(400).json({ success: false, error: 'Validation error', details: parseResult.error.flatten() });
  }
  const { id } = parseResult.data;
  try {
    const docs = await prisma.document.findMany({
      where: { positionId: id },
      include: { _count: { select: { chunks: true } } },
      orderBy: { uploadedAt: 'desc' }
    });

    // Aggregate counts
    const totalChunks = docs.reduce((sum, d) => sum + (d._count?.chunks || 0), 0);
    
    return res.status(200).json({ success: true, data: { documents: docs, totalChunks } });
  } catch (err) {
    console.error('Error fetching documents for position:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch documents' });
  }
});

// ----------------- NEW: public deep-link by position -----------------

app.post('/api/positions/:id/deeplink', async (req, res) => {
  try {
    const { id: positionId } = req.params;
    const { fullName } = req.body ?? {};
    
    if (!positionId) {
      return res.status(400).json({ success: false, error: 'positionId required' });
    }

    // 1. Load position with its first company id
    const position = await prisma.position.findUnique({
      where: { id: positionId },
      include: {
        departments: {
          include: {
            department: { include: { company: true } }
          }
        }
      }
    });

    if (!position) return res.status(404).json({ success: false, error: 'Position not found' });

    const company = position.departments?.[0]?.department?.company;
    if (!company) return res.status(404).json({ success: false, error: 'Company for position not found' });

    const companyId = company.id;

    // 2. Find a bot linked via the NEW join table first
    let bot = await prisma.bot.findFirst({
      where: {
        companyBots: {
          some: { companyId }
        },
        active: true
      }
    });

    // If not found, look for a bot owned by the company admin (legacy 1-to-1 mapping)
    if (!bot) {
      bot = await prisma.bot.findFirst({
        where: {
          adminId: company.adminId,
          active: true
        }
      });
    }

    // If still not found, look for a bot whose legacy company_id equals this company
    if (!bot) {
      bot = await prisma.bot.findFirst({
        where: {
          company_id: companyId,
          active: true
        }
    });
    }

    // Final fallback – any bot whose admin manages the company (deep legacy)
    if (!bot) {
      bot = await prisma.bot.findFirst({
        where: {
          admin: {
            companies: {
              some: { id: companyId }
            }
          },
          active: true
        }
      });
    }

    if (!bot) {
      return res.status(404).json({ success: false, error: 'No bot configured for this company' });
  }

    // Ensure bot.username is cached
    let botUsername = bot.username;
    if (!botUsername) {
      try {
        const tgResp = await fetch(`https://api.telegram.org/bot${bot.token}/getMe`);
        const tgData = await tgResp.json();
        if (tgData.ok && tgData.result?.username) {
          botUsername = tgData.result.username;
          await prisma.bot.update({ where: { id: bot.id }, data: { username: botUsername } });
        }
      } catch { /* swallow */ }
    }

    // 3. Create candidate row & token
    const { v4: uuidv4 } = await import('uuid');
    const token = uuidv4();

    const candidate = await prisma.candidate.create({
      data: {
        fullName: fullName || null,
        positionId: position.id,
        botId: bot.id,
        status: 'new',
        startToken: token
      }
    });

    const link = botUsername ? `https://t.me/${botUsername}?start=${token}` : token;

    return res.status(201).json({ success: true, data: { link, token, candidateId: candidate.id, botId: bot.id } });
  } catch (error) {
    console.error('Position deep-link error:', error);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
  });

export { app }; 
import { createLogger } from './logger';
import { env } from './env';

// Create a logger for Prisma
const logger = createLogger('prisma');
// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Import PrismaClient based on environment
let PrismaClient: any;

// In browser environments, we'll use a mock PrismaClient
class MockPrismaClient {
  // Model properties
  admin: any;
  company: any;
  job: any;
  department: any;
  position: any;
  fileStorage: any;
  
  // Mock data for browser environment
  private mockData = {
    admin: [
      {
        id: 'mock-admin-id',
        email: 'admin@example.com',
        passwordHash: '$2a$10$mockPasswordHash',
        isSuperAdmin: true,
        createdAt: new Date().toISOString(),
      }
    ],
    company: [
      {
        id: 'mock-company-1',
        name: 'Mock Company 1',
        description: 'A mock company for testing',
        logoUrl: null,
        adminId: 'mock-admin-id',
        createdAt: new Date().toISOString(),
        address: '123 Mock St',
        city: 'Mock City',
        country: 'Mockland',
        phone: '+1-555-MOCK',
        email: 'info@mockcompany.com',
        color: '#FF5733',
      },
      {
        id: 'mock-company-2',
        name: 'Mock Company 2',
        description: 'Another mock company',
        logoUrl: null,
        adminId: 'mock-admin-id',
        createdAt: new Date().toISOString(),
        address: '456 Test Ave',
        city: 'Test City',
        country: 'Testland',
        phone: '+1-555-TEST',
        email: 'info@testcompany.com',
        color: '#33FF57',
      }
    ],
    job: [
      {
        id: 'mock-job-1',
        title: 'Mock Developer',
        description: 'A mock job for testing',
        location: 'Mock City, Mockland',
        salary: '$100,000 - $150,000',
        type: 'Full-time',
        companyId: 'mock-company-1',
        postedAt: new Date().toISOString(),
      },
      {
        id: 'mock-job-2',
        title: 'Mock Designer',
        description: 'Another mock job',
        location: 'Test City, Testland',
        salary: '$80,000 - $120,000',
        type: 'Full-time',
        companyId: 'mock-company-2',
        postedAt: new Date().toISOString(),
      }
    ]
  };

  constructor() {
    logger.warn('Using mock PrismaClient in browser environment');
    
    // Create proxy handlers for each model
    const modelHandler = (modelName: string) => ({
      findUnique: async (args: any) => {
        logger.debug(`Mock ${modelName}.findUnique called with`, args);
        if (!args.where || !args.where.id) return null;
        return this.mockData[modelName as keyof typeof this.mockData]?.find(item => item.id === args.where.id) || null;
      },
      findFirst: async (args: any) => {
        logger.debug(`Mock ${modelName}.findFirst called`);
        return this.mockData[modelName as keyof typeof this.mockData]?.[0] || null;
      },
      findMany: async (args: any) => {
        logger.debug(`Mock ${modelName}.findMany called`);
        const data = this.mockData[modelName as keyof typeof this.mockData] || [];
        
        // Handle include for relations
        if (args && args.include) {
          return data.map((item: any) => {
            const result = { ...item };
            
            // Handle includes for each relation
            Object.keys(args.include).forEach(relationName => {
              if (relationName === 'jobs' && modelName === 'company') {
                result.jobs = this.mockData.job.filter((job: any) => job.companyId === item.id);
              }
              // Add other relations as needed
            });
            
            return result;
          });
        }
        
        return data;
      },
      create: async (args: any) => {
        logger.debug(`Mock ${modelName}.create called`);
        const newItem = {
          id: `mock-${modelName}-${Date.now()}`,
          ...args.data,
          createdAt: new Date().toISOString(),
        };
        return newItem;
      },
      update: async (args: any) => {
        logger.debug(`Mock ${modelName}.update called`);
        return { id: args.where.id, ...args.data };
      },
      delete: async (args: any) => {
        logger.debug(`Mock ${modelName}.delete called`);
        return { id: args.where.id };
      },
      count: async () => {
        logger.debug(`Mock ${modelName}.count called`);
        return this.mockData[modelName as keyof typeof this.mockData]?.length || 0;
      }
    });
    
    // Create model proxies
    this.admin = new Proxy({}, { get: (_, prop) => modelHandler('admin')[prop as string] });
    this.company = new Proxy({}, { get: (_, prop) => modelHandler('company')[prop as string] });
    this.job = new Proxy({}, { get: (_, prop) => modelHandler('job')[prop as string] });
    this.department = new Proxy({}, { get: (_, prop) => modelHandler('department')[prop as string] });
    this.position = new Proxy({}, { get: (_, prop) => modelHandler('position')[prop as string] });
    this.fileStorage = new Proxy({}, { get: (_, prop) => modelHandler('fileStorage')[prop as string] });
  }

  $connect() {
    logger.debug('Mock $connect called');
    return Promise.resolve();
  }

  $disconnect() {
    logger.debug('Mock $disconnect called');
    return Promise.resolve();
  }

  $queryRaw() {
    logger.debug('Mock $queryRaw called');
    return Promise.resolve([]);
  }

  $transaction(callback: any) {
    logger.debug('Mock $transaction called');
    return Promise.resolve(callback(this));
  }
}

// Set up the appropriate PrismaClient based on environment
if (isBrowser) {
  // Use mock client in browser
  PrismaClient = MockPrismaClient;
} else {
  // Use real client in Node.js
  // For now, use MockPrismaClient in server-side as well until Prisma is properly set up
  logger.warn('Using MockPrismaClient on server side - Prisma not configured');
  PrismaClient = MockPrismaClient;
}

// Create a singleton instance of PrismaClient
let prismaInstance: any;

// In browser, we don't need to worry about connection limits
if (isBrowser) {
  prismaInstance = new PrismaClient();
} else {
  // In Node.js, we use the global object to prevent exhausting connection limits
  // PrismaClient is attached to the `global` object in development to prevent
  // exhausting your database connection limit.
  // Learn more: https://pris.ly/d/help/next-js-best-practices
  const globalForPrisma = global as unknown as { prisma: any };
  
  prismaInstance = globalForPrisma.prisma || 
    new PrismaClient({
      datasources: {
        db: {
          url: env.databaseUrl,
        },
      },
      log: env.isDevelopment ? ['error'] : ['error'],
    });

  // If we're not in production, attach prisma to the global object
  if (!env.isProduction) {
    globalForPrisma.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance;
export default prisma; 
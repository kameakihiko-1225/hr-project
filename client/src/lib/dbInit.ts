import { createLogger } from './logger';
import prisma from './prisma';
import { env } from './env';
import { authService } from '@/api/auth/authService';

// Create a logger for database initialization
const logger = createLogger('dbInit');

// Helper function to safely stringify objects with BigInt values
function safeStringify(obj: any): string {
  return JSON.stringify(obj, (_, value) => 
    typeof value === 'bigint' ? Number(value) : value
  );
}

/**
 * Initialize the database connection and schema
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    logger.info('Initializing database connection');
    
    // Test database connection
    await prisma.$connect();
    logger.info('Database connection established');
    
    // Verify database schema
    try {
      // Simple query to verify schema is properly set up
      await prisma.admin.findFirst();
      logger.info('Database schema verified');
    } catch (error) {
      if (error.message?.includes('does not exist')) {
        logger.error('Database schema not found. Please run migrations first.');
        return false;
      }
      throw error;
    }
    
    // Seed the database if in development mode
    if (env.isDevelopment) {
      await seedDatabase();
    }
    
    return true;
  } catch (error) {
    logger.error('Failed to initialize database', error);
    return false;
  }
}

/**
 * Seed the database with initial data for development
 */
export async function seedDatabase(): Promise<void> {
  try {
    logger.info('Checking if database needs seeding');
    
    // Check if any admin exists
    const adminCount = await prisma.admin.count();
    
    let adminId: string;
    
    if (adminCount === 0) {
      logger.info('No admins found, seeding database with initial admin');
      
      // Create a super admin
      const adminResult = await authService.register({
        email: 'admin@example.com',
        password: 'admin123', // This should be changed immediately in production
        isSuperAdmin: true,
      });
      
      // Get the admin ID from the database since the register function might not return it directly
      const createdAdmin = await prisma.admin.findUnique({
        where: { email: 'admin@example.com' }
      });
      
      adminId = createdAdmin?.id || '';
      
      logger.info('Created seed super admin: admin@example.com');
      logger.warn('Please change the default admin password immediately in production!');
    } else {
      // Get the first admin ID for reference
      const admin = await prisma.admin.findFirst();
      adminId = admin?.id || '';
      logger.info('Database already has admin accounts, skipping admin seeding');
    }
    
    // Seed industry tags if none exist
    const industryTagCount = await prisma.industryTag.count();
    
    if (industryTagCount === 0) {
      logger.info('Seeding industry tags');
      
      const industryTags = [
        { name: 'Technology' },
        { name: 'Healthcare' },
        { name: 'Finance' },
        { name: 'Education' },
        { name: 'Manufacturing' },
        { name: 'Retail' },
        { name: 'Hospitality' },
        { name: 'Transportation' },
        { name: 'Energy' },
        { name: 'Media' }
      ];
      
      await prisma.industryTag.createMany({
        data: industryTags
      });
      
      logger.info(`Created ${industryTags.length} industry tags`);
    }
    
    // Seed companies if none exist
    const companyCount = await prisma.company.count();
    
    if (companyCount === 0 && adminId) {
      logger.info('Seeding companies');
      
      const companies = [
        {
          name: 'Aurora Tech',
          description: 'A leading technology company',
          color: '#3b82f6',
          city: 'San Francisco',
          country: 'USA',
          adminId
        },
        {
          name: 'Horizon Healthcare',
          description: 'Innovative healthcare solutions',
          color: '#10b981',
          city: 'Boston',
          country: 'USA',
          adminId
        },
        {
          name: 'Global Finance',
          description: 'International financial services',
          color: '#f59e0b',
          city: 'New York',
          country: 'USA',
          adminId
        }
      ];
      
      // Create companies
      for (const companyData of companies) {
        const company = await prisma.company.create({
          data: companyData
        });
        
        logger.info(`Created company: ${company.name}`);
        
        // Get some industry tags for this company
        const industryTags = await prisma.industryTag.findMany({
          take: 2,
          skip: Math.floor(Math.random() * 8) // Random offset for variety
        });
        
        // Associate industries with company
        if (industryTags.length > 0) {
          for (const tag of industryTags) {
            await prisma.companyIndustry.create({
              data: {
                companyId: company.id,
                industryTagId: tag.id
              }
            });
          }
        }
        
        // Create departments for this company
        const departments = [
          {
            name: 'Engineering',
            description: 'Software development and infrastructure',
            companyId: company.id
          },
          {
            name: 'Marketing',
            description: 'Brand management and promotion',
            companyId: company.id
          },
          {
            name: 'Human Resources',
            description: 'Talent acquisition and management',
            companyId: company.id
          }
        ];
        
        for (const deptData of departments) {
          const department = await prisma.department.create({
            data: deptData
          });
          
          logger.info(`Created department: ${department.name} for ${company.name}`);
          
          // Create positions
          const positions = [
            {
              title: `${department.name} Manager`,
              description: `Leading the ${department.name} team`,
              salaryRange: '$80,000 - $120,000',
              employmentType: 'Full-time'
            },
            {
              title: `${department.name} Specialist`,
              description: `Supporting the ${department.name} team`,
              salaryRange: '$60,000 - $90,000',
              employmentType: 'Full-time'
            }
          ];
          
          for (const posData of positions) {
            // Create position
            const position = await prisma.position.create({
              data: posData
            });
            
            // Link position to department
            await prisma.departmentPosition.create({
              data: {
                departmentId: department.id,
                positionId: position.id
              }
            });
            
            logger.info(`Created position: ${position.title} for ${department.name}`);
          }
        }
      }
    }
    
  } catch (error) {
    logger.error('Error seeding database', error);
    throw error;
  }
}

/**
 * Clean up database connections
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    logger.info('Disconnecting from database');
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting from database', error);
    throw error;
  }
} 
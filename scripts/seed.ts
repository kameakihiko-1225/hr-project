import { createLogger } from '../src/lib/logger';
import { seedDatabase } from '../src/lib/dbInit';
import { env } from '../src/lib/env';
import prisma from '../src/lib/prisma';

// Create a logger for seeding
const logger = createLogger('seed');

/**
 * Seed the database with initial data
 */
async function seed() {
  try {
    logger.info('Starting database seeding');
    
    // Check if we're in production
    if (env.isProduction) {
      logger.warn('Running seed in production environment');
      
      // Confirm seeding in production
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise<string>((resolve) => {
        readline.question('Are you sure you want to seed the production database? (y/N): ', resolve);
      });
      
      readline.close();
      
      if (answer.toLowerCase() !== 'y') {
        logger.info('Database seeding cancelled');
        process.exit(0);
      }
    }
    
    // Connect to database
    await prisma.$connect();
    
    // Run seeding
    await seedDatabase();
    
    // Additional seeding can be done here
    // For example, creating sample companies, departments, positions, etc.
    
    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed function
seed(); 
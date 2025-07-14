import { execSync } from 'child_process';
import { createLogger } from '../src/lib/logger';
import { env } from '../src/lib/env';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

// Create a logger for migrations
const logger = createLogger('migration');

const execAsync = promisify(exec);

/**
 * Run database migrations
 */
async function runMigrations() {
  try {
    logger.info('Starting database migrations');
    
    // Check if DATABASE_URL is set
    if (!env.databaseUrl || env.databaseUrl.includes('user:password')) {
      logger.error('Invalid DATABASE_URL. Please set a valid connection string in .env file');
      process.exit(1);
    }
    
    // Run Prisma migrations
    logger.info('Running Prisma migrations');
    const { stdout, stderr } = await execAsync('npx prisma migrate dev --name add_industry_tags');
    
    if (stderr) {
      logger.error('Migration error:', stderr);
    }
    
    logger.info('Migration output:', stdout);
    
    // Seed initial industry tags
    logger.info('Seeding initial industry tags...');
    const prisma = new PrismaClient();
    
    const defaultIndustryTags = [
      'Technology',
      'Healthcare',
      'Finance',
      'Education',
      'Manufacturing',
      'Retail',
      'Hospitality',
      'Transportation',
      'Energy',
      'Media',
      'Construction',
      'Agriculture',
      'Telecommunications',
      'Pharmaceuticals',
      'Real Estate'
    ];
    
    for (const tag of defaultIndustryTags) {
      await prisma.industryTag.upsert({
        where: { name: tag },
        update: {},
        create: { name: tag }
      });
    }
    
    logger.info(`Seeded ${defaultIndustryTags.length} industry tags`);
    
    await prisma.$disconnect();
    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Error running migrations', error);
    process.exit(1);
  }
}

/**
 * Create a new migration
 */
async function createMigration(name: string) {
  try {
    if (!name) {
      logger.error('Migration name is required');
      console.log('Usage: npm run migrate:create <migration-name>');
      process.exit(1);
    }
    
    logger.info(`Creating migration: ${name}`);
    
    // Create a new migration
    execSync(`npx prisma migrate dev --name ${name} --create-only`, { stdio: 'inherit' });
    
    logger.info(`Migration created: ${name}`);
    logger.info('Review the migration file before applying it');
  } catch (error) {
    logger.error('Error creating migration', error);
    process.exit(1);
  }
}

/**
 * Reset the database (development only)
 */
async function resetDatabase() {
  if (env.isProduction) {
    logger.error('Cannot reset database in production');
    process.exit(1);
  }
  
  try {
    logger.warn('Resetting database - ALL DATA WILL BE LOST');
    
    // Confirm reset
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('Are you sure you want to reset the database? This will delete all data. (y/N): ', (answer: string) => {
      if (answer.toLowerCase() !== 'y') {
        logger.info('Database reset cancelled');
        readline.close();
        process.exit(0);
      }
      
      readline.close();
      
      // Reset database
      logger.warn('Resetting database...');
      execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
      
      logger.info('Database reset completed');
    });
  } catch (error) {
    logger.error('Error resetting database', error);
    process.exit(1);
  }
}

// Parse command line arguments
const command = process.argv[2];
const arg = process.argv[3];

// Run appropriate command
switch (command) {
  case 'deploy':
    runMigrations();
    break;
  case 'create':
    createMigration(arg);
    break;
  case 'reset':
    resetDatabase();
    break;
  default:
    console.log('Usage:');
    console.log('  npm run migrate deploy - Run pending migrations');
    console.log('  npm run migrate create <name> - Create a new migration');
    console.log('  npm run migrate reset - Reset the database (development only)');
    process.exit(1);
} 
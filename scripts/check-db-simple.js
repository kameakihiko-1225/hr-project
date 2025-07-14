// Simple script to check database connection and content for all tables
import { PrismaClient } from '../generated/prisma/index.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function main() {
  console.log('Checking database connection...');
  
  // Log database connection status
  if (process.env.DATABASE_URL) {
    console.log('Using DATABASE_URL from environment variables');
    // Hide sensitive information when logging
    const sanitizedUrl = process.env.DATABASE_URL.replace(/\/\/.*?@/, '//***:***@');
    console.log(`Connection string: ${sanitizedUrl}`);
  } else {
    console.warn('DATABASE_URL not found in environment variables');
  }
  
  try {
    const prisma = new PrismaClient();
    console.log('Prisma client initialized');
    
    // Define all tables to check
    const tables = [
      { name: 'Admin', method: prisma.admin },
      { name: 'Company', method: prisma.company },
      { name: 'Department', method: prisma.department },
      { name: 'Position', method: prisma.position },
      { name: 'DepartmentPosition', method: prisma.departmentPosition },
      { name: 'FileStorage', method: prisma.fileStorage },
      { name: 'Bot', method: prisma.bot },
      { name: 'Candidate', method: prisma.candidate },
      { name: 'Interview', method: prisma.interview },
      { name: 'ChatSession', method: prisma.chatSession },
      { name: 'Document', method: prisma.document },
      { name: 'BitrixMapping', method: prisma.bitrixMapping },
      { name: 'CrmDeal', method: prisma.crmDeal },
      { name: 'SmsLog', method: prisma.smsLog },
      { name: 'MessageQueue', method: prisma.messageQueue },
      { name: 'IndustryTag', method: prisma.industryTag },
      { name: 'CompanyIndustry', method: prisma.companyIndustry },
      { name: 'MessageCampaign', method: prisma.messageCampaign },
      { name: 'ScheduledMessage', method: prisma.scheduledMessage }
    ];
    
    console.log('Starting database checks...');
    
    // Check each table
    for (const table of tables) {
      try {
        const count = await table.method.count();
        console.log(`✅ ${table.name}: ${count} records`);
        
        // Get a sample record if there are any
        if (count > 0) {
          const sample = await table.method.findFirst();
          console.log(`   Sample ID: ${sample.id}`);
        }
      } catch (error) {
        console.error(`❌ Error checking ${table.name}: ${error.message}`);
      }
    }
    
    // Check database version
    try {
      const dbInfo = await prisma.$queryRaw`SELECT current_database(), version();`;
      console.log('\nDatabase Information:');
      console.log(dbInfo);
    } catch (error) {
      console.error('Error getting database info:', error.message);
    }
    
    // Close connection
    await prisma.$disconnect();
    console.log('\nDatabase connection closed');
    
    return { success: true, message: 'Database connection and tables check successful!' };
  } catch (error) {
    console.error('Database connection failed:', error);
    return { success: false, message: 'Database connection failed', error };
  }
}

// Run the main function
main()
  .then((result) => {
    console.log(result.message);
    if (!result.success) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  }); 
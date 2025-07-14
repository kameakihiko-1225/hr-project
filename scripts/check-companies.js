import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkCompanies() {
  try {
    console.log('Checking companies in the database...');
    
    const companies = await prisma.company.findMany();
    
    console.log(`Found ${companies.length} companies:`);
    companies.forEach(company => {
      console.log(`- ${company.name} (ID: ${company.id})`);
    });
    
  } catch (error) {
    console.error('Error checking companies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCompanies(); 
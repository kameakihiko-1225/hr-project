import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function seedSampleData() {
  try {
    console.log('Seeding sample data...');
    
    // Get the admin user (assuming one exists)
    const admin = await prisma.admin.findFirst();
    
    if (!admin) {
      console.error('No admin user found. Please create an admin user first.');
      return;
    }
    
    // Create sample companies
    const companies = [
      {
        name: 'Acme Corporation',
        description: 'A global leader in innovative solutions',
        address: '123 Main St',
        city: 'New York',
        country: 'USA',
        phone: '+1-555-123-4567',
        email: 'info@acme.example.com',
        logoUrl: null,
        adminId: admin.id
      },
      {
        name: 'Globex Industries',
        description: 'Pioneering sustainable manufacturing',
        address: '456 Michigan Ave',
        city: 'Chicago',
        country: 'USA',
        phone: '+1-555-987-6543',
        email: 'info@globex.example.com',
        logoUrl: null,
        adminId: admin.id
      },
      {
        name: 'Initech Software',
        description: 'Enterprise software solutions',
        address: '789 Tech Blvd',
        city: 'Austin',
        country: 'USA',
        phone: '+1-555-456-7890',
        email: 'info@initech.example.com',
        logoUrl: null,
        adminId: admin.id
      }
    ];
    
    for (const companyData of companies) {
      // Check if company already exists
      const existingCompany = await prisma.company.findFirst({
        where: { name: companyData.name }
      });
      
      if (existingCompany) {
        console.log(`Company ${companyData.name} already exists, skipping...`);
        continue;
      }
      
      // Create company
      const company = await prisma.company.create({
        data: companyData
      });
      
      console.log(`Created company: ${company.name}`);
      
      // Create sample positions for this company
      const positionsSeed = [
        {
          title: `Software Engineer at ${company.name}`,
          description: 'Develop and maintain software applications',
          location: `${company.city}, ${company.country}`,
          salaryRange: '$80,000 - $120,000',
          employmentType: 'Full-time',
          companyId: company.id
        },
        {
          title: `Product Manager at ${company.name}`,
          description: 'Lead product development initiatives',
          location: `${company.city}, ${company.country}`,
          salaryRange: '$90,000 - $140,000',
          employmentType: 'Full-time',
          companyId: company.id
        },
        {
          title: `Marketing Specialist at ${company.name}`,
          description: 'Create and execute marketing campaigns',
          location: `${company.city}, ${company.country}`,
          salaryRange: '$60,000 - $90,000',
          employmentType: 'Full-time',
          companyId: company.id
        }
      ];
      
      for (const posData of positionsSeed) {
        const position = await prisma.position.create({
          data: posData
        });
        console.log(`Created position: ${position.title}`);
      }
    }
    
    console.log('Sample data seeded successfully!');
  } catch (error) {
    console.error('Error seeding sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSampleData(); 
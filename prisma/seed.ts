import { PrismaClient } from '../generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Check if admin exists
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: 'admin@example.com' }
  });
  
  let adminId: string;

  if (!existingAdmin) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password', salt);
    
    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email: 'admin@example.com',
        passwordHash,
        isSuperAdmin: true,
      }
    });
    
    adminId = admin.id;
    console.log(`Created admin: ${admin.email} (${admin.id})`);
  } else {
    adminId = existingAdmin.id;
    console.log(`Admin already exists: ${existingAdmin.email} (${existingAdmin.id})`);
  }
  
  // Check if test company exists
  const existingCompany = await prisma.company.findFirst({
    where: { name: 'Millat Umidi' }
  });

  if (!existingCompany) {
    // Create test company
    const company = await prisma.company.create({
      data: {
        name: 'Millat Umidi',
        color: '#B69B83',
        address: '123 Education St',
        city: 'Tashkent',
        country: 'Uzbekistan',
        email: 'contact@millatumidi.uz',
        phone: '+998 71 123 4567',
        description: 'A fast-growing education company in Uzbekistan',
        adminId
      }
    });

    console.log(`Created company: ${company.name} (${company.id})`);
  } else {
    console.log(`Company already exists: ${existingCompany.name} (${existingCompany.id})`);
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
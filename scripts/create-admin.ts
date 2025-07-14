import { PrismaClient } from '../generated/prisma/index.js';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createDefaultAdmin() {
  try {
    console.log('Creating default admin user...');
    
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: 'admin@example.com' }
    });
    
    if (existingAdmin) {
      console.log('Default admin already exists');
      return;
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash('password', 10);
    
    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email: 'admin@example.com',
        passwordHash,
        isSuperAdmin: true
      }
    });
    
    console.log(`Default admin created with ID: ${admin.id}`);
    console.log('Email: admin@example.com');
    console.log('Password: password');
  } catch (error) {
    console.error('Error creating default admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultAdmin(); 
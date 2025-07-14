import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

(async () => {
  const email = process.argv[2] || 'admin@gmail.com';
  const password = process.argv[3] || 'admin';
  try {
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      console.log(`Admin with email ${email} already exists (id=${existing.id})`);
      process.exit(0);
    }
    const hash = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({
      data: { email, passwordHash: hash, isSuperAdmin: true },
    });
    console.log('Created admin:', admin);
  } catch (e) {
    console.error('Failed to create admin', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})(); 
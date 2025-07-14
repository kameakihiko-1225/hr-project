import { PrismaClient } from '../generated/prisma/index.js';
const prisma = new PrismaClient();

(async () => {
  const positions = await prisma.position.findMany({
    where: { companyId: null },
    include: {
      departments: { include: { department: true } }
    }
  });
  console.log(`Found ${positions.length} positions without companyId`);
  for (const pos of positions) {
    const dept = pos.departments[0]?.department;
    if (dept?.companyId) {
      await prisma.position.update({ where: { id: pos.id }, data: { companyId: dept.companyId } });
      console.log(`Updated ${pos.id}`);
    }
  }
  await prisma.$disconnect();
})(); 
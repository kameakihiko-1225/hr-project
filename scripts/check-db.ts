import { PrismaClient } from '../generated/prisma/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('Checking database connection...');
  
  try {
    const prisma = new PrismaClient();
    
    // Test connection by querying for admins
    const adminCount = await prisma.admin.count();
    console.log(`Connection successful! Found ${adminCount} admin users.`);
    
    // Get database info
    const dbInfo = await prisma.$queryRaw`SELECT current_database(), version();`;
    console.log('Database info:', dbInfo);
    
    // Close connection
    await prisma.$disconnect();
    
    console.log('--- Departments ---');
    const departments = await prisma.department.findMany({
      include: { positions: { include: { position: true } } }
    });
    for (const dept of departments) {
      console.log(`Department: ${dept.name} (${dept.id})`);
      console.log('  Positions:', dept.positions.map(dp => dp.position && dp.position.title));
    }

    console.log('\n--- Positions ---');
    const positions = await prisma.position.findMany({
      include: { departments: { include: { department: true } } }
    });
    for (const pos of positions) {
      console.log(`Position: ${pos.title} (${pos.id})`);
      console.log('  Departments:', pos.departments.map(pd => pd.department && pd.department.name));
    }

    console.log('\n--- departmentPosition Join Table ---');
    const joins = await prisma.departmentPosition.findMany();
    for (const join of joins) {
      console.log(`DepartmentId: ${join.departmentId} <-> PositionId: ${join.positionId}`);
    }

    console.log('--- Department-Position Join Table Check ---');
    const departmentPositions = await prisma.department.findMany({
      include: {
        positions: {
          include: { position: true }
        }
      }
    });
    for (const dept of departmentPositions) {
      console.log(`Department: ${dept.name} (${dept.id})`);
      if (dept.positions.length === 0) {
        console.log('  No positions linked.');
      } else {
        for (const dp of dept.positions) {
          console.log(`  Linked Position: ${dp.position?.title} (${dp.position?.id})`);
        }
      }
    }
    console.log('--------------------------------------------');
    
    return { success: true, message: 'Database connection successful!' };
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

export default main; 
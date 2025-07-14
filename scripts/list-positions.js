import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function listPositions() {
  try {
    console.log('Listing all positions in the database:');
    
    const positions = await prisma.position.findMany({
      include: {
        departments: {
          include: {
            department: {
              include: {
                company: true
              }
            }
          }
        }
      }
    });
    
    if (positions.length > 0) {
      console.log(`Found ${positions.length} positions:`);
      
      positions.forEach((position, index) => {
        console.log(`\n--- Position ${index + 1} ---`);
        console.log(`ID: ${position.id}`);
        console.log(`Title: ${position.title}`);
        console.log(`Description: ${position.description || 'No description'}`);
        console.log(`Company: ${position.departments?.[0]?.department?.company?.name || 'Unknown'}`);
        console.log(`Department: ${position.departments?.[0]?.department?.name || 'Unknown'}`);
      });
    } else {
      console.log('No positions found in the database.');
    }
  } catch (err) {
    console.error('Error listing positions:', err);
  } finally {
    await prisma.$disconnect();
  }
}

listPositions(); 
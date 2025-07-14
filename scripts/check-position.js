import { PrismaClient } from '../generated/prisma/index.js';

const positionId = 'cbb2337c-5561-4565-8178-d53292733661';
const prisma = new PrismaClient();

async function checkPosition() {
  try {
    console.log(`Checking for position with ID: ${positionId}`);
    
    const position = await prisma.position.findUnique({
      where: { id: positionId },
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
    
    if (position) {
      console.log('✅ Position found:');
      console.log(`ID: ${position.id}`);
      console.log(`Title: ${position.title}`);
      console.log(`Description: ${position.description}`);
      console.log(`Company: ${position.departments?.[0]?.department?.company?.name || 'Unknown'}`);
      console.log(`Department: ${position.departments?.[0]?.department?.name || 'Unknown'}`);
    } else {
      console.log('❌ Position not found with ID:', positionId);
    }
  } catch (err) {
    console.error('Error checking position:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkPosition(); 
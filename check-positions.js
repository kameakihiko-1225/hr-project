import { PrismaClient } from './generated/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkPositions() {
  try {
    console.log('🔍 Checking all positions in database...');
    
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
    
    console.log(`\n📊 Found ${positions.length} positions:`);
    
    positions.forEach((position, index) => {
      console.log(`\n${index + 1}. ${position.title}`);
      console.log(`   ID: ${position.id}`);
      console.log(`   Company: ${position.departments?.[0]?.department?.company?.name || 'NOT SET'}`);
      console.log(`   Department: ${position.departments?.[0]?.department?.name || 'NOT SET'}`);
      console.log(`   Status: ${position.status}`);
      console.log(`   Created: ${position.createdAt}`);
      
      // Create a deeplink for testing
      console.log(`   Test Deeplink: https://t.me/millatumidi_hr_bot?start=${position.id}`);
    });
    
    if (positions.length === 0) {
      console.log('\n❌ No positions found! This explains why the deeplink fails.');
      console.log('   Need to create some test positions first.');
    }
    
  } catch (error) {
    console.error('❌ Error checking positions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPositions(); 
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function generateDeeplink() {
  try {
    console.log('Generating deeplinks for all positions:');
    
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
      
      // Get bot username
      const bot = await prisma.bot.findFirst();
      const botUsername = bot?.username || 'millatumidi_hr_bot';
      
      positions.forEach((position, index) => {
        console.log(`\n--- Position ${index + 1} ---`);
        console.log(`Title: ${position.title}`);
        console.log(`Company: ${position.departments?.[0]?.department?.company?.name || 'Unknown'}`);
        console.log(`Department: ${position.departments?.[0]?.department?.name || 'Unknown'}`);
        
        // Generate deeplink URL
        const deeplinkUrl = `https://t.me/${botUsername}?start=${position.id}`;
        console.log(`\nDeeplink URL: ${deeplinkUrl}`);
      });
    } else {
      console.log('No positions found in the database.');
    }
  } catch (err) {
    console.error('Error generating deeplinks:', err);
  } finally {
    await prisma.$disconnect();
  }
}

generateDeeplink(); 
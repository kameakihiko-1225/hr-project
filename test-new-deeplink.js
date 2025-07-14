import { PrismaClient } from './generated/prisma/index.js';
import fetch from 'node-fetch';

// Since we can't import directly from the service yet, we'll implement the core logic here
const prisma = new PrismaClient();
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a deeplink for a candidate to apply for a position via Telegram bot
 */
async function createDeeplink(botId, positionId, fullName = null) {
  console.log('[TestDeeplink] Creating deeplink:', { botId, positionId, fullName });
  
  try {
    // Find the bot
    const bot = await prisma.bot.findUnique({ 
      where: { id: botId },
      select: {
        id: true,
        username: true,
        token: true,
        active: true
      }
    });
    
    if (!bot) {
      throw new Error(`Bot not found with ID: ${botId}`);
    }
    
    // Find the position
    const position = await prisma.position.findUnique({
      where: { id: positionId },
      select: {
        id: true,
        title: true,
        departments: {
          select: {
            departmentId: true,
            department: {
              select: {
                id: true,
                companyId: true
              }
            }
          }
        },
        companyId: true
      }
    });
    
    if (!position) {
      throw new Error(`Position not found with ID: ${positionId}`);
    }
    
    // Generate a unique token
    const token = uuidv4();
    
    // Create the candidate record
    const candidateData = {
      fullName: fullName,
      positionId: position.id,
      botId: bot.id,
      status: 'new',
      startToken: token
    };
    
    // Add department and company IDs if available
    if (position.departments && position.departments.length > 0) {
      candidateData.departmentId = position.departments[0].departmentId;
      candidateData.companyId = position.departments[0].department.companyId;
    } else if (position.companyId) {
      candidateData.companyId = position.companyId;
    }
    
    console.log('[TestDeeplink] Creating candidate with data:', candidateData);
    
    const candidate = await prisma.candidate.create({
      data: candidateData
    });
    
    // Build the deeplink URL
    let link;
    if (bot.username) {
      link = `https://t.me/${bot.username}?start=${token}`;
    } else {
      // If no username is available, try to fetch it from Telegram
      try {
        const response = await fetch(`https://api.telegram.org/bot${bot.token}/getMe`);
        const data = await response.json();
        
        if (data.ok && data.result?.username) {
          // Update the bot with the username
          await prisma.bot.update({
            where: { id: bot.id },
            data: { username: data.result.username }
          });
          
          link = `https://t.me/${data.result.username}?start=${token}`;
        } else {
          // Fall back to just returning the token
          link = token;
        }
      } catch (error) {
        console.warn('[TestDeeplink] Failed to fetch bot username:', error);
        link = token;
      }
    }
    
    return {
      success: true,
      data: {
        link,
        token,
        candidateId: candidate.id
      }
    };
  } catch (error) {
    console.error('[TestDeeplink] Error creating deeplink:', error);
    throw error;
  }
}

async function testNewDeeplink() {
  try {
    console.log('🔍 Fetching a valid bot...');
    const bot = await prisma.bot.findFirst({
      where: { active: true }
    });
    
    if (!bot) {
      console.error('❌ No active bots found in the database');
      return;
    }
    
    console.log(`✅ Found bot: ${bot.id} (${bot.name})`);
    
    console.log('🔍 Fetching a valid position...');
    const position = await prisma.position.findFirst();
    
    if (!position) {
      console.error('❌ No positions found in the database');
      return;
    }
    
    console.log(`✅ Found position: ${position.id} (${position.title})`);
    
    // Test our new deeplink function
    console.log('\n🧪 Testing new deeplink implementation...');
    try {
      const result = await createDeeplink(bot.id, position.id, 'Test Candidate');
      console.log('📊 Deeplink Result:');
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('❌ Deeplink Error:', error);
      console.error('Error stack:', error.stack);
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testNewDeeplink(); 
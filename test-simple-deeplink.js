import { PrismaClient } from './generated/prisma/index.js';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function testSimpleDeeplink() {
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
    
    // Generate unique token
    const token = uuidv4();
    console.log(`🔑 Generated token: ${token}`);
    
    // Create candidate directly
    console.log('👤 Creating candidate...');
    const candidateData = {
      fullName: 'Simple Test Candidate',
      positionId: position.id,
      botId: bot.id,
      status: 'new',
      startToken: token
    };
    
    console.log('📋 Candidate data:', candidateData);
    
    const candidate = await prisma.candidate.create({
      data: candidateData
    });
    
    console.log('✅ Candidate created successfully:', candidate.id);
    
    // Build deep link
    const link = bot.username ? `https://t.me/${bot.username}?start=${token}` : token;
    console.log(`🔗 Deeplink: ${link}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testSimpleDeeplink(); 
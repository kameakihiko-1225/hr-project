import { PrismaClient } from './generated/prisma/index.js';
import fetch from 'node-fetch';
const prisma = new PrismaClient();

async function testDeeplinkAPI() {
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
    
    // Local API test
    console.log('\n🧪 Testing local API...');
    try {
      const localResponse = await fetch(`http://localhost:3000/api/bots/${bot.id}/deeplink`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          positionId: position.id,
          fullName: 'Test Candidate'
        })
      });
      
      const localData = await localResponse.json();
      console.log(`📊 Local API Response (${localResponse.status}):`);
      console.log(JSON.stringify(localData, null, 2));
    } catch (error) {
      console.error('❌ Local API Error:', error.message);
    }
    
    // Ngrok API test
    console.log('\n🧪 Testing ngrok API...');
    try {
      const ngrokResponse = await fetch(`https://8e5090336989.ngrok-free.app/api/bots/${bot.id}/deeplink`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          positionId: position.id,
          fullName: 'Test Candidate'
        })
      });
      
      const ngrokData = await ngrokResponse.json();
      console.log(`📊 Ngrok API Response (${ngrokResponse.status}):`);
      console.log(JSON.stringify(ngrokData, null, 2));
    } catch (error) {
      console.error('❌ Ngrok API Error:', error.message);
    }
    
    // Test GET endpoint
    console.log('\n🧪 Testing GET endpoint...');
    try {
      const getResponse = await fetch(`http://localhost:3000/api/bots/${bot.id}/deeplink?positionId=${position.id}&fullName=Test%20Candidate`);
      
      const getData = await getResponse.json();
      console.log(`📊 GET API Response (${getResponse.status}):`);
      console.log(JSON.stringify(getData, null, 2));
    } catch (error) {
      console.error('❌ GET API Error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeeplinkAPI(); 
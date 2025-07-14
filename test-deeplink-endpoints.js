import express from 'express';
import { PrismaClient } from './generated/prisma/index.js';
import deeplinkRouter from './src/api/bots/deeplinkEndpoints.js';
import fetch from 'node-fetch';

// Create a minimal Express app for testing
const app = express();
const port = 4000; // Use a different port than the main app
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount the deeplink router
app.use('/api/bots', deeplinkRouter);

// Start the test server
const server = app.listen(port, () => {
  console.log(`🧪 Test server running on port ${port}`);
  runTests();
});

async function runTests() {
  try {
    console.log('🔍 Fetching a valid bot...');
    const bot = await prisma.bot.findFirst({
      where: { active: true }
    });
    
    if (!bot) {
      console.error('❌ No active bots found in the database');
      server.close();
      await prisma.$disconnect();
      return;
    }
    
    console.log(`✅ Found bot: ${bot.id} (${bot.name})`);
    
    console.log('🔍 Fetching a valid position...');
    const position = await prisma.position.findFirst();
    
    if (!position) {
      console.error('❌ No positions found in the database');
      server.close();
      await prisma.$disconnect();
      return;
    }
    
    console.log(`✅ Found position: ${position.id} (${position.title})`);
    
    // Test POST endpoint
    console.log('\n🧪 Testing POST endpoint...');
    try {
      const postResponse = await fetch(`http://localhost:${port}/api/bots/${bot.id}/deeplink`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          positionId: position.id,
          fullName: 'Test Candidate POST'
        })
      });
      
      const postData = await postResponse.json();
      console.log(`📊 POST Response (${postResponse.status}):`);
      console.log(JSON.stringify(postData, null, 2));
    } catch (error) {
      console.error('❌ POST Error:', error.message);
    }
    
    // Test GET endpoint
    console.log('\n🧪 Testing GET endpoint...');
    try {
      const getResponse = await fetch(`http://localhost:${port}/api/bots/${bot.id}/deeplink?positionId=${position.id}&fullName=Test%20Candidate%20GET`);
      
      const getData = await getResponse.json();
      console.log(`📊 GET Response (${getResponse.status}):`);
      console.log(JSON.stringify(getData, null, 2));
    } catch (error) {
      console.error('❌ GET Error:', error.message);
    }
    
    // Test with invalid position ID
    console.log('\n🧪 Testing with invalid position ID...');
    try {
      const invalidResponse = await fetch(`http://localhost:${port}/api/bots/${bot.id}/deeplink`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          positionId: '00000000-0000-0000-0000-000000000000',
          fullName: 'Test Invalid Position'
        })
      });
      
      const invalidData = await invalidResponse.json();
      console.log(`📊 Invalid Position Response (${invalidResponse.status}):`);
      console.log(JSON.stringify(invalidData, null, 2));
    } catch (error) {
      console.error('❌ Invalid Position Error:', error.message);
    }
    
    // Test with invalid bot ID
    console.log('\n🧪 Testing with invalid bot ID...');
    try {
      const invalidBotResponse = await fetch(`http://localhost:${port}/api/bots/00000000-0000-0000-0000-000000000000/deeplink`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          positionId: position.id,
          fullName: 'Test Invalid Bot'
        })
      });
      
      const invalidBotData = await invalidBotResponse.json();
      console.log(`📊 Invalid Bot Response (${invalidBotResponse.status}):`);
      console.log(JSON.stringify(invalidBotData, null, 2));
    } catch (error) {
      console.error('❌ Invalid Bot Error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  } finally {
    // Close the server and disconnect from the database
    console.log('\n🧹 Cleaning up...');
    server.close(() => {
      console.log('✅ Test server closed');
      prisma.$disconnect().then(() => {
        console.log('✅ Database connection closed');
        process.exit(0);
      });
    });
  }
} 
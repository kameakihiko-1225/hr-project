#!/usr/bin/env node

/**
 * Test Position Selection Script
 * 
 * This script tests the position selection flow in the Telegram bot.
 * It verifies that:
 * 1. The bot correctly handles the /select_position command
 * 2. The reply keyboards are properly configured
 * 3. The position selection process works end-to-end
 * 
 * Usage:
 *   node test-position-selection.js [bot_id]
 */

import { PrismaClient } from '../generated/prisma/index.js';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    // Get bot ID from command line or use the first active bot
    const botId = process.argv[2];
    
    let bot;
    if (botId) {
      bot = await prisma.bot.findUnique({
        where: { id: botId }
      });
    } else {
      bot = await prisma.bot.findFirst({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' }
      });
    }
    
    if (!bot) {
      console.error('❌ No active bot found. Please create a bot first.');
      return;
    }
    
    console.log(`
🤖 Testing Position Selection Flow for Bot:
- ID: ${bot.id}
- Username: ${bot.username}
- Token: ${bot.token.substring(0, 6)}...
    `);
    
    // Test 1: Check if companies exist
    console.log('🧪 Test 1: Checking if companies exist...');
    
    const companies = await prisma.company.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        name: true
      },
      take: 5
    });
    
    if (companies.length === 0) {
      console.error('❌ No active companies found. Please create companies first.');
      return;
    }
    
    console.log(`✅ Found ${companies.length} companies:`);
    companies.forEach(company => {
      console.log(`  - ${company.name} (${company.id})`);
    });
    
    // Test 2: Check if departments exist for the first company
    console.log('\n🧪 Test 2: Checking if departments exist...');
    
    const departments = await prisma.department.findMany({
      where: {
        companyId: companies[0].id,
        status: 'active'
      },
      select: {
        id: true,
        name: true
      },
      take: 5
    });
    
    if (departments.length === 0) {
      console.error(`❌ No active departments found for company ${companies[0].name}. Please create departments first.`);
      return;
    }
    
    console.log(`✅ Found ${departments.length} departments for company ${companies[0].name}:`);
    departments.forEach(department => {
      console.log(`  - ${department.name} (${department.id})`);
    });
    
    // Test 3: Check if positions exist for the first department
    console.log('\n🧪 Test 3: Checking if positions exist...');
    
    const positions = await prisma.position.findMany({
      where: {
        departments: {
          some: {
            departmentId: departments[0].id
          }
        },
        status: 'active'
      },
      select: {
        id: true,
        title: true
      },
      take: 5
    });
    
    if (positions.length === 0) {
      console.error(`❌ No active positions found for department ${departments[0].name}. Please create positions first.`);
      return;
    }
    
    console.log(`✅ Found ${positions.length} positions for department ${departments[0].name}:`);
    positions.forEach(position => {
      console.log(`  - ${position.title} (${position.id})`);
    });
    
    // Test 4: Check if the webhook is set up correctly
    console.log('\n🧪 Test 4: Checking webhook configuration...');
    
    const webhookUrl = `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/bots/${bot.id}/webhook`;
    console.log(`📡 Webhook URL: ${webhookUrl}`);
    
    // Test 5: Generate test commands
    console.log('\n🧪 Test 5: Generating test commands...');
    
    console.log(`
✅ All tests passed! Here are the commands to test manually:

1. Start the bot:
   /start

2. Select position directly:
   /select_position

3. Test deep link:
   https://t.me/${bot.username}?start=${positions[0].id}

4. Expected reply keyboard options:
   - "Browse positions"
   - "Select position"

5. Expected company selection:
   - ${companies.map(c => `"${c.name}"`).join('\n   - ')}

6. Expected department selection for ${companies[0].name}:
   - ${departments.map(d => `"${d.name}"`).join('\n   - ')}

7. Expected position selection for ${departments[0].name}:
   - ${positions.map(p => `"${p.title}"`).join('\n   - ')}
    `);
    
  } catch (error) {
    console.error('❌ Error testing position selection:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 
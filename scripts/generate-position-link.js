#!/usr/bin/env node

/**
 * Generate Position Deep Link Script
 * 
 * This script generates a deep link for a position that can be shared with candidates.
 * The deep link will direct candidates to the Telegram bot and automatically link them to the position.
 * 
 * Usage:
 *   node generate-position-link.js [position_id] [bot_username]
 * 
 * If no position ID is provided, the script will list available positions.
 * If no bot username is provided, the script will use the first available bot.
 */

import { PrismaClient } from '../generated/prisma/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    const positionId = process.argv[2];
    const botUsername = process.argv[3];

    // If no position ID is provided, list available positions
    if (!positionId) {
      console.log('\n🔍 Available Positions:');
      
      const positions = await prisma.position.findMany({
        where: { status: 'active' },
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
        },
        orderBy: { title: 'asc' }
      });

      if (positions.length === 0) {
        console.log('❌ No active positions found.');
        return;
      }

      positions.forEach(position => {
        const companyName = position.departments?.[0]?.department?.company?.name || 'Unknown Company';
        const departmentName = position.departments?.[0]?.department?.name || 'Unknown Department';
        
        console.log(`
📍 Position ID: ${position.id}
📝 Title: ${position.title}
🏢 Company: ${companyName}
🏢 Department: ${departmentName}
📍 Location: ${position.location || 'Not specified'}
        `);
      });

      console.log('\nUsage: node generate-position-link.js [position_id] [bot_username]');
      return;
    }

    // Validate the position ID
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

    if (!position) {
      console.error('❌ Position not found with ID:', positionId);
      return;
    }

    // Get bot username (either from parameter or first available bot)
    let username = botUsername;
    if (!username) {
      const bot = await prisma.bot.findFirst({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' }
      });

      if (!bot) {
        console.error('❌ No active bots found. Please create a bot first.');
        return;
      }

      username = bot.username;
    }

    // Generate the deep link
    const deepLink = `https://t.me/${username}?start=${positionId}`;

    // Display position info and deep link
    const companyName = position.departments?.[0]?.department?.company?.name || 'Unknown Company';
    const departmentName = position.departments?.[0]?.department?.name || 'Unknown Department';
    
    console.log(`
✅ Deep Link Generated Successfully!

📍 Position: ${position.title}
🏢 Company: ${companyName}
🏢 Department: ${departmentName}
📍 Location: ${position.location || 'Not specified'}

🔗 Deep Link: ${deepLink}

Share this link with candidates to direct them to the position.
When they click the link, they will be automatically linked to this position.
    `);

  } catch (error) {
    console.error('❌ Error generating deep link:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 
#!/usr/bin/env node

/**
 * Script to directly update the webhook URL for all bots
 * Usage: node scripts/update-webhook-url.js https://9b4e75f92af4.ngrok-free.app
 */

import { PrismaClient } from '../generated/prisma/index.js';

// Check if URL was provided as argument
if (process.argv.length < 3) {
  console.error('❌ Error: No webhook URL provided');
  console.log('Usage: node scripts/update-webhook-url.js https://your-ngrok-url.ngrok-free.app');
  process.exit(1);
}

// Get the URL from command line arguments
const webhookBaseUrl = process.argv[2];

// Validate URL format
if (!webhookBaseUrl.startsWith('https://')) {
  console.error('❌ Error: Invalid webhook URL format');
  console.log('URL should start with https://');
  process.exit(1);
}

async function updateWebhooks() {
  console.log('🔄 Updating webhook URLs for all bots...');
  
  const prisma = new PrismaClient();
  
  try {
    // We need both the bot's id and token to compose the target URL
    const bots = await prisma.bot.findMany({ select: { id: true, token: true } });
    console.log(`Found ${bots.length} bots to update`);

    for (const { id, token } of bots) {
      if (!token) {
        console.log(`⚠️ Skipping bot ${id} - no token available`);
        continue; // Skip if token missing
      }

      const targetUrl = `${webhookBaseUrl}/api/telegram/webhook/${id}`;
      console.log(`Setting webhook for bot ${id} to ${targetUrl}`);

      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ url: targetUrl }),
        });

        const data = await res.json();
        if (!data.ok) {
          console.error('❌ Failed to set webhook', { botId: id, data });
        } else {
          console.log('✅ Webhook synced for bot', id);
        }
      } catch (err) {
        console.error('❌ Telegram webhook error for bot', id, err);
      }
    }
    
    console.log('✅ Webhook update process completed');
  } catch (error) {
    console.error('❌ Error updating webhooks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update function
updateWebhooks(); 
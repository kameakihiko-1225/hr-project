import { PrismaClient } from './generated/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function fixWebhook() {
  try {
    console.log('🔧 Fixing webhook registration...');
    
    // Get the bot
    const bot = await prisma.bot.findFirst();
    
    if (!bot) {
      console.log('❌ No bot found in database');
      return;
    }
    
    console.log(`📱 Found bot: ${bot.username} (ID: ${bot.id})`);
    
    // The correct webhook URL should use the bot ID, not the token
    const baseUrl = 'https://8e5090336989.ngrok-free.app';
    const correctWebhookUrl = `${baseUrl}/api/telegram/webhook/${bot.id}`;
    
    console.log(`🔗 Setting webhook URL to: ${correctWebhookUrl}`);
    
    // Update webhook with Telegram
    const response = await fetch(`https://api.telegram.org/bot${bot.token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ url: correctWebhookUrl }),
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ Webhook successfully updated with Telegram');
      
      // Update the stored webhook URL in database
      await prisma.bot.update({
        where: { id: bot.id },
        data: { webhookUrl: correctWebhookUrl }
      });
      
      console.log('✅ Webhook URL updated in database');
      
      // Test the webhook status
      console.log('🔍 Checking new webhook status...');
      const webhookInfoResponse = await fetch(`https://api.telegram.org/bot${bot.token}/getWebhookInfo`);
      const webhookInfo = await webhookInfoResponse.json();
      
      if (webhookInfo.ok) {
        console.log(`📱 New webhook info:`);
        console.log(`   URL: ${webhookInfo.result.url}`);
        console.log(`   Pending Updates: ${webhookInfo.result.pending_update_count}`);
        console.log(`   Last Error: ${webhookInfo.result.last_error_message || 'NONE'}`);
      }
      
    } else {
      console.log('❌ Failed to update webhook:', result.description);
    }
    
  } catch (error) {
    console.error('❌ Error fixing webhook:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixWebhook(); 
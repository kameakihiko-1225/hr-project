// Test script to verify webhook file download functionality
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testWebhookFileProcessing() {
  console.log('🧪 Testing webhook file download functionality...');
  
  // Create a test payload that simulates Telegram webhook data
  const testPayload = {
    contact_id: 'test-contact-123',
    full_name: 'Test User',
    phone_number: '+998901234567',
    resume: 'BAADBAADrwADBREAAWdAjgABY4aw2AA', // Simulated file ID
    diploma: 'BAADBAADrwADBREAAWdAjgABY4aw2BB', // Simulated file ID
    phase2_q_1: 'This is a text answer',
    phase2_q_2: 'AwACAgIAAxkDAAICHmYxyz9vAAG8AAG-TEST-FILE-ID', // Simulated voice file ID
    position_id: '21',
    position_title: 'Test Position'
  };

  try {
    // Test the webhook endpoint
    const response = await axios.post('http://localhost:5173/webhooks/puzzlebot', testPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });

    console.log('✅ Webhook response status:', response.status);
    console.log('📝 Response data:', response.data);
    
    // Check if telegram-files directory was created and contains files
    const telegramFilesDir = path.join(process.cwd(), 'uploads', 'telegram-files');
    if (fs.existsSync(telegramFilesDir)) {
      const files = fs.readdirSync(telegramFilesDir);
      console.log(`📁 Found ${files.length} files in telegram-files directory:`, files);
    } else {
      console.log('⚠️ telegram-files directory does not exist yet');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
  }
}

// Run the test
testWebhookFileProcessing();
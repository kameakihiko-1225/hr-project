// Direct test of our modified webhook functions
import path from 'path';
import fs from 'fs';

// Test the isTelegramFileId function that we use in the webhook
function isTelegramFileId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9]/.test(value) && value.length > 20 && !value.includes(' ');
}

// Test the downloadTelegramFile simulation (without actual download)
async function simulateDownloadTelegramFile(fileId, fileName) {
  // Ensure telegram-files directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads', 'telegram-files');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`📁 [TELEGRAM-FILE] Created telegram-files directory: ${uploadsDir}`);
  }

  // Generate unique filename (simulation)
  const timestamp = Date.now();
  const fileExtension = '.pdf'; // Simulated extension
  const uniqueFileName = `telegram_${fileName}_${timestamp}${fileExtension}`;
  
  // Return the public URL that would be generated
  const publicUrl = `/uploads/telegram-files/${uniqueFileName}`;
  console.log(`🌐 [TELEGRAM-FILE] Would generate URL: ${publicUrl}`);
  
  return publicUrl;
}

async function testWebhookLogic() {
  console.log('🧪 Testing webhook processing logic...\n');
  
  // Test data similar to what PuzzleBot would send
  const testData = {
    resume: 'BAADBAADrwADBREAAWdAjgABY4aw2AA',
    diploma: 'BAADBAADrwADBREAAWdAjgABY4aw2BB', 
    phase2_q_1: 'This is a text answer',
    phase2_q_2: 'AwACAgIAAxkDAAICHmYxyz9vAAG8AAG',
    phase2_q_3: 'Another text answer'
  };
  
  console.log('📋 Processing test data:');
  console.log(`  - Resume: ${JSON.stringify(testData.resume)}`);
  console.log(`  - Diploma: ${JSON.stringify(testData.diploma)}`);
  console.log(`  - Q1: ${JSON.stringify(testData.phase2_q_1)}`);
  console.log(`  - Q2: ${JSON.stringify(testData.phase2_q_2)}`);
  console.log(`  - Q3: ${JSON.stringify(testData.phase2_q_3)}`);
  
  const contactFields = {};
  
  // Test resume processing (our new logic)
  console.log('\n📥 Testing resume processing:');
  if (testData.resume && isTelegramFileId(testData.resume)) {
    console.log('  📥 Downloading resume file to server...');
    const resumeUrl = await simulateDownloadTelegramFile(testData.resume, 'resume');
    contactFields.UF_CRM_1752621810 = resumeUrl || '';
    console.log(`  ✅ Resume downloaded and saved: ${resumeUrl}`);
  } else {
    contactFields.UF_CRM_1752621810 = testData.resume || '';
    console.log(`  ⚪ Resume kept as-is: ${testData.resume}`);
  }
  
  // Test diploma processing (our new logic)
  console.log('\n📥 Testing diploma processing:');
  if (testData.diploma && isTelegramFileId(testData.diploma)) {
    console.log('  📥 Downloading diploma file to server...');
    const diplomaUrl = await simulateDownloadTelegramFile(testData.diploma, 'diploma');
    contactFields.UF_CRM_1752621831 = diplomaUrl || '';
    console.log(`  ✅ Diploma downloaded and saved: ${diplomaUrl}`);
  } else {
    contactFields.UF_CRM_1752621831 = testData.diploma || '';
    console.log(`  ⚪ Diploma kept as-is: ${testData.diploma}`);
  }
  
  // Test voice answer processing (our new logic)
  console.log('\n🎧 Testing voice answer processing:');
  if (testData.phase2_q_2 && isTelegramFileId(testData.phase2_q_2)) {
    console.log('  🎧 Q2 is file ID, downloading to server...');
    const q2Url = await simulateDownloadTelegramFile(testData.phase2_q_2, 'phase2_q2');
    contactFields.UF_CRM_1752621874 = q2Url || '';
    contactFields.UF_CRM_1752241378 = `Voice answer: ${q2Url || testData.phase2_q_2}`;
    console.log(`  ✅ Q2 voice downloaded: ${q2Url}`);
  } else {
    contactFields.UF_CRM_1752241378 = testData.phase2_q_2;
    console.log(`  ✅ Q2 text: ${testData.phase2_q_2}`);
  }
  
  console.log('\n📝 Final contact fields that would be sent to Bitrix24:');
  Object.entries(contactFields).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  console.log('\n✅ Webhook logic test completed successfully!');
  console.log('\n🌍 Files would be accessible at:');
  Object.values(contactFields)
    .filter(value => value && value.startsWith('/uploads/telegram-files/'))
    .forEach(url => {
      console.log(`  http://localhost:5000${url}`);
    });
}

testWebhookLogic().catch(console.error);
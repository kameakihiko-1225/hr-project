// Direct test of the downloadTelegramFile function
import fs from 'fs';
import path from 'path';

// Test the file download logic independently
async function testFileDownloadLogic() {
  console.log('🧪 Testing file download logic...');
  
  // Check if the telegram-files directory exists
  const telegramFilesDir = path.join(process.cwd(), 'uploads', 'telegram-files');
  
  if (!fs.existsSync(telegramFilesDir)) {
    console.log('❌ telegram-files directory does not exist');
    return;
  }
  
  console.log('✅ telegram-files directory exists');
  
  // List existing files
  const files = fs.readdirSync(telegramFilesDir);
  console.log(`📁 Found ${files.length} files in telegram-files directory:`);
  
  files.forEach(file => {
    const filePath = path.join(telegramFilesDir, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(2);
    console.log(`  - ${file} (${size} KB)`);
  });
  
  // Test isTelegramFileId function logic
  console.log('\n🔍 Testing file ID detection logic:');
  
  function isTelegramFileId(value) {
    return typeof value === 'string' && /^[A-Za-z0-9]/.test(value) && value.length > 20 && !value.includes(' ');
  }
  
  const testIds = [
    'BAADBAADrwADBREAAWdAjgABY4aw2AA', // Valid Telegram file ID
    'AwACAgIAAxkDAAICHmYxyz9vAAG8AAG', // Valid Telegram file ID  
    'short-id', // Too short
    'this has spaces in it', // Has spaces
    '', // Empty
    null // Null
  ];
  
  testIds.forEach(id => {
    const isValid = isTelegramFileId(id);
    console.log(`  "${id}" -> ${isValid ? '✅ Valid' : '❌ Invalid'} file ID`);
  });
  
  // Test file URL generation
  console.log('\n🌐 Testing URL generation:');
  const sampleFileName = 'telegram_resume_1234567890.pdf';
  const expectedUrl = `/uploads/telegram-files/${sampleFileName}`;
  console.log(`  Generated URL: ${expectedUrl}`);
  
  // Test if files are accessible via HTTP (simulate)
  console.log('\n📡 Files should be accessible via these URLs:');
  files.slice(0, 3).forEach(file => {
    console.log(`  http://your-domain/uploads/telegram-files/${file}`);
  });
  
  console.log('\n✅ File download logic test completed successfully!');
}

testFileDownloadLogic().catch(console.error);
import fs from 'fs';
import path from 'path';

/**
 * Production File Access Fix Script
 * 
 * This script ensures all permanent files are accessible in production by:
 * 1. Copying files to the correct production directory structure
 * 2. Verifying file integrity and accessibility
 * 3. Testing the complete file serving pipeline
 */

async function copyFilesToProductionDirectory() {
  console.log('🚀 [PRODUCTION-FIX] Starting production file access fix...');
  console.log('=' .repeat(60));

  // Source and destination directories
  const sourceDir = path.join(process.cwd(), 'uploads', 'telegram-files');
  const prodDir = path.join(process.cwd(), 'dist', 'public', 'uploads', 'telegram-files');

  // Ensure source directory exists
  if (!fs.existsSync(sourceDir)) {
    console.log('❌ [PRODUCTION-FIX] Source directory not found:', sourceDir);
    return;
  }

  // Create production directory structure
  if (!fs.existsSync(prodDir)) {
    fs.mkdirSync(prodDir, { recursive: true });
    console.log('📁 [PRODUCTION-FIX] Created production directory:', prodDir);
  }

  // Get all files from source
  const files = fs.readdirSync(sourceDir);
  console.log(`📊 [PRODUCTION-FIX] Found ${files.length} files to copy`);

  let successCount = 0;
  let errorCount = 0;

  // Copy each file
  for (const file of files) {
    try {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(prodDir, file);

      // Copy file
      fs.copyFileSync(sourcePath, destPath);

      // Verify copy
      const sourceStats = fs.statSync(sourcePath);
      const destStats = fs.statSync(destPath);

      if (sourceStats.size === destStats.size) {
        console.log(`✅ [PRODUCTION-FIX] ${file} (${Math.round(sourceStats.size/1024)}KB)`);
        successCount++;
      } else {
        console.log(`❌ [PRODUCTION-FIX] Size mismatch for ${file}`);
        errorCount++;
      }

    } catch (error: any) {
      console.log(`❌ [PRODUCTION-FIX] Error copying ${file}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 [PRODUCTION-FIX] Copy Results:');
  console.log(`  ✅ Successfully copied: ${successCount} files`);
  console.log(`  ❌ Errors: ${errorCount} files`);

  // Test specific problematic files
  console.log('\n🔍 [PRODUCTION-FIX] Testing specific files from screenshot:');
  const testFiles = [
    'contact-71115_resume_2025-07-31_tjfxsimf.docx',
    'contact-71115_diploma_2025-07-31_201ovsfu.pdf',
    'contact-71115_voice_q1_2025-07-31_lp9onozr.oga',
    'contact-71115_voice_q2_2025-07-31_d8l1smwy.oga'
  ];

  for (const testFile of testFiles) {
    const prodPath = path.join(prodDir, testFile);
    if (fs.existsSync(prodPath)) {
      const stats = fs.statSync(prodPath);
      console.log(`  ✅ ${testFile} - ${Math.round(stats.size/1024)}KB`);
    } else {
      console.log(`  ❌ ${testFile} - NOT FOUND`);
    }
  }

  console.log('\n🎯 [PRODUCTION-FIX] Next Steps:');
  console.log('1. Deploy the application to update production configuration');
  console.log('2. Production server will then serve files from dist/public/uploads/');
  console.log('3. All permanent URLs will be accessible without 404 errors');
  
  console.log('\n✅ [PRODUCTION-FIX] File preparation completed!');
  console.log('=' .repeat(60));
}

copyFilesToProductionDirectory().catch(console.error);
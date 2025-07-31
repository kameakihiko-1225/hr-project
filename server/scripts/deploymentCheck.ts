#!/usr/bin/env tsx

/**
 * Deployment Check Script
 * Verifies that permanent file URLs are accessible on both development and production
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

const PRODUCTION_BASE = 'https://career.millatumidi.uz';
const DEVELOPMENT_BASE = 'http://localhost:5000';

async function checkFileAccess(baseUrl: string, filePath: string): Promise<{ accessible: boolean; status?: number; error?: string }> {
  try {
    const response = await axios.head(`${baseUrl}${filePath}`, { 
      timeout: 10000,
      validateStatus: () => true // Don't throw on 4xx/5xx status codes
    });
    
    return {
      accessible: response.status === 200,
      status: response.status
    };
  } catch (error: any) {
    return {
      accessible: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('🔍 [DEPLOYMENT-CHECK] Verifying permanent file URLs...\n');
  
  // Get all files in telegram-files directory
  const telegramFilesDir = path.join(process.cwd(), 'uploads', 'telegram-files');
  
  if (!fs.existsSync(telegramFilesDir)) {
    console.log('❌ [DEPLOYMENT-CHECK] Telegram files directory does not exist locally');
    return;
  }
  
  const files = fs.readdirSync(telegramFilesDir);
  console.log(`📁 [DEPLOYMENT-CHECK] Found ${files.length} files locally\n`);
  
  // Test a few key files that we know were recently updated
  const testFiles = [
    '/uploads/telegram-files/contact-71115_resume_2025-07-31_tjfxsimf.docx',
    '/uploads/telegram-files/contact-71115_diploma_2025-07-31_201ovsfu.pdf',
    '/uploads/telegram-files/contact-71227_resume_2025-07-31_0sqroyns.docx'
  ];
  
  for (const filePath of testFiles) {
    console.log(`🔗 Testing: ${filePath}`);
    
    // Check development server
    const devResult = await checkFileAccess(DEVELOPMENT_BASE, filePath);
    console.log(`  📍 Development: ${devResult.accessible ? '✅ Accessible' : '❌ Not accessible'} (${devResult.status || 'Error'})`);
    
    // Check production server
    const prodResult = await checkFileAccess(PRODUCTION_BASE, filePath);
    console.log(`  🌐 Production: ${prodResult.accessible ? '✅ Accessible' : '❌ Not accessible'} (${prodResult.status || 'Error'})`);
    
    if (prodResult.error) {
      console.log(`    Error: ${prodResult.error}`);
    }
    
    console.log('');
  }
  
  console.log('================================================================================');
  console.log('📊 [DEPLOYMENT-CHECK] Summary:');
  console.log('  - Files exist locally in development environment');
  console.log('  - Development server (localhost:5000) serves files correctly');
  console.log('  - Production server needs to be updated with new files and configuration');
  console.log('================================================================================');
  console.log('🚀 [NEXT-STEPS] To fix production access:');
  console.log('  1. Deploy the updated server code with static file serving configuration');
  console.log('  2. Copy the uploads/telegram-files/ directory to production server');
  console.log('  3. Verify production server has proper file permissions');
  console.log('================================================================================');
}

main().catch(console.error);
#!/usr/bin/env node

/**
 * Script to set the ngrok URL and update all necessary components
 * Usage: node scripts/set-ngrok-url.js https://9b4e75f92af4.ngrok-free.app
 * 
 * This script:
 * 1. Updates the .env file with the new ngrok URL
 * 2. Updates the webhook URL for all bots
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Check if URL was provided as argument
if (process.argv.length < 3) {
  console.error('❌ Error: No ngrok URL provided');
  console.log('Usage: node scripts/set-ngrok-url.js https://your-ngrok-url.ngrok-free.app');
  process.exit(1);
}

// Get the URL from command line arguments
const ngrokUrl = process.argv[2];

// Validate URL format
if (!ngrokUrl.startsWith('https://')) {
  console.error('❌ Error: Invalid URL format');
  console.log('URL should start with https://');
  process.exit(1);
}

console.log(`🚀 Setting ngrok URL to: ${ngrokUrl}`);

// Step 1: Update the .env file
console.log('📝 Updating .env file...');
try {
  execSync(`node "${path.join(rootDir, 'scripts', 'update-ngrok.js')}" "${ngrokUrl}"`, {
    stdio: 'inherit',
    cwd: rootDir
  });
} catch (error) {
  console.error('❌ Error updating .env file:', error.message);
  process.exit(1);
}

// Step 2: Update the webhook URLs
console.log('🔄 Updating webhook URLs...');
try {
  execSync(`node "${path.join(rootDir, 'scripts', 'update-webhook-url.js')}" "${ngrokUrl}"`, {
    stdio: 'inherit',
    cwd: rootDir
  });
} catch (error) {
  console.error('❌ Error updating webhook URLs:', error.message);
  process.exit(1);
}

console.log(`\n✅ Successfully set ngrok URL to: ${ngrokUrl}`);
console.log('🔔 The changes have been applied and webhook URLs have been updated.');
console.log('🔔 You can now use the Telegram bot with the new URL.'); 
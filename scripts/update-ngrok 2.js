#!/usr/bin/env node

/**
 * Script to update the NGROK_URL in the .env file
 * Usage: node scripts/update-ngrok.js https://your-ngrok-url.ngrok-free.app
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const envPath = path.join(rootDir, '.env');

// Check if URL was provided as argument
if (process.argv.length < 3) {
  console.error('❌ Error: No ngrok URL provided');
  console.log('Usage: node scripts/update-ngrok.js https://your-ngrok-url.ngrok-free.app');
  process.exit(1);
}

// Get the URL from command line arguments
const ngrokUrl = process.argv[2];

// Validate URL format
if (!ngrokUrl.startsWith('https://') || !ngrokUrl.includes('.ngrok-free.app')) {
  console.error('❌ Error: Invalid ngrok URL format');
  console.log('URL should be in format: https://something.ngrok-free.app');
  process.exit(1);
}

try {
  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    console.log('⚠️ .env file not found, creating a new one');
    fs.writeFileSync(envPath, `NGROK_URL=${ngrokUrl}\n`);
    console.log(`✅ Created .env file with NGROK_URL=${ngrokUrl}`);
    process.exit(0);
  }

  // Read the existing .env file
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Check if NGROK_URL already exists in the file
  if (envContent.includes('NGROK_URL=')) {
    // Update the existing NGROK_URL
    envContent = envContent.replace(/NGROK_URL=.*(\r?\n|$)/g, `NGROK_URL=${ngrokUrl}$1`);
    console.log(`✅ Updated NGROK_URL to ${ngrokUrl}`);
  } else {
    // Add NGROK_URL to the end of the file
    envContent += `\nNGROK_URL=${ngrokUrl}\n`;
    console.log(`✅ Added NGROK_URL=${ngrokUrl}`);
  }

  // Write the updated content back to the .env file
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file updated successfully');

} catch (error) {
  console.error('❌ Error updating .env file:', error.message);
  process.exit(1);
} 
#!/usr/bin/env node

/**
 * Script to force a specific ngrok URL by directly modifying the global cache
 * Usage: node scripts/force-ngrok-url.js https://9b4e75f92af4.ngrok-free.app
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const envPath = path.join(rootDir, '.env');

// Check if URL was provided as argument
if (process.argv.length < 3) {
  console.error('❌ Error: No ngrok URL provided');
  console.log('Usage: node scripts/force-ngrok-url.js https://your-ngrok-url.ngrok-free.app');
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
  // 1. Update the .env file
  if (!fs.existsSync(envPath)) {
    console.log('⚠️ .env file not found, creating a new one');
    fs.writeFileSync(envPath, `NGROK_URL=${ngrokUrl}\n`);
  } else {
    // Read the existing .env file
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Check if NGROK_URL already exists in the file
    if (envContent.includes('NGROK_URL=')) {
      // Update the existing NGROK_URL
      envContent = envContent.replace(/NGROK_URL=.*(\r?\n|$)/g, `NGROK_URL=${ngrokUrl}$1`);
    } else {
      // Add NGROK_URL to the end of the file
      envContent += `\nNGROK_URL=${ngrokUrl}\n`;
    }

    // Write the updated content back to the .env file
    fs.writeFileSync(envPath, envContent);
  }
  console.log(`✅ Updated .env file with NGROK_URL=${ngrokUrl}`);

  // 2. Create a temporary script to modify the global cache
  const tempScriptPath = path.join(rootDir, 'temp-ngrok-updater.js');
  const scriptContent = `
// This is a temporary script to update the global ngrok URL cache
global._cachedNgrokUrl = "${ngrokUrl}";
console.log('✅ Global ngrok URL cache updated to:', global._cachedNgrokUrl);
`;
  fs.writeFileSync(tempScriptPath, scriptContent);
  
  // 3. Execute the temporary script with Node.js
  console.log('🔄 Updating global cache...');
  try {
    // Use execSync with the path properly quoted
    execSync(`node "${tempScriptPath}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Error executing temporary script:', error.message);
    // Continue execution despite this error
  }
  
  // 4. Clean up the temporary script
  fs.unlinkSync(tempScriptPath);
  
  // 5. Update the webhook URLs for all bots
  console.log('🔄 Updating webhook URLs for all bots...');
  
  // Create a temporary script to update webhooks
  const webhookScriptPath = path.join(rootDir, 'temp-webhook-updater.js');
  const webhookScriptContent = `
import { syncAllWebhooks } from './src/api/bots/webhookRegistrar.js';

async function updateWebhooks() {
  try {
    await syncAllWebhooks("${ngrokUrl}");
    console.log('✅ Webhook URLs updated successfully');
  } catch (error) {
    console.error('❌ Error updating webhook URLs:', error);
  }
}

updateWebhooks();
`;
  fs.writeFileSync(webhookScriptPath, webhookScriptContent);
  
  try {
    // Execute the webhook updater script
    execSync(`node "${webhookScriptPath}"`, { 
      stdio: 'inherit',
      cwd: rootDir
    });
  } catch (error) {
    console.error('❌ Error updating webhook URLs:', error.message);
  }
  
  // Clean up the temporary webhook script
  try {
    fs.unlinkSync(webhookScriptPath);
  } catch (error) {
    // Ignore errors when cleaning up
  }
  
  console.log(`\n✅ Ngrok URL has been successfully forced to: ${ngrokUrl}`);
  console.log('🔔 Note: You may need to restart your server for changes to take effect');
  console.log('🚀 Run: npm run start');
  
} catch (error) {
  console.error('❌ Error forcing ngrok URL:', error.message);
  process.exit(1);
} 
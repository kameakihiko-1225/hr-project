#!/usr/bin/env node

/**
 * Script to restart the ngrok tunnel and update the webhook URL
 * This script:
 * 1. Kills any running ngrok processes
 * 2. Clears the ngrok cache directory
 * 3. Restarts the server
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const execAsync = promisify(exec);

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Function to kill any running ngrok processes
async function killNgrok() {
  console.log('🔪 Killing any running ngrok processes...');
  try {
    if (os.platform() === 'win32') {
      await execAsync('taskkill /f /im ngrok.exe');
    } else {
      await execAsync('pkill -f ngrok');
    }
    console.log('✅ Ngrok processes killed');
  } catch (error) {
    // It's okay if no processes were found to kill
    console.log('ℹ️ No ngrok processes found or could not kill them');
  }
}

// Function to clear the ngrok cache directory
async function clearNgrokCache() {
  console.log('🧹 Clearing ngrok cache...');
  
  // Determine the ngrok cache directory based on the OS
  let ngrokCacheDir;
  if (os.platform() === 'win32') {
    ngrokCacheDir = path.join(os.homedir(), 'AppData', 'Local', 'ngrok');
  } else if (os.platform() === 'darwin') {
    ngrokCacheDir = path.join(os.homedir(), 'Library', 'Application Support', 'ngrok');
  } else {
    ngrokCacheDir = path.join(os.homedir(), '.ngrok');
  }
  
  try {
    if (fs.existsSync(ngrokCacheDir)) {
      // Remove the ngrok.yml file which contains the cached configuration
      const ngrokConfigFile = path.join(ngrokCacheDir, 'ngrok.yml');
      if (fs.existsSync(ngrokConfigFile)) {
        fs.unlinkSync(ngrokConfigFile);
        console.log('✅ Removed ngrok configuration file');
      }
      
      // Clear the tunnel cache directory
      const tunnelCacheDir = path.join(ngrokCacheDir, 'tunnels');
      if (fs.existsSync(tunnelCacheDir)) {
        fs.rmSync(tunnelCacheDir, { recursive: true, force: true });
        console.log('✅ Cleared ngrok tunnels cache directory');
      }
    } else {
      console.log('ℹ️ Ngrok cache directory not found');
    }
  } catch (error) {
    console.error('❌ Error clearing ngrok cache:', error.message);
  }
}

// Function to restart the server
async function restartServer() {
  console.log('🔄 Restarting server...');
  try {
    // Kill any running node processes for our server
    if (os.platform() === 'win32') {
      await execAsync('taskkill /f /im node.exe');
    } else {
      await execAsync('pkill -f "node server.js"');
    }
    console.log('✅ Server processes killed');
    
    // Start the server in the background
    const serverProcess = exec('npm run start', { cwd: rootDir });
    console.log('✅ Server restarted');
    
    // Wait a moment for the server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check the server logs for the new ngrok URL
    const serverLog = fs.readFileSync(path.join(rootDir, 'server.log'), 'utf8');
    const ngrokUrlMatch = serverLog.match(/ngrok tunnel started → (https:\/\/[a-zA-Z0-9-]+\.ngrok-free\.app)/);
    
    if (ngrokUrlMatch && ngrokUrlMatch[1]) {
      const newNgrokUrl = ngrokUrlMatch[1];
      console.log('🔗 New ngrok URL:', newNgrokUrl);
      
      // Update the .env file with the new URL
      const updateScript = path.join(rootDir, 'scripts', 'update-ngrok.js');
      exec(`node ${updateScript} ${newNgrokUrl}`, { cwd: rootDir });
    } else {
      console.log('⚠️ Could not find new ngrok URL in server logs');
    }
  } catch (error) {
    console.error('❌ Error restarting server:', error.message);
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting ngrok restart process...');
    
    await killNgrok();
    await clearNgrokCache();
    await restartServer();
    
    console.log('✅ Ngrok restart process completed');
  } catch (error) {
    console.error('❌ Error in ngrok restart process:', error.message);
    process.exit(1);
  }
}

// Run the main function
main(); 
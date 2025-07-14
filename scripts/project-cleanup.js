#!/usr/bin/env node

/**
 * Project Cleanup Script
 * 
 * This script performs various cleanup operations on the project:
 * 1. Finds and lists backup files (.bak, .fixed, etc.)
 * 2. Identifies unused dependencies using depcheck
 * 3. Checks for git-tracked deleted files
 * 4. Provides recommendations for cleanup
 * 
 * Usage:
 *   node scripts/project-cleanup.js [--remove]
 * 
 * Options:
 *   --remove  Automatically remove identified files (use with caution)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Configuration
const BACKUP_EXTENSIONS = ['.bak', '.fixed', '.tmp', '.temp'];
const EXCLUDED_DIRS = ['node_modules', 'dist', 'build', '.git'];

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Parse command line arguments
const args = process.argv.slice(2);
const autoRemove = args.includes('--remove');

/**
 * Main function
 */
async function main() {
  console.log('\n🧹 Project Cleanup Script\n');
  
  // 1. Find backup files
  console.log('🔍 Searching for backup files...');
  const backupFiles = findBackupFiles();
  
  if (backupFiles.length > 0) {
    console.log(`\n✅ Found ${backupFiles.length} backup files:`);
    backupFiles.forEach(file => console.log(`  - ${file}`));
    
    if (autoRemove) {
      removeFiles(backupFiles);
    } else {
      await promptRemoval(backupFiles, 'backup files');
    }
  } else {
    console.log('✅ No backup files found.');
  }
  
  // 2. Check for git-tracked deleted files
  console.log('\n🔍 Checking for git-tracked deleted files...');
  const deletedFiles = findGitDeletedFiles();
  
  if (deletedFiles.length > 0) {
    console.log(`\n✅ Found ${deletedFiles.length} git-tracked deleted files:`);
    deletedFiles.forEach(file => console.log(`  - ${file}`));
    
    if (autoRemove) {
      removeGitTrackedFiles(deletedFiles);
    } else {
      await promptGitRemoval(deletedFiles);
    }
  } else {
    console.log('✅ No git-tracked deleted files found.');
  }
  
  // 3. Check for unused dependencies
  console.log('\n🔍 Checking for unused dependencies...');
  try {
    const unusedDeps = findUnusedDependencies();
    
    if (unusedDeps.dependencies.length > 0 || unusedDeps.devDependencies.length > 0) {
      console.log('\n✅ Found unused dependencies:');
      
      if (unusedDeps.dependencies.length > 0) {
        console.log('\nUnused dependencies:');
        unusedDeps.dependencies.forEach(dep => console.log(`  - ${dep}`));
      }
      
      if (unusedDeps.devDependencies.length > 0) {
        console.log('\nUnused dev dependencies:');
        unusedDeps.devDependencies.forEach(dep => console.log(`  - ${dep}`));
      }
      
      console.log('\nTo remove these dependencies, run:');
      
      if (unusedDeps.dependencies.length > 0) {
        console.log(`npm uninstall ${unusedDeps.dependencies.join(' ')}`);
      }
      
      if (unusedDeps.devDependencies.length > 0) {
        console.log(`npm uninstall --save-dev ${unusedDeps.devDependencies.join(' ')}`);
      }
    } else {
      console.log('✅ No unused dependencies found.');
    }
  } catch (error) {
    console.log('❌ Error checking for unused dependencies. Make sure depcheck is installed globally.');
    console.log('   Run: npm install -g depcheck');
  }
  
  // 4. Provide recommendations
  console.log('\n📋 Recommendations:');
  console.log('1. Run this script periodically to keep the project clean');
  console.log('2. Consider using webpack-bundle-analyzer to identify large dependencies');
  console.log('3. Update the documentation in docs/project-cleanup.md with any changes');
  console.log('4. Run npm audit to check for security vulnerabilities');
  
  console.log('\n✨ Cleanup process completed!');
  rl.close();
}

/**
 * Find backup files in the project
 */
function findBackupFiles() {
  try {
    const findCommand = `find . ${EXCLUDED_DIRS.map(dir => `-not -path "./${dir}/*"`).join(' ')} -type f ${BACKUP_EXTENSIONS.map(ext => `-o -name "*${ext}"`).join(' ')}`;
    const result = execSync(findCommand, { encoding: 'utf8' });
    return result.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding backup files:', error.message);
    return [];
  }
}

/**
 * Find git-tracked deleted files
 */
function findGitDeletedFiles() {
  try {
    const result = execSync('git ls-files --deleted', { encoding: 'utf8' });
    return result.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding git-tracked deleted files:', error.message);
    return [];
  }
}

/**
 * Find unused dependencies using depcheck
 */
function findUnusedDependencies() {
  try {
    const result = execSync('depcheck --json', { encoding: 'utf8' });
    const depcheckResult = JSON.parse(result);
    return {
      dependencies: Object.keys(depcheckResult.dependencies),
      devDependencies: Object.keys(depcheckResult.devDependencies)
    };
  } catch (error) {
    throw new Error('Failed to run depcheck. Is it installed?');
  }
}

/**
 * Remove files from the filesystem
 */
function removeFiles(files) {
  console.log('\n🗑️ Removing files...');
  
  files.forEach(file => {
    try {
      fs.unlinkSync(file);
      console.log(`  ✅ Removed: ${file}`);
    } catch (error) {
      console.log(`  ❌ Failed to remove: ${file}`);
    }
  });
}

/**
 * Remove git-tracked deleted files
 */
function removeGitTrackedFiles(files) {
  console.log('\n🗑️ Removing git-tracked deleted files...');
  
  try {
    execSync(`git rm --cached ${files.join(' ')}`, { encoding: 'utf8' });
    console.log('  ✅ Removed files from git tracking');
  } catch (error) {
    console.log('  ❌ Failed to remove files from git tracking');
  }
}

/**
 * Prompt user for file removal
 */
function promptRemoval(files, fileType) {
  return new Promise((resolve) => {
    rl.question(`\nDo you want to remove these ${fileType}? (y/n): `, (answer) => {
      if (answer.toLowerCase() === 'y') {
        removeFiles(files);
      }
      resolve();
    });
  });
}

/**
 * Prompt user for git file removal
 */
function promptGitRemoval(files) {
  return new Promise((resolve) => {
    rl.question('\nDo you want to remove these files from git tracking? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        removeGitTrackedFiles(files);
      }
      resolve();
    });
  });
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  rl.close();
}); 
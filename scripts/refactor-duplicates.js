#!/usr/bin/env node

/**
 * Code Duplication Analyzer
 * 
 * This script analyzes the codebase to identify potential duplicate code and generates
 * a report with recommendations for refactoring.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SRC_DIR = path.join(__dirname, '../src');
const OUTPUT_FILE = path.join(__dirname, '../docs/code-duplication-report.md');

// File patterns to analyze
const FILE_PATTERNS = {
  typescript: ['.ts', '.tsx'],
  javascript: ['.js', '.jsx']
};

// Known duplicates to check
const KNOWN_DUPLICATES = [
  {
    name: 'Logger Implementation',
    files: ['src/lib/logger.ts', 'src/lib/logger.js'],
    recommendation: 'Keep TypeScript version (logger.ts) and update all imports'
  },
  {
    name: 'Environment Configuration',
    files: ['src/lib/env.ts', 'src/lib/env.js'],
    recommendation: 'Keep TypeScript version (env.ts) and update all imports'
  },
  {
    name: 'Authentication Service',
    files: ['src/lib/auth.ts', 'src/api/auth/authService.ts'],
    recommendation: 'Keep API version (authService.ts) as it is more comprehensive'
  },
  {
    name: 'Cache Implementation',
    files: ['src/lib/cache.js', 'src/lib/memoryCache.js'],
    recommendation: 'Consolidate into a single cache module with memory fallback'
  },
  {
    name: 'Toast Hook',
    files: ['src/hooks/use-toast.ts', 'src/components/ui/use-toast.ts'],
    recommendation: 'Keep hooks/use-toast.ts as the source and make components/ui/use-toast.ts import from it'
  }
];

// Helper to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Helper to get all files in a directory recursively
function getAllFiles(dir, extensions = null) {
  const files = [];
  
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (!extensions || extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Find imports that need to be updated
function findImportsToUpdate(duplicateInfo) {
  const { files, recommendation } = duplicateInfo;
  const fileToKeep = files.find(f => recommendation.includes(f));
  const filesToRemove = files.filter(f => f !== fileToKeep);
  
  const imports = [];
  
  for (const fileToRemove of filesToRemove) {
    // Get the base name without extension
    const baseName = path.basename(fileToRemove).split('.')[0];
    
    // Find all imports of this file
    try {
      const grepResult = execSync(`grep -r "from '.*${baseName}'" ${SRC_DIR} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"`, { encoding: 'utf8' });
      const lines = grepResult.split('\n').filter(Boolean);
      
      for (const line of lines) {
        const [filePath, importStatement] = line.split(':', 2);
        imports.push({
          file: filePath,
          importStatement: importStatement.trim(),
          replacementFile: fileToKeep
        });
      }
    } catch (error) {
      // grep returns non-zero exit code if no matches found
      if (error.status !== 1) {
        console.error(`Error searching for imports of ${baseName}:`, error);
      }
    }
  }
  
  return imports;
}

// Generate a report of duplicate code
function generateReport() {
  let report = '# Code Duplication Report\n\n';
  report += 'This report identifies duplicate code in the project and provides recommendations for refactoring.\n\n';
  
  // Check known duplicates
  report += '## Known Duplicates\n\n';
  
  for (const duplicate of KNOWN_DUPLICATES) {
    report += `### ${duplicate.name}\n\n`;
    report += '**Files:**\n\n';
    
    for (const file of duplicate.files) {
      const exists = fileExists(path.join(__dirname, '..', file));
      report += `- ${file} ${exists ? '✅' : '❌'}\n`;
    }
    
    report += '\n**Recommendation:**\n\n';
    report += `${duplicate.recommendation}\n\n`;
    
    // Find imports that need to be updated
    const imports = findImportsToUpdate(duplicate);
    
    if (imports.length > 0) {
      report += '**Imports to Update:**\n\n';
      
      for (const imp of imports) {
        report += `- ${imp.file}: \`${imp.importStatement}\`\n`;
      }
      
      report += '\n';
    }
    
    report += '---\n\n';
  }
  
  // Look for potential duplicate functions
  report += '## Potential Duplicate Functions\n\n';
  report += 'The following functions may have similar implementations across different files:\n\n';
  
  // Common utility functions that might be duplicated
  const commonFunctions = [
    'getAuthHeaders',
    'formatDate',
    'validateEmail',
    'getInitials',
    'truncateText',
    'debounce',
    'throttle'
  ];
  
  for (const funcName of commonFunctions) {
    try {
      const grepResult = execSync(`grep -r "function ${funcName}" ${SRC_DIR} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"`, { encoding: 'utf8' });
      const lines = grepResult.split('\n').filter(Boolean);
      
      if (lines.length > 1) {
        report += `### \`${funcName}\`\n\n`;
        report += '**Found in:**\n\n';
        
        for (const line of lines) {
          const [filePath] = line.split(':', 1);
          report += `- ${filePath}\n`;
        }
        
        report += '\n';
      }
    } catch (error) {
      // grep returns non-zero exit code if no matches found
      if (error.status !== 1) {
        console.error(`Error searching for function ${funcName}:`, error);
      }
    }
  }
  
  // Save the report
  fs.writeFileSync(OUTPUT_FILE, report);
  console.log(`Report generated at ${OUTPUT_FILE}`);
}

// Main function
function main() {
  console.log('Analyzing codebase for duplicates...');
  generateReport();
  console.log('Done!');
}

main(); 
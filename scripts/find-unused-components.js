#!/usr/bin/env node

/**
 * Unused Component Finder
 * 
 * This script analyzes the codebase to identify potentially unused components.
 * It checks for React components that are not imported anywhere else in the project.
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
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const OUTPUT_FILE = path.join(__dirname, '../docs/unused-components-report.md');

// Helper to get all component files
function getAllComponentFiles() {
  const componentFiles = [];
  
  function traverse(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx')) {
        // Skip UI components from shadcn
        if (fullPath.includes(path.join('components', 'ui'))) {
          continue;
        }
        
        componentFiles.push(fullPath);
      }
    }
  }
  
  traverse(COMPONENTS_DIR);
  return componentFiles;
}

// Check if a component is used elsewhere in the project
function isComponentUsed(componentName, componentPath) {
  try {
    // Look for imports of this component
    const grepCommand = `grep -r "import.*${componentName}[ ,'\"{}]" ${SRC_DIR} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"`;
    const result = execSync(grepCommand, { encoding: 'utf8' });
    
    const lines = result.split('\n').filter(Boolean);
    
    // Filter out self-imports (the component's own file)
    const externalImports = lines.filter(line => {
      const [filePath] = line.split(':', 1);
      return filePath !== componentPath;
    });
    
    return externalImports.length > 0;
  } catch (error) {
    // grep returns non-zero exit code if no matches found
    if (error.status !== 1) {
      console.error(`Error searching for imports of ${componentName}:`, error);
    }
    return false;
  }
}

// Extract component name from file
function extractComponentName(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for export default function ComponentName or export function ComponentName
    const exportMatch = content.match(/export\s+(default\s+)?function\s+([A-Z][A-Za-z0-9_]*)/);
    if (exportMatch && exportMatch[2]) {
      return exportMatch[2];
    }
    
    // Look for const ComponentName = ... export default ComponentName
    const constMatch = content.match(/const\s+([A-Z][A-Za-z0-9_]*)\s*=/);
    if (constMatch && constMatch[1]) {
      // Check if this const is exported
      const exportConstMatch = content.includes(`export default ${constMatch[1]}`);
      if (exportConstMatch) {
        return constMatch[1];
      }
    }
    
    // Fallback to file name
    const fileName = path.basename(filePath, path.extname(filePath));
    return fileName.charAt(0).toUpperCase() + fileName.slice(1);
  } catch (error) {
    console.error(`Error extracting component name from ${filePath}:`, error);
    return path.basename(filePath, path.extname(filePath));
  }
}

// Main function
async function main() {
  console.log('Analyzing codebase for unused components...');
  
  // Get all component files
  const componentFiles = getAllComponentFiles();
  console.log(`Found ${componentFiles.length} component files`);
  
  // Check each component for usage
  const unusedComponents = [];
  
  for (const componentFile of componentFiles) {
    const componentName = extractComponentName(componentFile);
    const isUsed = isComponentUsed(componentName, componentFile);
    
    if (!isUsed) {
      unusedComponents.push({
        name: componentName,
        path: path.relative(process.cwd(), componentFile)
      });
    }
  }
  
  // Generate report
  let report = '# Unused Components Report\n\n';
  report += 'This report identifies components that are not imported or used elsewhere in the project.\n\n';
  
  if (unusedComponents.length === 0) {
    report += '**No unused components found!** All components appear to be imported somewhere in the project.\n';
  } else {
    report += `Found ${unusedComponents.length} potentially unused components:\n\n`;
    
    for (const component of unusedComponents) {
      report += `## ${component.name}\n\n`;
      report += `**File:** \`${component.path}\`\n\n`;
      
      // Add a warning about potential false positives
      report += '> ⚠️ **Note:** This component might still be used if:\n';
      report += '> - It is imported dynamically using `React.lazy()` or a similar mechanism\n';
      report += '> - It is referenced by a string name (e.g., in a component registry)\n';
      report += '> - It is used in a way that the static analysis couldn\'t detect\n\n';
      
      report += '---\n\n';
    }
    
    report += '## Recommendations\n\n';
    report += '1. Review each component to confirm it\'s truly unused\n';
    report += '2. Consider removing confirmed unused components\n';
    report += '3. For components that should be kept, add a comment explaining why\n';
  }
  
  // Save the report
  fs.writeFileSync(OUTPUT_FILE, report);
  console.log(`Report generated at ${OUTPUT_FILE}`);
  
  console.log('Done!');
}

main().catch(error => {
  console.error('Error analyzing components:', error);
  process.exit(1);
}); 
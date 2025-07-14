#!/usr/bin/env node

/**
 * Code Duplication Refactoring Implementation
 * 
 * This script implements the refactoring changes identified in the code-refactoring-plan.md document.
 * It updates imports and removes duplicate files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const BACKUP_DIR = path.join(ROOT_DIR, 'backup-before-refactor');

// Files to refactor
const REFACTORINGS = [
  {
    name: 'Logger Implementation',
    removeFile: 'src/lib/logger.js',
    keepFile: 'src/lib/logger.ts',
    importPattern: "from '(.*/)?logger(?:\\.js)?'",
    newImport: "from '@/lib/logger'"
  },
  {
    name: 'Environment Configuration',
    removeFile: 'src/lib/env.js',
    keepFile: 'src/lib/env.ts',
    importPattern: "from '(.*/)?env(?:\\.js)?'",
    newImport: "from '@/lib/env'"
  },
  {
    name: 'Authentication Service',
    removeFile: 'src/lib/auth.ts',
    keepFile: 'src/api/auth/authService.ts',
    importPattern: "from '(.*/)?auth'",
    newImport: "from '@/api/auth/authService'"
  },
  {
    name: 'Toast Hook',
    removeFile: null, // Don't remove, just update imports
    keepFile: 'src/hooks/use-toast.ts',
    importPattern: "from '@/components/ui/use-toast'",
    newImport: "from '@/hooks/use-toast'"
  }
];

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Backup a file before modifying it
 */
function backupFile(filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath);
  const backupPath = path.join(BACKUP_DIR, relativePath);
  
  // Create directory if it doesn't exist
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Copy file
  fs.copyFileSync(filePath, backupPath);
  console.log(`Backed up: ${relativePath}`);
}

/**
 * Find files with imports that need to be updated
 */
function findFilesWithImport(pattern) {
  try {
    const grepCommand = `grep -r "${pattern}" ${SRC_DIR} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"`;
    const result = execSync(grepCommand, { encoding: 'utf8' });
    
    return result
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const [filePath] = line.split(':', 1);
        return filePath;
      })
      .filter((value, index, self) => self.indexOf(value) === index); // Unique values
  } catch (error) {
    // grep returns non-zero exit code if no matches found
    if (error.status !== 1) {
      console.error(`Error searching for imports with pattern ${pattern}:`, error);
    }
    return [];
  }
}

/**
 * Update imports in a file
 */
function updateImports(filePath, pattern, replacement) {
  // Backup the file
  backupFile(filePath);
  
  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Create regex from pattern
  const regex = new RegExp(`import\\s+(.*)\\s+${pattern}`, 'g');
  
  // Replace imports
  const newContent = content.replace(regex, `import $1 ${replacement}`);
  
  // Write updated content
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated imports in: ${filePath}`);
    return true;
  }
  
  return false;
}

/**
 * Consolidate cache implementation
 */
function consolidateCache() {
  console.log('\nConsolidating cache implementation...');
  
  const cacheFile = path.join(SRC_DIR, 'lib', 'cache.js');
  const memoryCacheFile = path.join(SRC_DIR, 'lib', 'memoryCache.js');
  
  // Backup files
  backupFile(cacheFile);
  backupFile(memoryCacheFile);
  
  // Read file contents
  const cacheContent = fs.readFileSync(cacheFile, 'utf8');
  const memoryCacheContent = fs.readFileSync(memoryCacheFile, 'utf8');
  
  // Create consolidated file
  const consolidatedContent = `/**
 * Consolidated Cache Implementation
 * 
 * This file combines the Redis cache and memory cache implementations
 * into a single module with automatic fallback to memory cache when Redis is unavailable.
 */

import { createClient } from 'redis';

// Create Redis client
let redisClient;
let useMemoryCache = true; // Default to memory cache
let redisConnectionAttempted = false;

// Simple in-memory cache
const memoryCache = new Map();
const expiryTimes = new Map();

// Cache TTLs in seconds
export const TTL = {
  SHORT: 60,         // 1 minute
  MEDIUM: 300,       // 5 minutes
  LONG: 3600,        // 1 hour
  VERY_LONG: 86400   // 24 hours
};

// Initialize Redis client
export const initRedisClient = async () => {
  // If we've already tried to connect and failed, just use memory cache
  if (redisConnectionAttempted) {
    return null;
  }
  
  try {
    // Check if Redis URL is provided in environment variables
    const redisUrl = process.env.REDIS_URL;
    
    // If no Redis URL is provided, use memory cache without attempting connection
    if (!redisUrl) {
      console.log('No REDIS_URL provided, using in-memory cache');
      useMemoryCache = true;
      redisConnectionAttempted = true;
      return null;
    }
    
    redisClient = createClient({
      url: redisUrl
    });
    
    // Handle Redis client events
    redisClient.on('error', (err) => {
      if (!useMemoryCache) {
        console.error('Redis client error, falling back to in-memory cache');
        useMemoryCache = true;
      }
    });
    
    redisClient.on('connect', () => {
      console.log('Connected to Redis');
      useMemoryCache = false;
    });
    
    // Connect to Redis
    await redisClient.connect();
    redisConnectionAttempted = true;
    
    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis client, using in-memory cache');
    useMemoryCache = true;
    redisConnectionAttempted = true;
    return null;
  }
};

// Get Redis client (initialize if needed)
export const getRedisClient = async () => {
  if (useMemoryCache) {
    return null;
  }
  
  if (!redisClient && !redisConnectionAttempted) {
    return await initRedisClient();
  }
  return redisClient;
};

// MEMORY CACHE IMPLEMENTATION

// Set cache with TTL (memory implementation)
const setMemoryCache = async (key, data, ttl = TTL.MEDIUM) => {
  try {
    // Store data in cache
    memoryCache.set(key, JSON.stringify(data));
    
    // Set expiry time
    const expiryTime = Date.now() + ttl * 1000;
    expiryTimes.set(key, expiryTime);
    
    // Schedule cleanup
    setTimeout(() => {
      if (memoryCache.has(key)) {
        memoryCache.delete(key);
        expiryTimes.delete(key);
      }
    }, ttl * 1000);
    
    return true;
  } catch (error) {
    console.error('Memory cache set error:', error);
    return false;
  }
};

// Get cache (memory implementation)
const getMemoryCache = async (key) => {
  try {
    // Check if key exists and not expired
    if (memoryCache.has(key) && expiryTimes.has(key)) {
      const expiryTime = expiryTimes.get(key);
      
      // If expired, delete and return null
      if (Date.now() > expiryTime) {
        memoryCache.delete(key);
        expiryTimes.delete(key);
        return null;
      }
      
      // Return data
      const data = memoryCache.get(key);
      return data ? JSON.parse(data) : null;
    }
    
    return null;
  } catch (error) {
    console.error('Memory cache get error:', error);
    return null;
  }
};

// Delete cache (memory implementation)
const deleteMemoryCache = async (key) => {
  try {
    memoryCache.delete(key);
    expiryTimes.delete(key);
    return true;
  } catch (error) {
    console.error('Memory cache delete error:', error);
    return false;
  }
};

// Delete cache by pattern (memory implementation)
const deleteMemoryCacheByPattern = async (pattern) => {
  try {
    const regex = new RegExp(pattern.replace('*', '.*'));
    
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
        expiryTimes.delete(key);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Memory cache delete by pattern error:', error);
    return false;
  }
};

// Clear all cache (memory implementation)
const clearMemoryCache = async () => {
  try {
    memoryCache.clear();
    expiryTimes.clear();
    return true;
  } catch (error) {
    console.error('Memory cache clear error:', error);
    return false;
  }
};

// PUBLIC API

// Set cache with TTL
export const setCache = async (key, data, ttl = TTL.MEDIUM) => {
  try {
    const client = await getRedisClient();
    if (!client) {
      return await setMemoryCache(key, data, ttl);
    }
    
    await client.setEx(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return setMemoryCache(key, data, ttl);
  }
};

// Get cache
export const getCache = async (key) => {
  try {
    const client = await getRedisClient();
    if (!client) {
      return await getMemoryCache(key);
    }
    
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return getMemoryCache(key);
  }
};

// Delete cache
export const deleteCache = async (key) => {
  try {
    const client = await getRedisClient();
    if (!client) {
      return await deleteMemoryCache(key);
    }
    
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return deleteMemoryCache(key);
  }
};

// Delete cache by pattern
export const deleteCacheByPattern = async (pattern) => {
  try {
    const client = await getRedisClient();
    if (!client) {
      return await deleteMemoryCacheByPattern(pattern);
    }
    
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Cache delete by pattern error:', error);
    return deleteMemoryCacheByPattern(pattern);
  }
};

// Clear all cache
export const clearCache = async () => {
  try {
    const client = await getRedisClient();
    if (!client) {
      return await clearMemoryCache();
    }
    
    await client.flushAll();
    return true;
  } catch (error) {
    console.error('Cache clear error:', error);
    return clearMemoryCache();
  }
};

export default {
  TTL,
  initRedisClient,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  deleteCacheByPattern,
  clearCache
};`;
  
  // Write consolidated file
  fs.writeFileSync(cacheFile, consolidatedContent);
  console.log(`Created consolidated cache implementation in: ${cacheFile}`);
  
  // Update imports
  const filesToUpdate = findFilesWithImport("from '(.*/)?memoryCache(?:\\.js)?'");
  
  for (const file of filesToUpdate) {
    updateImports(file, "from '(.*/)?memoryCache(?:\\.js)?'", "from '@/lib/cache'");
  }
  
  console.log(`Updated ${filesToUpdate.length} files to use consolidated cache implementation`);
}

/**
 * Main function
 */
async function main() {
  console.log('Starting code refactoring implementation...');
  
  // Process each refactoring
  for (const refactoring of REFACTORINGS) {
    console.log(`\nProcessing: ${refactoring.name}`);
    
    // Find files with imports that need to be updated
    const filesToUpdate = findFilesWithImport(refactoring.importPattern);
    console.log(`Found ${filesToUpdate.length} files with imports to update`);
    
    // Update imports in each file
    let updatedCount = 0;
    for (const file of filesToUpdate) {
      const updated = updateImports(file, refactoring.importPattern, refactoring.newImport);
      if (updated) updatedCount++;
    }
    
    console.log(`Updated imports in ${updatedCount} files`);
    
    // Remove duplicate file if specified
    if (refactoring.removeFile) {
      const fullPath = path.join(ROOT_DIR, refactoring.removeFile);
      
      if (fs.existsSync(fullPath)) {
        // Backup the file
        backupFile(fullPath);
        
        // Remove the file
        fs.unlinkSync(fullPath);
        console.log(`Removed duplicate file: ${refactoring.removeFile}`);
      } else {
        console.log(`File not found: ${refactoring.removeFile}`);
      }
    }
  }
  
  // Consolidate cache implementation
  consolidateCache();
  
  console.log('\nRefactoring implementation complete!');
  console.log(`Backup files are stored in: ${BACKUP_DIR}`);
  console.log('\nPlease test the application to ensure everything works correctly.');
}

main().catch(error => {
  console.error('Error during refactoring:', error);
  process.exit(1);
}); 
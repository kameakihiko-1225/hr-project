import { createClient } from 'redis';
import * as memoryCache from './memoryCache.js';

// Create Redis client
let redisClient;
let useMemoryCache = true; // Default to memory cache
let redisConnectionAttempted = false;

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

// Set cache with TTL
export const setCache = async (key, data, ttl = TTL.MEDIUM) => {
  try {
    const client = await getRedisClient();
    if (!client) {
      return await memoryCache.setCache(key, data, ttl);
    }
    
    await client.setEx(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return memoryCache.setCache(key, data, ttl);
  }
};

// Get cache
export const getCache = async (key) => {
  try {
    const client = await getRedisClient();
    if (!client) {
      return await memoryCache.getCache(key);
    }
    
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return memoryCache.getCache(key);
  }
};

// Delete cache
export const deleteCache = async (key) => {
  try {
    const client = await getRedisClient();
    if (!client) {
      return await memoryCache.deleteCache(key);
    }
    
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return memoryCache.deleteCache(key);
  }
};

// Delete cache by pattern
export const deleteCacheByPattern = async (pattern) => {
  try {
    const client = await getRedisClient();
    if (!client) {
      return await memoryCache.deleteCacheByPattern(pattern);
    }
    
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Cache delete by pattern error:', error);
    return memoryCache.deleteCacheByPattern(pattern);
  }
};

// Clear all cache
export const clearCache = async () => {
  try {
    const client = await getRedisClient();
    if (!client) {
      return await memoryCache.clearCache();
    }
    
    await client.flushAll();
    return true;
  } catch (error) {
    console.error('Cache clear error:', error);
    return memoryCache.clearCache();
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
}; 
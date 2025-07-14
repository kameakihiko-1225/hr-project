// Simple in-memory cache for environments without Redis
const cache = new Map();
const expiryTimes = new Map();

// Cache TTLs in seconds (same as Redis cache)
export const TTL = {
  SHORT: 60,         // 1 minute
  MEDIUM: 300,       // 5 minutes
  LONG: 3600,        // 1 hour
  VERY_LONG: 86400   // 24 hours
};

// Set cache with TTL
export const setCache = async (key, data, ttl = TTL.MEDIUM) => {
  try {
    // Store data in cache
    cache.set(key, JSON.stringify(data));
    
    // Set expiry time
    const expiryTime = Date.now() + ttl * 1000;
    expiryTimes.set(key, expiryTime);
    
    // Schedule cleanup
    setTimeout(() => {
      if (cache.has(key)) {
        cache.delete(key);
        expiryTimes.delete(key);
      }
    }, ttl * 1000);
    
    return true;
  } catch (error) {
    console.error('Memory cache set error:', error);
    return false;
  }
};

// Get cache
export const getCache = async (key) => {
  try {
    // Check if key exists and not expired
    if (cache.has(key) && expiryTimes.has(key)) {
      const expiryTime = expiryTimes.get(key);
      
      // If expired, delete and return null
      if (Date.now() > expiryTime) {
        cache.delete(key);
        expiryTimes.delete(key);
        return null;
      }
      
      // Return data
      const data = cache.get(key);
      return data ? JSON.parse(data) : null;
    }
    
    return null;
  } catch (error) {
    console.error('Memory cache get error:', error);
    return null;
  }
};

// Delete cache
export const deleteCache = async (key) => {
  try {
    cache.delete(key);
    expiryTimes.delete(key);
    return true;
  } catch (error) {
    console.error('Memory cache delete error:', error);
    return false;
  }
};

// Delete cache by pattern
export const deleteCacheByPattern = async (pattern) => {
  try {
    const regex = new RegExp(pattern.replace('*', '.*'));
    
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
        expiryTimes.delete(key);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Memory cache delete by pattern error:', error);
    return false;
  }
};

// Clear all cache
export const clearCache = async () => {
  try {
    cache.clear();
    expiryTimes.clear();
    return true;
  } catch (error) {
    console.error('Memory cache clear error:', error);
    return false;
  }
};

// Initialize memory cache (no-op for compatibility with Redis interface)
export const initRedisClient = async () => {
  console.log('Using in-memory cache instead of Redis');
  return null;
};

// Get Redis client (no-op for compatibility with Redis interface)
export const getRedisClient = async () => {
  return null;
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
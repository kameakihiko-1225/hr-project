import { getCache, setCache, TTL } from '../../lib/cache.js';

// Cache middleware factory
export const cacheMiddleware = (keyPrefix, ttl = TTL.MEDIUM) => {
  return async (req, res, next) => {
    try {
      // Skip caching for non-GET requests
      if (req.method !== 'GET') {
        return next();
      }
      
      // Generate cache key based on URL and query params
      const queryString = Object.keys(req.query)
        .sort()
        .map(key => `${key}=${req.query[key]}`)
        .join('&');
        
      const cacheKey = `${keyPrefix}:${req.path}${queryString ? `?${queryString}` : ''}`;
      
      // Try to get data from cache
      const cachedData = await getCache(cacheKey);
      
      if (cachedData) {
        // Return cached data
        return res.status(200).json(cachedData);
      }
      
      // Store original res.json method
      const originalJson = res.json;
      
      // Override res.json method to cache the response
      res.json = function(data) {
        // Cache the response data if status is 200
        if (res.statusCode === 200 || res.statusCode === 201) {
          setCache(cacheKey, data, ttl).catch(err => {
            console.error('Error caching response:', err);
          });
        }
        
        // Call the original json method
        return originalJson.call(this, data);
      };
      
      // Continue to the next middleware/handler
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Cache invalidation middleware
export const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    try {
      // Store original res.json method
      const originalJson = res.json;
      
      // Override res.json method to invalidate cache on success
      res.json = function(data) {
        // If response is successful, invalidate cache
        if (res.statusCode >= 200 && res.statusCode < 300) {
          import('../../lib/cache.js').then(cache => {
            cache.deleteCacheByPattern(pattern).catch(err => {
              console.error('Error invalidating cache:', err);
            });
          });
        }
        
        // Call the original json method
        return originalJson.call(this, data);
      };
      
      // Continue to the next middleware/handler
      next();
    } catch (error) {
      console.error('Cache invalidation middleware error:', error);
      next();
    }
  };
};

export default {
  cacheMiddleware,
  invalidateCache
}; 
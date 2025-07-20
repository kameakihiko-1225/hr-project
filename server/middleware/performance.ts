import { Request, Response, NextFunction } from 'express';
import compression from 'compression';

// Enhanced performance middleware
export const performanceMiddleware = {
  // Advanced compression middleware
  compression: compression({
    level: 6,
    threshold: 1024,
    filter: (req: Request, res: Response) => {
      // Don't compress responses if the cache is fresh
      if (req.headers['cache-control'] === 'no-cache') {
        return false;
      }
      return compression.filter(req, res);
    }
  }),

  // Cache optimization for admin routes
  adminCacheHeaders: (req: Request, res: Response, next: NextFunction) => {
    const isAdminRoute = req.path.startsWith('/api/') && (
      req.query.raw === 'true' || 
      req.path.includes('/admin') ||
      req.method !== 'GET'
    );

    if (isAdminRoute) {
      // No cache for admin data to ensure fresh updates
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
    } else {
      // Optimize cache for public routes
      res.set({
        'Cache-Control': 'public, max-age=300', // 5 minutes
        'ETag': `public-${Date.now()}`
      });
    }
    next();
  },

  // Request timing middleware for performance monitoring
  requestTiming: (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      // Log slow requests for optimization
      if (duration > 1000) { // Requests taking more than 1 second
        console.warn(`[PERFORMANCE] Slow request: ${req.method} ${req.path} - ${duration}ms`);
      }
      
      // Only set headers if response is not finished
      if (!res.headersSent) {
        try {
          res.set('X-Response-Time', `${duration}ms`);
        } catch (error) {
          // Headers already sent, ignore
        }
      }
    });
    
    next();
  },

  // Database query optimization middleware
  optimizeDatabaseQueries: (req: Request, res: Response, next: NextFunction) => {
    // Add query hints for better performance
    if (req.query.includePositions === 'true') {
      req.query._optimizeJoins = 'true';
    }
    
    if (req.query.raw === 'true') {
      req.query._skipLocalization = 'true';
    }
    
    next();
  },

  // Response compression and optimization
  responseOptimization: (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      // Optimize large JSON responses
      if (typeof data === 'object' && data !== null) {
        // Remove unnecessary fields for admin responses
        if (req.query.raw === 'true' && Array.isArray(data.data)) {
          data.data = data.data.map((item: any) => {
            // Remove heavy computed fields for admin interfaces
            const { __computed, ...optimizedItem } = item;
            return optimizedItem;
          });
        }
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  }
};

// Performance monitoring utility
export const performanceMonitor = {
  trackQuery: (queryName: string, startTime: number) => {
    const duration = Date.now() - startTime;
    
    if (duration > 500) {
      console.warn(`[DB-PERFORMANCE] Slow query ${queryName}: ${duration}ms`);
    }
    
    return duration;
  },

  optimizeQuery: (queryBuilder: any, options: any = {}) => {
    // Add database-level optimizations
    if (options.limit && !options.offset) {
      queryBuilder = queryBuilder.limit(options.limit);
    }
    
    if (options.selectFields) {
      queryBuilder = queryBuilder.select(options.selectFields);
    }
    
    return queryBuilder;
  }
};
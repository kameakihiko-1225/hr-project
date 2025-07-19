import compression from 'compression';
import { Request, Response } from 'express';

// Configure compression middleware for better performance
export const compressionMiddleware = compression({
  // Only compress responses larger than 1KB
  threshold: 1024,
  
  // Compression level (1-9, 6 is default, 1 is fastest)
  level: 6,
  
  // Only compress certain content types
  filter: (req: Request, res: Response) => {
    // Don't compress if the request includes a cache-control no-transform directive
    if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
      return false;
    }
    
    // Default compression filter
    return compression.filter(req, res);
  },
  
  // Memory level (1-9, 8 is default)
  memLevel: 8,
  
  // Window bits (9-15, 15 is default)
  windowBits: 15,
  
  // Compression strategy
  strategy: 0 // Z_DEFAULT_STRATEGY
});

// Configure specific compression for API responses
export const apiCompressionMiddleware = compression({
  threshold: 512, // Smaller threshold for API responses
  level: 6,
  filter: (req: Request, res: Response) => {
    // Always compress JSON API responses
    return req.path.startsWith('/api/') && compression.filter(req, res);
  }
});
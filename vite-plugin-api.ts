import { Plugin } from 'vite';
import path from 'path';

/**
 * Vite plugin to handle API requests
 * This allows us to have API endpoints without a separate server
 */
export function apiPlugin(): Plugin {
  return {
    name: 'vite-plugin-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url;
        
        // Only handle /api routes
        if (!url || !url.startsWith('/api')) {
          return next();
        }
        
        try {
          // Dynamically import the API router to avoid issues with Vite's module resolution
          const apiModule = await import('./src/api/index');
          const apiRouter = apiModule.apiRouter;
          
          // Create a logger
          const loggerModule = await import('./src/lib/logger');
          const createLogger = loggerModule.createLogger;
          const logger = createLogger('apiPlugin');
          
          // Create a Request object from the incoming request
          const request = new Request(`http://localhost${url}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: req.method !== 'GET' && req.method !== 'HEAD' ? await readBody(req) : undefined,
          });
          
          logger.debug(`Handling API request: ${req.method} ${url}`);
          
          // Handle the API request
          const response = await apiRouter(request);
          
          // Send the response
          res.statusCode = response.status;
          
          // Set headers
          response.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });
          
          // Send body
          const body = await response.text();
          res.end(body);
        } catch (error) {
          console.error('Error in API middleware:', error);
          
          // Send error response
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            success: false, 
            error: 'Internal server error' 
          }));
        }
      });
    },
  };
}

/**
 * Read the request body as a string
 */
function readBody(req: any): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
  });
}

export default apiPlugin; 
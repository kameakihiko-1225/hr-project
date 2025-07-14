import { createLogger } from '../../lib/logger';

// Create a logger for the middleware
const logger = createLogger('middleware');

/**
 * Logging middleware
 * Logs API requests
 */
export function loggingMiddleware(req: Request): void {
  try {
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname;
    
    logger.info(`${method} ${path}`);
    
    // Log query parameters if present
    if (url.search) {
      logger.debug(`Query parameters: ${url.search}`);
    }
  } catch (error) {
    logger.error('Error in logging middleware', error);
  }
}

export default loggingMiddleware; 
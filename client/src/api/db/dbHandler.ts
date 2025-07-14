import { dbService } from './dbService';
import { createLogger } from '../../lib/logger';

// Create a logger for the database handler
const logger = createLogger('dbHandler');

/**
 * Database Handler
 * Provides API endpoints for database operations
 */
export const dbHandler = {
  /**
   * Check database health
   * GET /api/db/health
   */
  async checkHealth(req: Request): Promise<Response> {
    try {
      logger.debug('Checking database health');
      
      const isHealthy = await dbService.checkHealth();
      
      if (isHealthy) {
        logger.info('Database health check passed');
        return new Response(
          JSON.stringify({
            status: 'healthy',
            message: 'Database connection is healthy',
          }),
          { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      } else {
        logger.warn('Database health check failed');
        return new Response(
          JSON.stringify({
            status: 'unhealthy',
            message: 'Database connection is not healthy',
          }),
          { 
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (error) {
      logger.error('Error checking database health', error);
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'An error occurred while checking database health',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },
  
  /**
   * Get database statistics
   * GET /api/db/stats
   */
  async getStats(req: Request): Promise<Response> {
    try {
      logger.debug('Getting database statistics');
      
      const stats = await dbService.getStats();
      
      logger.info('Successfully retrieved database statistics');
      return new Response(
        JSON.stringify(stats),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      logger.error('Error getting database statistics', error);
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'An error occurred while getting database statistics',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },
  
  /**
   * Get database version
   * GET /api/db/version
   */
  async getVersion(req: Request): Promise<Response> {
    try {
      logger.debug('Getting database version');
      
      const version = await dbService.getVersion();
      
      logger.info('Successfully retrieved database version');
      return new Response(
        JSON.stringify({
          version,
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      logger.error('Error getting database version', error);
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'An error occurred while getting database version',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },
};

export default dbHandler; 
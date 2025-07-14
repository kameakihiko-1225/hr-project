import { createLogger } from '@/lib/logger';
import { dashboardService } from './dashboardService';

// Create a logger for the dashboard handler
const logger = createLogger('dashboardHandler');

/**
 * Dashboard Handler
 * Provides API endpoints for dashboard operations
 */
export const dashboardHandler = {
  /**
   * Get dashboard statistics
   * GET /api/dashboard/stats
   */
  async getStats(req: Request): Promise<Response> {
    try {
      logger.debug('Getting dashboard statistics');
      
      const stats = await dashboardService.getStats();
      
      return new Response(
        JSON.stringify({
          success: true,
          data: stats,
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      logger.error('Error getting dashboard statistics', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to get dashboard statistics',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
};

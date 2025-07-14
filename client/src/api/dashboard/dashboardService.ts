import { createLogger } from '@/lib/logger';
import prisma from '@/lib/prisma';

// Create a logger for the dashboard service
const logger = createLogger('dashboardService');

/**
 * Dashboard Service
 * Provides methods for fetching dashboard data
 */
class DashboardService {
  /**
   * Get dashboard statistics
   * @returns Dashboard statistics
   */
  async getStats() {
    try {
      logger.debug('Fetching dashboard statistics from database');
      
      // Get company count
      const companyCount = await prisma.company.count();
      
      // Get department count
      const departmentCount = await prisma.department.count();
      
      // Get position count
      const positionCount = await prisma.position.count();
      
      // Get candidate count
      const candidateCount = await prisma.candidate.count();
      
      // Get matched/hired candidate count
      const matchedCandidateCount = await prisma.candidate.count({
        where: {
          status: {
            in: ['hired', 'matched']
          }
        }
      });
      
      // Calculate match rate as a percentage string
      const matchRate = candidateCount > 0 ? `${Math.round((matchedCandidateCount / candidateCount) * 100)}%` : '0%';
      
      // Return all stats
      return {
        companies: companyCount,
        departments: departmentCount,
        positions: positionCount,
        candidates: candidateCount,
        matchRate,
      };
    } catch (error) {
      logger.error('Error fetching dashboard statistics', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const dashboardService = new DashboardService();

export default dashboardService;

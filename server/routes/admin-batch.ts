import { Express } from 'express';
import { storage } from '../storage';
import { performanceMonitor } from '../middleware/performance';
import { StorageOptimizations } from '../storage-optimizations';

// Batch API endpoint for admin dashboard optimization
export function registerAdminBatchRoutes(app: Express) {
  
  // Optimized batch endpoint for admin dashboard
  app.get('/api/admin/batch-data', async (req, res) => {
    const startTime = Date.now();
    
    try {
      console.log('[ADMIN-BATCH] Starting optimized batch data fetch');
      
      // Use the highly optimized batch query
      const adminData = await StorageOptimizations.getAdminBatchData();
      
      const duration = performanceMonitor.trackQuery('admin-batch-data', startTime);
      
      console.log(`[ADMIN-BATCH] Optimized batch request completed in ${duration}ms`);
      console.log(`[ADMIN-BATCH] Data summary: ${adminData.companies.length} companies, ${adminData.departments.length} departments, ${adminData.positions.length} positions`);
      
      res.json({
        success: true,
        data: {
          ...adminData,
          performanceInfo: {
            ...adminData.performanceInfo,
            totalQueryTime: duration,
            dataFreshness: new Date().toISOString()
          }
        }
      });

    } catch (error: any) {
      console.error('[ADMIN-BATCH] Batch request failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch admin data',
        details: error.message
      });
    }
  });

  // Optimized positions batch with filtering
  app.get('/api/admin/positions-batch', async (req, res) => {
    const startTime = Date.now();
    
    try {
      const departmentId = req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined;
      const includeStats = req.query.includeStats === 'true';
      
      console.log(`[POSITIONS-BATCH] Fetching positions for department: ${departmentId}`);
      
      const batchPromises = [
        storage.getAllPositions(undefined, departmentId),
        storage.getAllDepartments(),
        storage.getAllCompanies()
      ];
      
      if (includeStats) {
        batchPromises.push(storage.getTopAppliedPositions(50));
      }
      
      const results = await Promise.allSettled(batchPromises);
      
      const positions = results[0].status === 'fulfilled' ? results[0].value : [];
      const departments = results[1].status === 'fulfilled' ? results[1].value : [];
      const companies = results[2].status === 'fulfilled' ? results[2].value : [];
      const applicantCounts = includeStats && results[3]?.status === 'fulfilled' 
        ? results[3].value : [];
      
      const duration = performanceMonitor.trackQuery('positions-batch', startTime);
      
      res.json({
        success: true,
        data: {
          positions,
          departments,
          companies,
          applicantCounts,
          performanceInfo: {
            queryTime: duration,
            filtered: !!departmentId,
            includeStats
          }
        }
      });

    } catch (error: any) {
      console.error('[POSITIONS-BATCH] Failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch positions data'
      });
    }
  });

  // Optimized dashboard stats with caching
  app.get('/api/admin/dashboard-optimized', async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Parallel fetch of dashboard data
      const [statsResult, clickStatsResult, recentActivityResult] = await Promise.allSettled([
        storage.getDashboardStats(),
        storage.getDashboardClickStats(),
        storage.getRecentActivity?.(10) // Optional method
      ]);
      
      const stats = statsResult.status === 'fulfilled' ? statsResult.value : {};
      const clickStats = clickStatsResult.status === 'fulfilled' ? clickStatsResult.value : {};
      const recentActivity = recentActivityResult?.status === 'fulfilled' ? recentActivityResult.value : [];
      
      const duration = performanceMonitor.trackQuery('dashboard-optimized', startTime);
      
      res.json({
        success: true,
        data: {
          ...stats,
          ...clickStats,
          recentActivity,
          performanceInfo: {
            queryTime: duration,
            cacheStatus: 'fresh'
          }
        }
      });

    } catch (error: any) {
      console.error('[DASHBOARD-OPTIMIZED] Failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard data'
      });
    }
  });
}
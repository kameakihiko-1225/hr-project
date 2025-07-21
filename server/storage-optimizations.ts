import { db } from './db';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { 
  companies as companiesTable, 
  departments as departmentsTable, 
  positions as positionsTable,
  positionClicks,
  companyIndustryTags as companyIndustryTagsTable,
  industryTags as industryTagsTable
} from '@shared/schema';

// Database optimization utilities for admin performance
export class StorageOptimizations {
  
  // Optimized batch query for admin dashboard
  static async getAdminBatchData() {
    const startTime = Date.now();
    
    try {
      // Execute all queries in parallel for maximum performance
      const [
        companiesResult,
        departmentsResult,
        positionsResult,
        statsResult,
        clickStatsResult
      ] = await Promise.allSettled([
        // Companies with industry tags in single query
        db.select({
          id: companiesTable.id,
          name: companiesTable.name,
          description: companiesTable.description,
          logoUrl: companiesTable.logoUrl,
          color: companiesTable.color,
          address: companiesTable.address,
          phone: companiesTable.phone,
          email: companiesTable.email,
          city: companiesTable.city,
          country: companiesTable.country,
          adminId: companiesTable.adminId,
          createdAt: companiesTable.createdAt,
          industryId: companyIndustryTagsTable.industryTagId,
          industryName: industryTagsTable.name,
          industryDescription: industryTagsTable.description
        })
        .from(companiesTable)
        .leftJoin(companyIndustryTagsTable, eq(companiesTable.id, companyIndustryTagsTable.companyId))
        .leftJoin(industryTagsTable, eq(companyIndustryTagsTable.industryTagId, industryTagsTable.id)),
        
        // Departments with company info
        db.select({
          id: departmentsTable.id,
          name: departmentsTable.name,
          description: departmentsTable.description,
          companyId: departmentsTable.companyId,
          createdAt: departmentsTable.createdAt,
          companyName: companiesTable.name,
          companyLogoUrl: companiesTable.logoUrl
        })
        .from(departmentsTable)
        .leftJoin(companiesTable, eq(departmentsTable.companyId, companiesTable.id)),
        
        // Positions with counts
        db.select({
          id: positionsTable.id,
          title: positionsTable.title,
          description: positionsTable.description,
          salaryRange: positionsTable.salaryRange,
          employmentType: positionsTable.employmentType,
          departmentId: positionsTable.departmentId,
          applyLink: positionsTable.applyLink,
          createdAt: positionsTable.createdAt,
          departmentName: departmentsTable.name,
          companyName: companiesTable.name,
          appliedCount: sql<number>`COALESCE(${sql`(
            SELECT COUNT(*) 
            FROM ${positionClicks} 
            WHERE ${positionClicks.positionId} = ${positionsTable.id} 
            AND ${positionClicks.clickType} = 'apply'
          )`}, 0)`
        })
        .from(positionsTable)
        .leftJoin(departmentsTable, eq(positionsTable.departmentId, departmentsTable.id))
        .leftJoin(companiesTable, eq(departmentsTable.companyId, companiesTable.id)),
        
        // Dashboard stats
        db.select({
          totalCompanies: sql<number>`COUNT(DISTINCT ${companiesTable.id})`,
          totalDepartments: sql<number>`COUNT(DISTINCT ${departmentsTable.id})`,
          totalPositions: sql<number>`COUNT(DISTINCT ${positionsTable.id})`
        })
        .from(companiesTable)
        .leftJoin(departmentsTable, eq(companiesTable.id, departmentsTable.companyId))
        .leftJoin(positionsTable, eq(departmentsTable.id, positionsTable.departmentId)),
        
        // Click statistics
        db.select({
          totalViews: sql<number>`COALESCE(SUM(CASE WHEN ${positionClicks.clickType} = 'view' THEN 1 ELSE 0 END), 0)`,
          totalApplies: sql<number>`COALESCE(SUM(CASE WHEN ${positionClicks.clickType} = 'apply' THEN 1 ELSE 0 END), 0)`
        })
        .from(positionClicks)
      ]);
      
      // Process results with error handling
      const companies = this.processCompaniesResult(companiesResult);
      const departments = departmentsResult.status === 'fulfilled' ? departmentsResult.value : [];
      const positions = positionsResult.status === 'fulfilled' ? positionsResult.value : [];
      const stats = statsResult.status === 'fulfilled' ? statsResult.value[0] : {};
      const clickStats = clickStatsResult.status === 'fulfilled' ? clickStatsResult.value[0] : { totalViews: 0, totalApplies: 0 };
      
      const duration = Date.now() - startTime;
      
      return {
        companies,
        departments,
        positions,
        stats: {
          ...stats,
          ...clickStats,
          conversionRate: (clickStats.totalViews || 0) > 0 
            ? Math.round(((clickStats.totalApplies || 0) / (clickStats.totalViews || 0)) * 100 * 10) / 10 
            : 0
        },
        performanceInfo: {
          queryTime: duration,
          optimized: true,
          batchSize: companies.length + departments.length + positions.length
        }
      };
      
    } catch (error) {
      console.error('[StorageOptimizations] Batch query failed:', error);
      throw error;
    }
  }
  
  // Process companies result with industry aggregation
  static processCompaniesResult(companiesResult: any) {
    if (companiesResult.status !== 'fulfilled') return [];
    
    const companiesMap = new Map();
    
    companiesResult.value.forEach((row: any) => {
      if (!companiesMap.has(row.id)) {
        companiesMap.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          logoUrl: row.logoUrl,
          color: row.color,
          address: row.address,
          phone: row.phone,
          email: row.email,
          city: row.city,
          country: row.country,
          adminId: row.adminId,
          createdAt: row.createdAt,
          industries: []
        });
      }
      
      if (row.industryId && row.industryName) {
        const company = companiesMap.get(row.id);
        company.industries.push({
          id: row.industryId,
          name: row.industryName,
          description: row.industryDescription || '',
          createdAt: new Date()
        });
      }
    });
    
    return Array.from(companiesMap.values());
  }
  
  // Optimized positions query with filtering
  static async getOptimizedPositions(departmentId?: number, includeStats = true) {
    const startTime = Date.now();
    
    try {
      let positionsQuery = db.select({
        id: positionsTable.id,
        title: positionsTable.title,
        description: positionsTable.description,
        salaryRange: positionsTable.salaryRange,
        employmentType: positionsTable.employmentType,
        departmentId: positionsTable.departmentId,
        applyLink: positionsTable.applyLink,
        createdAt: positionsTable.createdAt,
        departmentName: departmentsTable.name,
        companyName: companiesTable.name,
        companyLogoUrl: companiesTable.logoUrl,
        appliedCount: includeStats ? sql<number>`COALESCE((
          SELECT COUNT(*) 
          FROM ${positionClicks} 
          WHERE ${positionClicks.positionId} = ${positionsTable.id} 
          AND ${positionClicks.clickType} = 'apply'
        ), 0)` : sql<number>`0`
      })
      .from(positionsTable)
      .leftJoin(departmentsTable, eq(positionsTable.departmentId, departmentsTable.id))
      .leftJoin(companiesTable, eq(departmentsTable.companyId, companiesTable.id));
      
      const baseQuery = positionsQuery;
      const finalQuery = departmentId 
        ? baseQuery.where(eq(positionsTable.departmentId, departmentId))
        : baseQuery;
      
      const positions = await finalQuery;
      
      const duration = Date.now() - startTime;
      
      return {
        positions,
        performanceInfo: {
          queryTime: duration,
          filtered: !!departmentId,
          includeStats,
          resultCount: positions.length
        }
      };
      
    } catch (error) {
      console.error('[StorageOptimizations] Positions query failed:', error);
      throw error;
    }
  }
  
  // Database performance monitoring
  static async getPerformanceMetrics() {
    try {
      const tableStatsResult = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        ORDER BY n_live_tup DESC
      `);
      
      const tableStats = tableStatsResult.rows || [];
      
      return {
        tableStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[StorageOptimizations] Performance metrics failed:', error);
      return { tableStats: [], timestamp: new Date().toISOString() };
    }
  }
}
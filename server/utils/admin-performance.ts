// Utility functions for admin performance monitoring and optimization

export class AdminPerformanceUtils {
  
  // Performance thresholds
  static readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  static readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
  static readonly BATCH_SIZE_LIMIT = 1000;
  
  // Track query performance
  static trackQueryPerformance(operation: string, startTime: number): number {
    const duration = Date.now() - startTime;
    
    if (duration > this.SLOW_QUERY_THRESHOLD) {
      console.warn(`[ADMIN-PERFORMANCE] Slow operation: ${operation} took ${duration}ms`);
    } else {
      console.log(`[ADMIN-PERFORMANCE] ${operation} completed in ${duration}ms`);
    }
    
    return duration;
  }
  
  // Generate performance report
  static generatePerformanceReport(operations: { name: string; duration: number }[]) {
    const totalTime = operations.reduce((sum, op) => sum + op.duration, 0);
    const slowOperations = operations.filter(op => op.duration > this.SLOW_QUERY_THRESHOLD);
    
    return {
      totalOperations: operations.length,
      totalTime,
      averageTime: Math.round(totalTime / operations.length),
      slowOperations: slowOperations.length,
      efficiency: slowOperations.length === 0 ? 'Excellent' : 
                  slowOperations.length < operations.length * 0.1 ? 'Good' : 
                  'Needs Optimization',
      recommendations: this.generateRecommendations(operations)
    };
  }
  
  // Generate performance recommendations
  static generateRecommendations(operations: { name: string; duration: number }[]): string[] {
    const recommendations: string[] = [];
    const slowOps = operations.filter(op => op.duration > this.SLOW_QUERY_THRESHOLD);
    
    if (slowOps.length > 0) {
      recommendations.push('Consider database indexing for slow operations');
      recommendations.push('Implement query result caching');
    }
    
    if (operations.length > 10) {
      recommendations.push('Consider batch processing for multiple operations');
    }
    
    const dbOperations = operations.filter(op => op.name.includes('db') || op.name.includes('query'));
    if (dbOperations.length > 5) {
      recommendations.push('Combine multiple database operations into single queries');
    }
    
    return recommendations;
  }
  
  // Cache management utilities
  static isCacheValid(timestamp: number, maxAge: number = this.CACHE_DURATION): boolean {
    return Date.now() - timestamp < maxAge;
  }
  
  // Optimize query parameters
  static optimizeQueryParams(params: any): any {
    // Remove unnecessary parameters
    const optimized = { ...params };
    
    // Convert string booleans to actual booleans
    Object.keys(optimized).forEach(key => {
      if (optimized[key] === 'true') optimized[key] = true;
      if (optimized[key] === 'false') optimized[key] = false;
    });
    
    return optimized;
  }
}
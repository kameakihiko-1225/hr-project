import { createLogger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { env } from '@/lib/env';
import { PrismaClient, Prisma } from '@prisma/client';

// Create a logger for the database service
const logger = createLogger('dbService');

// Helper function to safely stringify objects with BigInt values
function safeStringify(obj: any): string {
  return JSON.stringify(obj, (_, value) => 
    typeof value === 'bigint' ? Number(value) : value
  );
}

/**
 * Database service
 * Provides methods for common database operations with logging
 */
export class DbService {
  /**
   * Initialize the database
   * This should be called when the application starts
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing database connection');
      
      // Test the database connection
      await prisma.$connect();
      
      logger.info('Database connection established');
      
      // Additional initialization can be done here
      
      return Promise.resolve();
    } catch (error) {
      logger.error('Failed to initialize database connection', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Disconnect from the database
   * This should be called when the application shuts down
   */
  async disconnect(): Promise<void> {
    try {
      logger.info('Disconnecting from database');
      await prisma.$disconnect();
      logger.info('Database disconnected');
      return Promise.resolve();
    } catch (error) {
      logger.error('Failed to disconnect from database', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Execute a database transaction with logging
   */
  async transaction<T>(
    name: string,
    callback: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    logger.debug(`Starting transaction: ${name}`);
    const startTime = Date.now();
    
    try {
      const result = await prisma.$transaction(async (tx) => {
        return await callback(tx);
      });
      
      const duration = Date.now() - startTime;
      logger.debug(`Transaction completed: ${name} (${duration}ms)`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Transaction failed: ${name} (${duration}ms)`, error);
      throw error;
    }
  }
  
  /**
   * Execute a database query with logging
   * This is a helper method to log query execution time
   */
  async executeQuery<T>(
    name: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    logger.debug(`Executing query: ${name}`);
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      
      const duration = Date.now() - startTime;
      logger.debug(`Query completed: ${name} (${duration}ms)`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Query failed: ${name} (${duration}ms)`, error);
      throw error;
    }
  }
  
  /**
   * Check database health
   * Returns true if the database is healthy, false otherwise
   */
  async checkHealth(): Promise<boolean> {
    try {
      logger.debug('Checking database health');
      
      // Try to connect to the database
      await prisma.$connect();
      
      // Run a simple query to verify connection
      await prisma.$queryRaw`SELECT 1`;
      
      logger.info('Database health check passed');
      return true;
    } catch (error) {
      logger.error('Database health check failed', error);
      return false;
    } finally {
      try {
        // Always disconnect to prevent connection leaks
        await prisma.$disconnect();
      } catch (error) {
        logger.error('Error disconnecting from database', error);
      }
    }
  }
  
  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    try {
      logger.debug('Getting database statistics');
      
      // Get table information
      const tables = await prisma.$queryRaw`
        SELECT 
          t.table_name,
          (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
          (SELECT reltuples::bigint FROM pg_class WHERE relname = t.table_name) as row_count,
          pg_total_relation_size(t.table_name) as size_bytes,
          (
            SELECT MAX(last_value) 
            FROM pg_catalog.pg_sequences 
            WHERE schemaname = 'public' AND sequencename LIKE (t.table_name || '_%_seq')
          ) as last_id,
          NULL as last_updated
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
        ORDER BY t.table_name
      `;
      
      // Calculate total rows and size
      let totalRows = 0;
      let totalSize = 0;
      
      for (const table of tables as any[]) {
        totalRows += Number(table.row_count || 0);
        totalSize += Number(table.size_bytes || 0);
      }
      
      const stats = {
        tables,
        totalTables: tables.length,
        totalRows,
        totalSize,
        lastUpdated: new Date().toISOString(),
      };
      
      logger.info('Database statistics retrieved');
      return stats;
    } catch (error) {
      logger.error('Error getting database statistics', error);
      throw error;
    }
  }
  
  /**
   * Get database version
   * @returns {Promise<string>} Database version
   */
  async getVersion(): Promise<string> {
    try {
      logger.debug('Getting database version');
      
      const result = await prisma.$queryRaw`SELECT version()`;
      const version = result[0].version;
      
      logger.info(`Database version retrieved: ${version}`);
      return version;
    } catch (error) {
      logger.error('Error getting database version', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const dbService = new DbService();

export default dbService; 
# Database Connection Management

## Recent Improvements

We've made several improvements to the database connection management in the application to address connection pool timeout issues:

1. **Singleton Pattern**: Implemented a global singleton pattern for PrismaClient to prevent connection pool exhaustion.

2. **Connection Retry Logic**: Added robust retry logic with exponential backoff when establishing database connections.

3. **Graceful Shutdown**: Implemented proper connection cleanup on server shutdown to prevent connection leaks.

4. **Connection Health Middleware**: Added middleware to check database connection health before processing requests.

5. **Enhanced Health Check Endpoint**: Improved the `/api/db/health` endpoint to provide more detailed connection information.

## Connection Pool Configuration

Prisma Client automatically manages connection pooling with PostgreSQL. The default settings are:

- **Connection Limit**: Determined by your database provider (typically 10-100 connections)
- **Connection Timeout**: Typically 10 seconds
- **Idle Timeout**: Varies by database provider

> Note: Custom connection pool configuration requires environment variables or database URL parameters, not direct PrismaClient configuration.

## Common Connection Issues

### Connection Pool Timeout

The error `Timed out fetching a new connection from the connection pool` typically occurs when:

1. **Too Many Connections**: Your application is trying to use more connections than the pool allows.
2. **Connection Leaks**: Connections aren't being properly released back to the pool.
3. **Long-Running Queries**: Queries are taking too long, causing connections to remain occupied.
4. **Database Under Load**: The database server is overloaded and can't handle new connections quickly.

### Solutions

1. **Monitor Connection Usage**: 
   - Use the `/api/db/health` endpoint to check connection pool status.
   - Look for patterns of connection spikes.

2. **Optimize Queries**:
   - Add appropriate indexes.
   - Review and optimize slow queries.

3. **Implement Connection Pooling Best Practices**:
   - Don't create new PrismaClient instances for each request.
   - Always use the global singleton pattern (already implemented).
   - Ensure proper error handling to release connections.

4. **Configure Connection Pool via Environment Variables** (if needed):
   - For PostgreSQL, you can add parameters to your connection string:
     ```
     postgresql://user:password@localhost:5432/mydb?connection_limit=20&pool_timeout=30
     ```

5. **Scale Database Resources** (if needed):
   - Consider upgrading your database plan if consistently hitting limits.

## Best Practices for Prisma Usage

1. **Use a Single PrismaClient Instance**:
   ```typescript
   // Good - Use global singleton
   import { prisma } from '../lib/prisma';
   
   // Bad - Don't do this
   const prisma = new PrismaClient();
   ```

2. **Handle Transaction Errors Properly**:
   ```typescript
   try {
     await prisma.$transaction(async (tx) => {
       // Database operations
     });
   } catch (error) {
     console.error('Transaction failed:', error);
     // Handle error appropriately
   }
   ```

3. **Use Connection Middleware for Critical Operations**:
   For operations that must have a database connection, use the middleware pattern to ensure connection availability.

4. **Implement Circuit Breakers**:
   Consider implementing circuit breakers for database operations to prevent cascading failures.

## Monitoring Recommendations

1. Set up alerts for connection pool exhaustion.
2. Monitor database query performance regularly.
3. Implement logging for slow queries.
4. Periodically review connection usage patterns.

## Further Reading

- [Prisma Connection Management](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/connection-management)
- [Database Connection Pooling](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/connection-pool)
- [PostgreSQL Connection Handling](https://www.postgresql.org/docs/current/runtime-config-connection.html) 
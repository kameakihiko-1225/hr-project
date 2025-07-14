# Database Integration Documentation

This document provides comprehensive information about the database integration in the Aurora HRMS Portal project.

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Connection Management](#connection-management)
4. [Environment Configuration](#environment-configuration)
5. [Database Initialization](#database-initialization)
6. [Migrations](#migrations)
7. [Seeding](#seeding)
8. [API Endpoints](#api-endpoints)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

## Overview

The Aurora HRMS Portal uses PostgreSQL as its primary database, with Prisma as the ORM (Object-Relational Mapping) tool. The database integration is designed to work in both development and production environments, with special handling for browser environments.

### Key Components

- **Prisma Client**: Handles database queries and connections
- **Database Service**: Provides methods for database operations
- **Database Handler**: Exposes API endpoints for database operations
- **Database Initialization**: Sets up database connections and schema
- **Migration Scripts**: Manages database schema changes
- **Seeding Scripts**: Populates the database with initial data

## Database Schema

The database schema is defined in `prisma/schema.prisma`. It includes the following main models:

- `Admin`: Admin users who can manage the system
- `Company`: Companies registered in the system
- `Department`: Departments within companies
- `Position`: Job positions within departments
- `Candidate`: Job candidates
- `Interview`: Interview records
- `Document`: Document storage
- `Bot`: AI chatbot configurations
- `ChatSession`: Chat interactions with bots
- `BitrixMapping`: Integration mappings with Bitrix24
- `CrmDeal`: CRM deal records
- `MessagesQueue`: Queue for outgoing messages
- `SmsLog`: Logs of sent SMS messages

## Connection Management

Database connections are managed through the Prisma client, which is initialized in `src/lib/prisma.ts`. The client is configured to:

1. Use the database URL from environment variables
2. Cache the connection in development to prevent connection exhaustion
3. Use a mock client in browser environments to prevent direct database access

```typescript
// Example of how the Prisma client is initialized
export const prisma =
  (globalForPrisma.prisma as any) ||
  new PrismaClient({
    datasources: {
      db: {
        url: env.databaseUrl,
      },
    },
    log: env.isDevelopment ? ['error'] : ['error'],
  });
```

## Environment Configuration

Database configuration is managed through environment variables:

- `DATABASE_URL`: The connection string for the PostgreSQL database
- `VITE_DATABASE_URL`: The same as above, but accessible in the browser environment

Example `.env` file:

```
DATABASE_URL="postgresql://user:password@localhost:5432/aurora_hrms?schema=public"
VITE_DATABASE_URL="postgresql://user:password@localhost:5432/aurora_hrms?schema=public"
```

## Database Initialization

The database initialization process is handled in `src/lib/dbInit.ts`. It performs the following steps:

1. Establishes a connection to the database
2. Verifies that the database schema is properly set up
3. Seeds the database with initial data in development mode

```typescript
// Example of database initialization
export async function initializeDatabase(): Promise<boolean> {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Verify database schema
    try {
      await prisma.admin.findFirst();
    } catch (error) {
      if (error.message?.includes('does not exist')) {
        return false;
      }
      throw error;
    }
    
    // Seed the database if in development mode
    if (env.isDevelopment) {
      await seedDatabase();
    }
    
    return true;
  } catch (error) {
    return false;
  }
}
```

## Migrations

Database migrations are managed through Prisma Migrate. The following scripts are available:

- `npm run migrate`: Run pending migrations
- `npm run migrate:deploy`: Deploy migrations in production
- `npm run migrate:create`: Create a new migration
- `npm run migrate:reset`: Reset the database and apply all migrations

To create a new migration:

1. Update the schema in `prisma/schema.prisma`
2. Run `npm run migrate:create`
3. Enter a descriptive name for the migration
4. Review the generated SQL in `prisma/migrations`
5. Apply the migration with `npm run migrate`

## Seeding

Database seeding is handled in `scripts/seed.ts`. It populates the database with initial data, such as:

- Default admin user
- Sample companies
- Departments and positions
- Other necessary data for development

To seed the database:

```bash
npm run db:seed
```

## API Endpoints

The database integration exposes the following API endpoints:

### Health Check

```
GET /api/db/health
```

Returns the health status of the database connection.

### Statistics

```
GET /api/db/stats
```

Returns statistics about the database, including:
- List of tables
- Row counts
- Table sizes
- Last updated timestamps

### Version

```
GET /api/db/version
```

Returns the version of the PostgreSQL database.

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check that the database URL is correct
   - Verify that the database server is running
   - Ensure firewall rules allow connections

2. **Schema Errors**
   - Run `npm run migrate` to apply pending migrations
   - Check for errors in the migration logs

3. **Browser Errors**
   - The browser cannot directly access the database
   - API calls should be used instead

### Debugging

To check the database connection:

```bash
npm run db:check
```

This will run a script that tests the database connection and lists all tables.

## Best Practices

1. **Never store sensitive data in code**
   - Use environment variables for connection strings
   - Keep credentials out of version control

2. **Use transactions for related operations**
   - Wrap related database operations in transactions
   - This ensures data consistency

3. **Handle BigInt serialization**
   - PostgreSQL bigint values need special handling in JSON
   - Use the safeStringify helper function

4. **Optimize queries for performance**
   - Use indexes for frequently queried fields
   - Limit the amount of data returned

5. **Properly close connections**
   - Always disconnect from the database when done
   - Use try/finally blocks to ensure disconnection 
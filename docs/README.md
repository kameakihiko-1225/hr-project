# Aurora HRMS Portal Documentation

This directory contains documentation for the Aurora HRMS Portal.

## Contents

- [File Upload Implementation](./file-upload.md)
- [Company Page Implementation](./company-page.md)
- [Authentication Implementation](./authentication.md)
- [Database Implementation](./database.md)
- [Implementation Progress and Next Steps](./next-steps.md)

## Overview

Aurora HRMS Portal is a comprehensive human resources management system designed for modern businesses. The system provides tools for managing companies, departments, positions, and candidates.

## Architecture

The application follows a modern web architecture:

- **Frontend**: React with TypeScript, using Shadcn UI components and Tailwind CSS
- **Backend**: API routes implemented with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: Supabase Storage for file uploads
- **Authentication**: Supabase Auth with JWT for API authorization

## Development

To start development:

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables (see `.env.example`)
4. Set up the database (see [Database Documentation](./database.md))
5. Start the development server with `npm run dev`

## Database Setup

To set up the database:

1. Install PostgreSQL locally or use a cloud provider
2. Create a new database for the application
3. Update the `DATABASE_URL` in your `.env` file
4. Run migrations: `npm run migrate:deploy`
5. Seed the database: `npm run db:seed`

For more details, see the [Database Documentation](./database.md).

## Contributing

When contributing to the project, please follow these guidelines:

1. Create a feature branch from `main`
2. Follow the coding standards and patterns established in the project
3. Add appropriate documentation for new features
4. Submit a pull request for review

## Documentation Guidelines

When adding new documentation:

1. Create a markdown file with a descriptive name
2. Include an overview section explaining the feature
3. Document implementation details, usage examples, and future improvements
4. Add a link to the new documentation in this README file 
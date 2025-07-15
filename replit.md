# Millat Umidi HR Platform

## Overview

This is a full-stack HR platform for Millat Umidi, Uzbekistan's growing education company. The application provides a comprehensive system for managing job positions, candidates, and hiring processes through both a public-facing career site and an administrative dashboard.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state, React Context for authentication
- **Routing**: React Router with protected routes for admin areas
- **Internationalization**: i18next for multi-language support (English, Russian, Uzbek)

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: JWT-based with bcrypt for password hashing
- **Session Management**: PostgreSQL session store with connect-pg-simple

### Build System
- **Frontend**: Vite for development and building
- **Backend**: ESBuild for production bundling
- **TypeScript**: Shared configuration across client and server
- **Development**: Hot reload with Vite middleware integration

## Key Components

### Database Schema (Drizzle)
- **Users table**: Basic user authentication with username/password
- **Companies**: Company profiles with logos and metadata
- **Departments**: Organizational structure within companies
- **Positions**: Job postings with detailed requirements
- **Candidates**: Job applicants with application tracking
- **File Storage**: Document and image management
- **Message Queue**: Automated communication system

### Authentication System
- JWT token-based authentication
- Role-based access control (admin/super admin)
- Protected routes for administrative functions
- Session persistence with PostgreSQL

### Admin Dashboard
- Company management with logo upload
- Department and position administration
- Candidate tracking and management
- SMS campaign management
- AI-powered recruitment tools
- File upload and storage system

### Public Career Site
- Multi-language job browsing
- Advanced filtering by company/department/position
- Mobile-responsive design
- Direct application through Telegram integration

## Data Flow

### Authentication Flow
1. User login via email/password
2. JWT token generation and storage
3. Token validation on protected routes
4. Context-based authentication state management

### Job Application Flow
1. Public job browsing with filters
2. Application submission (Telegram integration)
3. Candidate tracking in admin dashboard
4. Automated follow-up via SMS/messaging

### Content Management Flow
1. Admin creates companies/departments/positions
2. File uploads processed and stored
3. Content displayed on public site
4. Real-time updates via React Query

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm with drizzle-kit for migrations
- **UI**: Comprehensive Radix UI component library
- **Authentication**: JWT handling with custom implementation
- **File Upload**: Custom file validation and storage
- **Internationalization**: i18next with browser language detection

### AI Integration
- OpenAI API integration for chat completion and embeddings
- AI-powered candidate screening and communication
- Automated response generation

### Development Tools
- Replit integration with cartographer and error overlay
- Comprehensive TypeScript configuration
- ESLint and Prettier for code quality

## Deployment Strategy

### Development Environment
- Vite dev server with Express API integration
- Hot module replacement for rapid development
- Mock data fallbacks for offline development
- Environment variable configuration

### Production Build
- Vite builds frontend to `dist/public`
- ESBuild bundles backend to `dist/index.js`
- Static file serving through Express
- Database migrations via Drizzle

### Environment Configuration
- Database URL for PostgreSQL connection
- JWT secret configuration for authentication
- OpenAI API key for AI features
- Optional Redis URL for caching
- Webhook base URL for external integrations

### Architectural Decisions

**Database Choice**: PostgreSQL with Drizzle ORM was chosen for type safety, performance, and serverless compatibility with Neon Database.

**Frontend Framework**: React with TypeScript provides strong typing and component reusability, while Shadcn/ui ensures consistent design system implementation.

**Authentication Strategy**: JWT tokens with server-side validation balance security with stateless scalability requirements.

**File Storage**: Custom file upload system with validation provides flexibility for future cloud storage integration.

**Internationalization**: i18next supports the multi-language requirements for Uzbekistan's diverse linguistic landscape.

## Recent Changes: Latest modifications with dates

### July 15, 2025 - PostgreSQL File Storage Implementation
- **File Storage System**: Implemented comprehensive PostgreSQL-based file storage using multer middleware
- **File Upload Endpoints**: Created `/api/upload` for general file uploads and `/api/companies/:id/logo` for company-specific uploads
- **Database Schema**: Added `file_attachments` table to track uploaded files with metadata (entity_type, entity_id, filename, filepath, etc.)
- **Gallery Integration**: Updated gallery creation and editing to use permanent file uploads with proper PostgreSQL metadata tracking
- **Company Logo Upload**: Enhanced company CRUD operations to support file uploads with 50MB size limit and automatic file association
- **File Serving**: Added static file serving at `/uploads` route for accessing uploaded files
- **Permanent Storage**: Eliminated temporary upload approach - all files now use permanent storage with PostgreSQL metadata tracking
- **Error Handling**: Added comprehensive error handling and logging for file upload operations

The architecture emphasizes type safety, developer experience, and scalability while maintaining simplicity for rapid development and deployment.
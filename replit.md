# Millat Umidi HR Platform

## Overview

This is a full-stack HR platform for Millat Umidi, Uzbekistan's growing education company. The application provides a comprehensive system for managing job positions, candidates, and hiring processes through both a public-facing career site and an administrative dashboard.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### July 15, 2025 - Founder Section & Beige Neon Theme
- **Added Founder Section**: Created dedicated section after hero featuring Umidjon Ishmukhamedov
  - Professional photo display with proper object-top positioning to show full face
  - Inspirational message about education transformation mission
  - Call-to-action button with smooth scroll to positions section
  - Achievement stats and company branding
- **Implemented Beige Neon Theme**: Added beige color (#b89c83) neon effects throughout
  - Created custom CSS classes: neon-beige, neon-beige-text, hover-neon-beige, hover-neon-beige-text
  - Applied neon effects to position cards, buttons, icons, and text elements
  - Enhanced hover interactions with beige glow effects and smooth transitions
  - Updated primary color scheme to use beige accents (2-3% usage as requested)
- **Fixed Logo Upload System**: Resolved database storage issues
  - Logo uploads now properly save logoUrl to company records
  - Fixed JSON vs FormData handling in upload endpoints
- **Enhanced Industry Tags**: Converted from mock to real API endpoints
  - Added proper POST/GET endpoints for industry tag management
  - Removed all mock data dependencies from client-side code

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

The architecture emphasizes type safety, developer experience, and scalability while maintaining simplicity for rapid development and deployment.
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

### July 15, 2025 - Gallery to Blog Renaming & Modal Debugging
- **Gallery to Blog Conversion**: Renamed all "Gallery" references to "Blog" throughout the application including file names, routes, components, and UI text
- **File Renaming**: Moved Gallery.tsx to Blog.tsx and AdminGallery.tsx to AdminBlog.tsx with updated component names and imports
- **Route Updates**: Changed /gallery route to /blog, /admin/gallery to /admin/blog in App.tsx, Header.tsx, and Footer.tsx
- **Modal Button Functionality**: Fixed position card Company and Department info buttons - they now trigger modal state correctly
- **Search Params Fix**: Resolved admin positions page error by removing undefined setSearchParams usage
- **Admin Interface**: Updated all admin blog interface text from "Gallery" to "Blog" while maintaining backend API compatibility
- **Content Updates**: Changed blog page description to focus on "stories and insights" rather than visual journey

### July 15, 2025 - PostgreSQL File Storage Implementation
- **File Storage System**: Implemented comprehensive PostgreSQL-based file storage using multer middleware
- **File Upload Endpoints**: Created `/api/upload` for general file uploads and `/api/companies/:id/logo` for company-specific uploads
- **Database Schema**: Added `file_attachments` table to track uploaded files with metadata (entity_type, entity_id, filename, filepath, etc.)
- **Gallery Integration**: Updated gallery creation and editing to use permanent file uploads with proper PostgreSQL metadata tracking
- **Company Logo Upload**: Enhanced company CRUD operations to support file uploads with 50MB size limit and automatic file association
- **File Serving**: Added static file serving at `/uploads` route for accessing uploaded files
- **Permanent Storage**: Eliminated temporary upload approach - all files now use permanent storage with PostgreSQL metadata tracking
- **Error Handling**: Added comprehensive error handling and logging for file upload operations

### July 15, 2025 - Industry Tags System & Position Card Enhancements
- **Industry Tags System**: Implemented persistent industry tags database storage with industryTags table
- **Industry Tags CRUD**: Added complete CRUD operations for industry tags in DatabaseStorage and routes
- **Position Card Modals**: Created CompanyInfoModal and DepartmentInfoModal components for detailed company/department information
- **Position Card Buttons**: Added "Info" buttons to position cards for accessing company and department details
- **Default Industry Tags**: Added initialization script with 15 predefined industry tags including "Private University"
- **Database Integration**: Fixed all database operations to use Drizzle ORM instead of raw SQL queries
- **Modal Integration**: Position cards now display comprehensive company logos, industry tags, descriptions, and location data

### July 15, 2025 - Company-Industry Tags Association System
- **Junction Table**: Created company_industry_tags table for many-to-many relationship between companies and industry tags
- **Database Schema**: Added CompanyIndustryTag type and extended Company type with CompanyWithIndustries for API responses
- **Storage Methods**: Implemented getCompanyIndustryTags, setCompanyIndustryTags, addCompanyIndustryTag, and removeCompanyIndustryTag
- **API Integration**: Added PUT /api/companies/:id/industry-tags and GET /api/companies/:id/industry-tags endpoints
- **Company CRUD**: Updated company creation and update routes to handle industry tags association during create/update operations
- **Frontend Integration**: Company creation and editing now properly saves selected industry tags to database
- **Auto-Loading**: Company lists now automatically include associated industry tags for display in UI components

### July 15, 2025 - Admin Position Cards & Data Inheritance System
- **AdminPositionCard Component**: Created separate AdminPositionCard component for admin interface without "Apply Now" button
- **Data Inheritance Logic**: Implemented comprehensive inheritance system where positions inherit missing data from departments and companies
- **Admin Interface**: Updated admin positions page to use AdminPositionCard instead of regular PositionCard
- **Blog Navigation Fix**: Fixed AdminLayout navigation to properly link to /admin/blog instead of /admin/gallery
- **Inheritance Chain**: Position -> Department -> Company for logo, location, description, and other fields
- **Modal Integration**: AdminPositionCard maintains company/department info modals with proper data inheritance

### July 15, 2025 - Apply Now Button Cache Fix & React Query Migration
- **Apply Now Button Issue**: Fixed critical caching issue where Apply Now button redirected to old link instead of updated one
- **React Query Migration**: Converted OpenPositions component from manual useEffect/useState to React Query for proper cache management
- **Cache Optimization**: Set shorter cache times (30 seconds) for positions to ensure fresh apply links on public site
- **Debug Logging**: Added position apply link logging to track data freshness and cache updates
- **Data Synchronization**: Fixed disconnection between admin updates and public site display through proper cache invalidation

### July 15, 2025 - Unified Hover Effects & Mobile Responsiveness Enhancement
- **Consistent Hover Effects**: Applied FeaturesSection hover effects (hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-1) across all cards and buttons
- **Position Card Improvements**: Increased position card height to 480px and enhanced Apply Now button height (py-4 instead of py-3)
- **Mobile Responsiveness**: Implemented icon-only views for smaller screens - buttons show only icons on mobile, full text on larger screens
- **Button Updates**: Enhanced "See Open Roles", "Explore Career Opportunities", "Join us and grow", and all position card buttons with consistent hover effects
- **StatsSection Enhancement**: Updated all stat cards with unified hover animations and blue shadow effects
- **Telegram Service Testing**: Successfully tested simplified Telegram webhook service with fake data - service responding correctly on port 3001
- **Cross-Device Compatibility**: Ensured robust compatibility across laptop, tablet, and phone resolutions with responsive design patterns

### July 16, 2025 - Deployment Build Fix & Asset Path Resolution
- **Critical Import Fix**: Resolved deployment failure by fixing missing authService import in client/src/lib/dbInit.ts
  - Changed from non-existent `@/api/auth/authService` to correct `./auth` path
  - Verified authService export exists in client/src/lib/auth.ts
- **Asset Path Updates**: Fixed problematic image paths containing spaces and timestamps
  - Updated "/2025-07-14 1.05.36 PM.jpg" references to "/logo png.png" in AdminLayout and ContactSection
  - Replaced broken @assets import in FounderSection with public directory reference
  - Ensured all logo references point to existing files in client/public directory
- **Build Process**: Eliminated "Could not load /home/runner/workspace/client/src/api/auth/authService" error
  - Build now progresses through transformation phase without import resolution failures
  - All critical file paths and imports properly resolved for production deployment

### July 16, 2025 - Complete Telegram Webhook & Bitrix24 Integration with Field Mapping
- **Webhook Service Fix**: Resolved service execution issue - switched from TypeScript stub to complete JavaScript implementation with full Bitrix24 integration
- **Field Mapping Updates**: Updated all Bitrix24 field mappings according to user specifications:
  - Resume links: `UF_CRM_1752621810`
  - Diploma links: `UF_CRM_1752621831` 
  - Age field: `UF_CRM_1752622669492`
  - Phase2 voice answers: `UF_CRM_1752621857` (Q1), `UF_CRM_1752621874` (Q2), `UF_CRM_1752621887` (Q3)
  - Phase2 text answers: `UF_CRM_1752241370` (Q1), `UF_CRM_1752241378` (Q2), `UF_CRM_1752241386` (Q3)
- **Smart Answer Processing**: Implemented intelligent detection for phase2 questions - voice file IDs use voice fields, text answers and failed file retrievals use text fields
- **File ID Detection**: Enhanced Telegram file ID validation to exclude text with spaces and improve accuracy
- **Phone Number Integration Fix**: Resolved critical phone field issue by implementing proper Bitrix24 crm_multifield format during initial contact creation
  - Phone field format: `[{"VALUE": "+998111222333", "VALUE_TYPE": "MOBILE"}]` with E.164 international format
  - Direct integration in contact creation payload (not separate update)
  - Proper FormData handling for array-based phone field structure
  - Added phone verification and manual addition if missing after contact creation
- **Applicant Tracking System**: Implemented comprehensive applicant tracking that connects Apply Now button clicks to Hero section statistics
  - Created position click tracking with 'view' and 'apply' types
  - Added API endpoints for dashboard click stats and position applicant counts
  - Updated Hero section to display real applicant data from database instead of mock data
  - Hero section now shows actual Apply Now button click counts matching Job Seekers data
- **Favicon Update**: Updated website favicon to use Millat Umidi logo ("logo png.png") with proper Apple touch icon support
- **Webhook URL**: Finalized webhook endpoint at domain.com/webhook with proxy forwarding to port 3001 (no port numbers needed in webhook configuration)
- **Complete Integration**: Successfully tested end-to-end candidate data flow from Telegram bot to Bitrix24 CRM with proper field mapping, file handling, and phone number display

The architecture emphasizes type safety, developer experience, and scalability while maintaining simplicity for rapid development and deployment.
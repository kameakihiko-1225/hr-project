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

### July 16, 2025 - Production Deployment Fix & Read-Only Property Error Resolution
- **Critical Production Error Fix**: Resolved "Cannot assign to read only property 'undefined' of object '#<Window>'" error
  - Removed problematic assignments to `import.meta.env` properties in setupEnv.ts which are read-only in production builds
  - Eliminated all direct modifications to import.meta.env that were causing deployment failures
  - Environment variable management now properly handled through env.ts with fallbacks instead of direct assignments
- **Build Process Optimization**: Fixed production build hanging issues
  - Identified large Lucide React icon imports causing build timeouts
  - Streamlined environment setup to prevent read-only property conflicts
  - Ensured production builds can complete successfully without timeout errors

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

### July 16, 2025 - Comprehensive Website Localization Implementation - COMPLETED ✓
- **Full Internationalization System**: Successfully implemented complete i18next-based localization supporting English, Russian, and Uzbek languages
- **Translation Coverage**: Added 130+ translation keys covering all user interface elements:
  - Hero section with dynamic content and call-to-action buttons
  - Features section with service descriptions and navigation (6 feature cards fully translated)
  - Statistics section with platform metrics and interactive elements (4 stats cards fully translated)
  - Footer with company information, contact details, and copyright
  - Contact section with form labels and company description
  - Admin dashboard headers and welcome messages
  - CTA/Testimonials section with titles and descriptions
  - Filter section with labels, placeholders, and search options
  - Position cards with all field labels and action buttons
- **Component Translation Updates**: Modified all major React components to use useTranslation hook:
  - CTASection: Testimonials title and subtitle with proper translation keys
  - FilterSection: Complete filter labels and placeholders for companies, departments, positions
  - StatsSection: All stat card labels and descriptions with dynamic content integration
  - FeaturesSection: All 6 feature cards with titles and descriptions
  - PositionCard: Field labels, buttons, and modal content
  - OpenPositions: "Available Positions" and related text elements
- **Language Selector**: Added dropdown language switcher in header with flag icons and proper language names
- **Proper Noun Preservation**: Successfully maintained Millat Umidi brand names and founder information as requested
- **Responsive Design**: Ensured translation system works across desktop, tablet, and mobile views
- **Browser Persistence**: Language selection automatically saved to localStorage for consistent user experience
- **Dynamic Content**: Real-time language switching without page reload for optimal user experience
- **Critical Fixes**: Resolved JSON syntax errors and missing translation keys for complete functionality
- **User Verification**: Screenshots confirm successful multi-language operation across all website sections

### July 16, 2025 - Updated Uzbek Translation Content & Enhanced CTASection Translation Support
- **Enhanced CTASection Translation**: Implemented complete translation support for all testimonials in CTASection component
  - Updated component to use translation keys instead of hardcoded quotes for all 7 testimonials
  - Added missing cta.testimonials.title and cta.testimonials.subtitle translation keys across all language files
  - All testimonials now properly translate between English, Russian, and Uzbek languages
- **Improved Header Navigation**: Enhanced visual appearance and spacing of header navigation buttons
  - Increased button spacing from space-x-6 to space-x-8 for better visual separation
  - Added consistent hover effects with shadow and transform animations (hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-1)
  - Enhanced button padding (px-4 py-2) and applied unified styling to navigation links
  - Improved language selector spacing (ml-6) for better visual balance
- **Updated Uzbek Translations**: Replaced uz.json with improved Uzbek translation content as per user specifications
  - Preserved specific requirement: "title_start": "Bizga qo'shiling" in hero section
  - Updated all translation keys with more accurate and natural Uzbek language content
  - Maintained proper noun preservation for "Millat Umidi Group" and related brand names
  - Enhanced testimonials translation data with authentic Uzbek quotes from team members

### July 16, 2025 - Real Database Integration & View More/Less Functionality Implementation - COMPLETED ✓
- **Real Data Integration**: Successfully migrated from demo data to actual `position_clicks` database queries
  - Updated storage methods to use real Drizzle ORM queries counting `click_type: 'apply'` entries
  - Implemented proper JOIN operations between `position_clicks` and `positions` tables
  - Added required imports: `eq`, `desc`, `count` from drizzle-orm for database operations
  - Verified live data functionality showing actual HR Generalist position with 24 apply clicks
- **API Endpoint Updates**: Modified backend APIs to return real application data
  - `/api/top-applied-positions`: Returns actual top 3 positions ordered by apply click count
  - `/api/all-applied-positions`: Returns complete list without pagination for frontend control
  - Removed pagination from backend; frontend now handles "View More/Less" display logic
- **Frontend View More/Less Implementation**: Complete interactive functionality for All Applied Positions Listing
  - Initially displays first 4 positions from full dataset
  - "View More Positions" button expands to show complete list when more than 4 positions exist
  - "View Less Positions" button collapses back to initial 4-item view
  - State management tracks `showAll` boolean and manages `displayedPositions` array accordingly
- **Enhanced Localization**: Added "view_less" translation keys across all languages
  - English: "View Less Positions"
  - Russian: "Показать меньше позиций"  
  - Uzbek: "Kamroq lavozimlarni ko'rish"
- **Database Verification**: Confirmed real click tracking data integration
  - Position ID 7 (HR Generalist) shows 24 actual apply clicks from database
  - No mock data remaining; all counters use live `position_clicks` table queries
  - APIs returning accurate position titles and click counts from database relationships

### July 16, 2025 - Position Card Layout Optimization & Button Visibility Fix - COMPLETED ✓
- **Card Dimensions Optimization**: Adjusted position card sizing for better button visibility
  - Maintained compact height at 440px as requested by user
  - Increased card width from 380px to 460px to accommodate all buttons without cutoff
  - Applied consistent dimensions to both public PositionCard and AdminPositionCard components
- **Button Layout Improvements**: Optimized button spacing and layout for better fit
  - Reduced button gaps from gap-2 to gap-1 for more efficient space utilization
  - Added min-w-0 and truncate classes to prevent text overflow issues
  - Made icons flex-shrink-0 to prevent icon compression under space constraints
  - Changed text visibility from sm:inline to lg:inline for better space management
- **Grid Layout Enhancement**: Updated OpenPositions component grid configuration
  - Removed 2xl:grid-cols-4 to maintain maximum 3 cards per row on all screen sizes
  - Updated grid layout to xl:grid-cols-3 ensuring exactly 3 cards per row on large screens
  - Increased card wrapper max-width from 380px to 460px to match card dimensions
- **Filter Dropdown Optimization**: Improved MultiSelect component for better user experience
  - Reduced dropdown header padding and font size to prevent text overlap
  - Compressed dropdown option padding from py-3 to py-2 for more compact display
  - Decreased dropdown max-height from 240px to 192px to prevent content overlap
- **Cross-Component Consistency**: Ensured uniform button behavior across all position cards
  - Applied same hover effects and styling to all card buttons
  - Maintained consistent button heights and spacing throughout the interface
  - Verified proper button visibility on all screen sizes from mobile to desktop

### July 16, 2025 - Multilingual CRUD Forms Fix & Department Position Counter Fix - COMPLETED ✓
- **Position Form Cleanup**: Removed duplicate legacy form fields that were showing "[object Object]"
  - Eliminated old position title, description, salary range, and apply link input fields
  - Kept only the new MultilingualInput components for proper localization support
  - Fixed form initialization to properly handle LocalizedContent objects vs string values
  - Employment type field correctly remains as string dropdown (no localization needed)
- **Department Position Counter Fix**: Resolved issue where department cards showed 0 positions instead of actual count
  - Updated positions page getDepartments() call to include `includePositions: true` parameter
  - Backend API was returning correct count (6 positions) but frontend wasn't requesting it
  - Department cards now properly display actual position counts from database
- **Form Data Structure**: Corrected multilingual form data handling across all CRUD operations
  - Position forms now properly use LocalizedContent objects for title, description, salary range, apply link
  - Department forms already using MultilingualInput components correctly
  - Company forms already using MultilingualInput components correctly
  - All forms now display proper language tabs (English, Russian, Uzbek) without "[object Object]" errors

### July 16, 2025 - Complete Localization Implementation Across All Card Components - COMPLETED ✓
- **AdminPositionCard Localization**: Added comprehensive localization support to admin position cards
  - Added useTranslation hook and getLocalizedContent helper function
  - Position title, description, salary range, and inherited company/department names now properly localized
  - Fixed inheritance logic to use getLocalizedContent for all LocalizedContent objects
  - All modal dialogs and confirmation messages now display localized content
- **PositionCard Localization**: Updated public position cards with full localization support
  - Position title, description, salary range, and department names in position.departments array now localized
  - Inherited company and department data properly displays localized content
  - Delete confirmation dialogs and detail modals show localized position titles
  - Apply link and all position information displays correctly in selected language
- **DepartmentCard Localization**: Enhanced department cards with complete localization
  - Department name and description fields now use getLocalizedContent helper
  - Company names in department cards properly display localized content
  - Modal dialogs and delete confirmations show localized department names
  - All card displays and interactions respect current language selection
- **Admin Pages Helper Functions**: Added getLocalizedContent helper functions to admin pages
  - Departments admin page now has proper localization support for toast messages and displays
  - All admin interfaces consistently handle LocalizedContent objects without "[object Object]" errors
  - Complete end-to-end localization from CRUD forms to display components

The architecture emphasizes type safety, developer experience, and scalability while maintaining simplicity for rapid development and deployment.
# Millat Umidi HR Platform

## Overview
This is a full-stack HR platform for Millat Umidi, an education company in Uzbekistan. The application provides a comprehensive system for managing job positions, candidates, and hiring processes through a public-facing career site and an administrative dashboard. Its main purpose is to streamline HR operations and facilitate recruitment.

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

### UI/UX Decisions
- Consistent design system using Shadcn/ui.
- Responsive design for optimal viewing across all devices (mobile, tablet, desktop).
- Multilingual support for all content and UI elements.
- Optimized image and asset loading for performance.

### Technical Implementations
- **Authentication**: JWT token-based authentication with role-based access control.
- **Data Inheritance**: Positions inherit missing data from departments and companies.
- **File Storage**: PostgreSQL-based file storage using multer middleware for permanent storage of resumes, diplomas, and voice answers.
- **Localization**: Comprehensive i18next-based system for all UI and dynamic content with fallback logic.
- **Performance Optimization**: Batch API endpoints, database query optimizations, HTTP compression, and React Query for client-side caching.
- **Search Engine Optimization (SEO)**: Advanced structured data (JobBoard, Organization, FAQ schemas), dynamic sitemaps, Open Graph, Twitter Cards, and Core Web Vitals optimization for Central Asian markets.

### Feature Specifications
- **Admin Dashboard**: Company, department, position, candidate, and blog management; SMS campaign management; AI-powered recruitment tools; file upload system.
- **Public Career Site**: Multi-language job browsing with advanced filtering, direct application via Telegram integration, and detailed position views.
- **Applicant Tracking**: Position click tracking and application count synchronization with hero section statistics.

### System Design Choices
- **Database**: PostgreSQL with Drizzle ORM for type safety, performance, and serverless compatibility.
- **Frontend**: React with TypeScript for strong typing and component reusability.
- **Authentication**: JWT tokens for stateless scalability and security.
- **File Storage**: Custom system for flexibility and future cloud integration.
- **Internationalization**: i18next for diverse linguistic needs in Uzbekistan.

## External Dependencies

- **Database**: @neondatabase/serverless
- **ORM**: drizzle-orm with drizzle-kit
- **UI**: Radix UI (via Shadcn/ui)
- **Internationalization**: i18next
- **AI Integration**: OpenAI API (for chat completion, embeddings, candidate screening)
- **Messaging**: Telegram Bot API (for application submission, file handling, and webhook integration)
- **CRM Integration**: Bitrix24 API (for contact and deal creation, custom field population)
- **Development Tools**: Replit integration (cartographer, error overlay), ESLint, Prettier
```
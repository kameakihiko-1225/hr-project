# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/0ac01a46-6e50-4beb-8d26-bdf868570d56

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/0ac01a46-6e50-4beb-8d26-bdf868570d56) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start both the Express server and development server with a single command.
npm run start
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Prisma ORM
- Express.js
- PostgreSQL (Neon)
- JWT Authentication

## Features

### Authentication System

The application includes a robust authentication system:

- **User Authentication**: Secure login with email and password
- **Session Management**: Persistent sessions across page reloads
- **Protected Routes**: Route-based access control
- **Role-Based Access**: Different permissions for admins and super admins
- **API Authorization**: JWT-based API access control
- **Custom Authentication**: Self-contained authentication system using JWT and bcrypt

For more details, see [Authentication Documentation](./docs/authentication.md) and [Express Server Documentation](./docs/express-server.md).

### Database Integration

The application includes a comprehensive database integration:

- **PostgreSQL Database**: Robust relational database for data storage
- **Prisma ORM**: Type-safe database access with automatic migrations
- **Database Models**: Well-structured data models for all entities
- **Migration System**: Versioned database schema changes
- **Seeding**: Automatic database seeding for development
- **Connection Management**: Efficient connection pooling and error handling

For more details, see [Database Documentation](./docs/database.md).

### Company Management

The application includes a comprehensive company management system:

- **Company List**: View, filter, and sort companies
- **Company Creation**: Add new companies with details
- **Company Editing**: Update existing company information
- **Company Deletion**: Remove companies with confirmation
- **Logo Management**: Upload and manage company logos

For more details, see [Company Page Documentation](./docs/company-page.md).

### File Upload System

The application includes a robust file upload system:

- **Client-side Validation**: Type and size validation
- **Image Resizing**: Automatic resizing for optimal storage and display
- **Database Storage**: Files stored directly in the PostgreSQL database
- **Preview Management**: Local previews with proper cleanup
- **Error Handling**: Comprehensive error handling and reporting

For more details, see [File Upload Documentation](./docs/file-upload.md).

### Telegram Bot Integration

The application includes a powerful Telegram bot integration for HR automation:

- **Personalized Bots**: Each admin can create and manage their own Telegram bot
- **Multilingual Support**: Bots communicate in English, Russian, and Uzbek
- **Structured Interviews**: Pre-defined interview flow with customizable questions
- **Candidate Management**: View and manage candidates interviewed by the bot
- **Position-Specific Questions**: Tailor questions based on the position
- **Data Collection**: Automatically collect and store candidate information

For more details, see [Telegram Bot Documentation](./docs/telegram-bot.md).

### AI Interview Pipeline

The application features a sophisticated AI-powered interview system:

- **Train Once – Use Many**: AI generates position-specific questions during document training
- **Pre-Generated Questions**: Questions are stored with positions and reused across interviews
- **Voice & Text Support**: Candidates can respond via text or voice messages
- **Privacy-First Design**: No candidate answers are stored in the database
- **Streaming to GPT**: Answers are sent to GPT in real-time without storage
- **Comprehensive Summaries**: Only the final AI-generated assessment is stored

For more details, see [AI Interview Pipeline Documentation](./docs/ai-interview-pipeline.md).

## Express Server

The application uses an Express.js server to handle API requests:

- **Authentication**: JWT-based authentication system
- **API Endpoints**: RESTful API endpoints for all resources
- **Database Access**: Direct access to the PostgreSQL database via Prisma
- **File Handling**: File upload and retrieval from the database
- **Error Handling**: Comprehensive error handling and logging

For more details, see [Express Server Documentation](./docs/express-server.md).

## Development Mode Features

### Mock Authentication

For development without setting up authentication:

- **Default Admin Credentials**: Email: admin@example.com / Password: password
- **Automatic Setup**: Enabled by default in development mode
- **Visual Indicators**: Notices on login page and admin dashboard
- **Configuration**: Control via environment variables

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/0ac01a46-6e50-4beb-8d26-bdf868570d56) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Database Setup

To set up the database for this project:

1. Install PostgreSQL locally or use a cloud provider (like Neon)
2. Create a new database for the application
3. Copy `.env.example` to `.env` and update the database URL
4. Run migrations: `npm run migrate:deploy`
5. Seed the database: `npm run db:seed`
6. Add sample data: `node scripts/seed-sample-data.js`

For more detailed instructions, see [Database Documentation](./docs/database.md).

## Logging System

The application includes a comprehensive logging system to help with debugging and monitoring:

### Logger Features

- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Contextual Logging**: Each module has its own logger with context
- **Colorized Output**: Different colors for different log levels
- **Timestamps**: All logs include ISO timestamps
- **Error Details**: Error logs include stack traces

### Key Logging Components

- `src/lib/logger.ts` - Core logging utility
- `src/api/middleware/loggingMiddleware.ts` - Request logging middleware
- `src/api/middleware/errorMiddleware.ts` - Error handling middleware

### Logging in Services

All services include comprehensive logging:

- **Authentication**: Login attempts, successes, failures
- **Database**: Connection events, query execution
- **API**: Request/response details, execution times
- **JWT**: Token generation, verification

### Example Usage

```typescript
import { createLogger } from '@/lib/logger';

// Create a logger with context
const logger = createLogger('myComponent');

// Log at different levels
logger.debug('Detailed information for debugging');
logger.info('General information about application progress');
logger.warn('Warning that might need attention');
logger.error('Error that occurred', new Error('Something went wrong'));
```

## Code Maintenance

### Refactoring Tools

The project includes several tools to help maintain code quality and reduce duplication:

1. **Duplicate Code Analyzer**
   ```bash
   node scripts/refactor-duplicates.js
   ```
   This script analyzes the codebase for duplicate code and generates a report at `docs/code-duplication-report.md`.

2. **Refactoring Implementation**
   ```bash
   node scripts/refactor-implement.js
   ```
   This script implements the refactoring changes identified in the code-refactoring-plan.md document. It updates imports and removes duplicate files.

3. **Unused Component Finder**
   ```bash
   node scripts/find-unused-components.js
   ```
   This script identifies potentially unused components in the project and generates a report at `docs/unused-components-report.md`.

### Best Practices

To maintain code quality and prevent duplication:

1. **Centralize Utilities**: Keep utility functions in dedicated files and import them where needed
2. **Follow DRY Principle**: Don't Repeat Yourself - extract common code into reusable functions
3. **Use TypeScript**: Prefer TypeScript over JavaScript for better type safety and tooling
4. **Document Code**: Add JSDoc comments to explain the purpose of functions and classes
5. **Regular Refactoring**: Schedule regular refactoring sessions to clean up the codebase

For more details on the refactoring process, see `docs/code-refactoring-plan.md`.

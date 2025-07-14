import { createLogger } from './logger';
import dotenv from 'dotenv';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Load environment variables from the .env file automatically in Node.js contexts (e.g., dev server, Jest)
if (!isBrowser) {
  dotenv.config();
}

// Create a logger for environment configuration
const logger = createLogger('env');

/**
 * Get environment variable with fallback
 */
function getEnv(key: string, fallback?: string): string | undefined {
  if (isBrowser) {
    // Browser environment (Vite)
    return (import.meta.env as any)[key] || fallback;
  } else {
    // Node.js environment
    return process.env[key] || fallback;
  }
}

/**
 * Environment variables with validation and logging
 */
class Environment {
  // Database URL
  get databaseUrl(): string {
    // In browser, we don't need the actual database URL
    if (isBrowser) {
      return 'browser-environment';
    }
    
    const url = getEnv('DATABASE_URL');
    if (!url) {
      logger.warn('DATABASE_URL is not set');
      return 'postgresql://user:password@localhost:5432/aurora_hrms?schema=public';
    }
    return url;
  }

  // Node environment
  get nodeEnv(): string {
    return getEnv('MODE') || getEnv('NODE_ENV') || 'development';
  }

  // Check if we're in development mode
  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  // Check if we're in production mode
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  // Check if we're in test mode
  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  // JWT secret key
  get jwtSecret(): string {
    const secret = getEnv('VITE_JWT_SECRET');
    if (!secret) {
      logger.warn('VITE_JWT_SECRET is not set, using default (unsafe for production)');
      return 'your-secret-key';
    }
    return secret;
  }

  // JWT expiration time
  get jwtExpiresIn(): string {
    return getEnv('VITE_JWT_EXPIRES_IN') || '7d';
  }

  // Supabase URL
  get supabaseUrl(): string {
    const url = getEnv('VITE_SUPABASE_URL');
    if (!url) {
      logger.warn('VITE_SUPABASE_URL is not set');
      return '';
    }
    return url;
  }

  // Supabase Anon Key
  get supabaseAnonKey(): string {
    const key = getEnv('VITE_SUPABASE_ANON_KEY');
    if (!key) {
      logger.warn('VITE_SUPABASE_ANON_KEY is not set');
      return '';
    }
    return key;
  }

  // API URL
  get apiUrl(): string {
    // Highest priority: explicitly provided VITE_API_URL
    const direct = getEnv('VITE_API_URL');
    if (direct) return direct;

    // Fallback: derive from VITE_APP_URL (append /api)
    const app = getEnv('VITE_APP_URL');
    if (app) {
      // Ensure no double slashes
      return app.replace(/\/$/, '') + '/api';
    }

    // Final fallback: relative path (works with Vite proxy in dev)
    logger.debug('VITE_API_URL and VITE_APP_URL are not set, using default "/api"');
    return '/api';
  }

  // Application base URL (optional)
  get appUrl(): string {
    return getEnv('VITE_APP_URL') || '';
  }

  // OpenAI API Key
  get openaiApiKey(): string {
    const key = getEnv('OPENAI_API_KEY') || getEnv('VITE_OPENAI_API_KEY');
    if (!key) {
      logger.warn('OPENAI_API_KEY is not set');
      return '';
    }
    return key;
  }

  // Use mock authentication
  get useMockAuth(): boolean {
    const useMock = getEnv('VITE_USE_MOCK_AUTH');
    return useMock === 'true';
  }

  // Log all environment variables (except sensitive ones)
  logEnvironment(): void {
    logger.info(`Environment: ${this.nodeEnv}`);
    
    // Only log database URL in non-browser environments
    if (!isBrowser) {
      logger.debug(`Database URL: ${this.databaseUrl.replace(/\/\/.*?@/, '//***:***@')}`);
    }
    
    logger.debug(`API URL: ${this.apiUrl}`);
    if (this.appUrl) logger.debug(`App URL: ${this.appUrl}`);
    logger.debug(`Supabase URL: ${this.supabaseUrl ? '(set)' : '(not set)'}`);
    logger.debug(`Supabase Anon Key: ${this.supabaseAnonKey ? '(set)' : '(not set)'}`);
    logger.debug(`JWT Secret: ${this.jwtSecret ? '(set)' : '(not set)'}`);
    logger.debug(`Using mock auth: ${this.useMockAuth ? 'Yes' : 'No'}`);
  }
}

// Export a singleton instance
export const env = new Environment();

// Log environment variables in development
if (env.isDevelopment) {
  env.logEnvironment();
}

export default env; 
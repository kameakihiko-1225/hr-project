import { createLogger } from './logger.js';
import dotenv from 'dotenv';

const isBrowser = typeof window !== 'undefined';
if (!isBrowser) dotenv.config();

const logger = createLogger('env');

function getEnv(key, fallback) {
  if (isBrowser) {
    return (import.meta.env || {})[key] || fallback;
  }
  return process.env[key] || fallback;
}

class Environment {
  get databaseUrl() {
    if (isBrowser) return 'browser-environment';
    const url = getEnv('DATABASE_URL');
    if (!url) {
      logger.warn('DATABASE_URL is not set');
      return 'postgresql://user:password@localhost:5432/aurora_hrms?schema=public';
    }
    return url;
  }
  get nodeEnv() {
    return getEnv('MODE') || getEnv('NODE_ENV') || 'development';
  }
  get isDevelopment() { return this.nodeEnv === 'development'; }
  get isProduction() { return this.nodeEnv === 'production'; }
  get isTest() { return this.nodeEnv === 'test'; }

  get jwtSecret() {
    const secret = getEnv('VITE_JWT_SECRET');
    if (!secret) logger.warn('VITE_JWT_SECRET is not set');
    return secret || 'your-secret-key';
  }
  get jwtExpiresIn() { return getEnv('VITE_JWT_EXPIRES_IN') || '7d'; }

  get supabaseUrl() { return getEnv('VITE_SUPABASE_URL') || ''; }
  get supabaseAnonKey() { return getEnv('VITE_SUPABASE_ANON_KEY') || ''; }
  get apiUrl() { return getEnv('VITE_API_URL') || '/api'; }

  get openaiApiKey() {
    const key = getEnv('OPENAI_API_KEY') || getEnv('VITE_OPENAI_API_KEY');
    if (!key) logger.warn('OPENAI_API_KEY is not set');
    return key || '';
  }

  get useMockAuth() { return getEnv('VITE_USE_MOCK_AUTH') === 'true'; }

  logEnvironment() {
    logger.info(`Environment: ${this.nodeEnv}`);
    if (!isBrowser) logger.debug(`Database URL: ${this.databaseUrl.replace(/\/\/.*?@/, '//***:***@')}`);
  }
}

export const env = new Environment();
if (env.isDevelopment) env.logEnvironment();
export default env; 
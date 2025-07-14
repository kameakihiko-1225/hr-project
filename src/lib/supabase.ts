import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import { createLogger } from './logger';

const logger = createLogger('supabase');

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Get Supabase URL and anon key from environment
const supabaseUrl = env.supabaseUrl;
const supabaseAnonKey = env.supabaseAnonKey;

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn('Supabase configuration is missing. Using mock client in browser environment.');
  
  if (!isBrowser) {
    // Only show error in server environment
    logger.error('Supabase configuration is missing. Please check your environment variables.');
  }
}

// Create Supabase client
let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
  // Create a minimal mock client if configuration is missing
  logger.debug('Creating mock Supabase client');
  
  // Create a minimal mock client
  supabase = {
    auth: {
      signInWithPassword: () => Promise.resolve({ data: {}, error: { message: 'Authentication service not configured' } }),
      signUp: () => Promise.resolve({ data: {}, error: { message: 'Authentication service not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: null }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: {}, error: { message: 'Storage service not configured' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    }
  };
} else {
  // Create real Supabase client
  logger.debug('Creating real Supabase client');
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

logger.debug('Supabase client initialized');

export { supabase };
export default supabase; 
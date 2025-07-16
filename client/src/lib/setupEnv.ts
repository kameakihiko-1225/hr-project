/**
 * Environment setup utility
 * This file ensures environment variables are properly defined for the application
 * 
 * Note: We don't modify import.meta.env directly as it's read-only in production builds.
 * Instead, we use the env.ts file for environment variable management with fallbacks.
 */

/**
 * Initialize environment
 * Call this function at the start of your application
 */
export function initializeEnvironment(): void {
  console.log('Environment initialized');
  console.log('Mode:', import.meta.env.MODE);
  
  // Log non-sensitive environment variables in development
  if (import.meta.env.DEV) {
    console.log('API URL:', import.meta.env.VITE_API_URL);
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '(set)' : '(not set)');
    console.log('Using mock auth:', import.meta.env.VITE_USE_MOCK_AUTH === "true" ? 'Yes' : 'No');
    // Don't log sensitive information like database URL, JWT secret, or Supabase keys
  }
}

export default initializeEnvironment; 
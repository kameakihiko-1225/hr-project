/**
 * Environment setup utility
 * This file ensures environment variables are properly defined for the application
 */

// Define default environment variables if not already set
if (!import.meta.env.VITE_DATABASE_URL) {
  import.meta.env.VITE_DATABASE_URL = "postgresql://user:password@localhost:5432/aurora_hrms?schema=public";
}

if (!import.meta.env.VITE_JWT_SECRET) {
  import.meta.env.VITE_JWT_SECRET = "your-super-secret-key-change-this-in-production";
}

if (!import.meta.env.VITE_JWT_EXPIRES_IN) {
  import.meta.env.VITE_JWT_EXPIRES_IN = "7d";
}

if (!import.meta.env.VITE_API_URL) {
  import.meta.env.VITE_API_URL = "http://localhost:8080/api";
}

// Don't set default empty values for Supabase configuration
// This will allow the actual environment variables to take effect
// if (!import.meta.env.VITE_SUPABASE_URL) {
//   import.meta.env.VITE_SUPABASE_URL = "";
// }

// if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
//   import.meta.env.VITE_SUPABASE_ANON_KEY = "";
// }

// Only enable mock authentication if explicitly set to true
if (import.meta.env.VITE_USE_MOCK_AUTH === undefined) {
  import.meta.env.VITE_USE_MOCK_AUTH = "false";
}

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
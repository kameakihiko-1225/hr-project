// Environment configuration utilities
export const env = {
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  nodeEnv: import.meta.env.MODE,
  apiUrl: import.meta.env.VITE_API_URL || '/api',
  baseUrl: import.meta.env.VITE_BASE_URL || 'http://localhost:5000',
  databaseUrl: import.meta.env.VITE_DATABASE_URL || 'Not available in browser',
  jwtSecret: import.meta.env.VITE_JWT_SECRET || 'Not available in browser',
  jwtExpiresIn: import.meta.env.VITE_JWT_EXPIRES_IN || '24h',
};

export const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value || defaultValue || '';
};
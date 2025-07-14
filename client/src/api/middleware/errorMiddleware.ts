import { createLogger } from '../../lib/logger';

// Create a logger for the middleware
const logger = createLogger('middleware');

/**
 * API Error class
 * Used to create API errors with status codes
 */
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Error middleware
 * Handles API errors
 */
export function errorMiddleware(error: any): Response {
  // Log the error
  logger.error('API error', error);
  
  // Determine status code
  const status = error instanceof ApiError ? error.status : 500;
  
  // Determine error message
  const message = error instanceof Error ? error.message : 'Internal server error';
  
  // Return error response
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
    }),
    { 
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export default errorMiddleware; 
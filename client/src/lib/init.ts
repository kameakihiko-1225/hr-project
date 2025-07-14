import { createLogger } from './logger';
import { env } from './env';
import initializeEnvironment from './setupEnv';
// import { setupMockApi } from './mockApi';

// Create a logger for the initialization
const logger = createLogger('init');

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Initialize the application
 * This should be called when the application starts
 */
export async function initializeApp(): Promise<void> {
  try {
    logger.info('Initializing application');
    
    // Initialize environment variables
    initializeEnvironment();
    
    // Log environment
    logger.info(`Environment: ${env.nodeEnv}`);
    
    // Skip database initialization in browser environment
    if (isBrowser) {
      logger.info('Browser environment detected, skipping database initialization');
      
      // Mock API is completely disabled
      logger.info('Browser application initialized successfully');
      return Promise.resolve();
    }
    
    // Server environment - initialize database
    // Import database initialization here to prevent browser import issues
    const { initializeDatabase } = await import('./dbInit');
    
    // Initialize database connection
    const dbInitialized = await initializeDatabase();
    
    if (!dbInitialized) {
      logger.warn('Database initialization failed, some features may not work properly');
    }
    
    logger.info('Application initialized successfully');
    return Promise.resolve();
  } catch (error) {
    logger.error('Failed to initialize application', error);
    return Promise.reject(error);
  }
}

/**
 * Shutdown the application
 * This should be called when the application shuts down
 */
export async function shutdownApp(): Promise<void> {
  try {
    logger.info('Shutting down application');
    
    // Skip database disconnection in browser environment
    if (!isBrowser) {
      // Import database disconnection here to prevent browser import issues
      const { disconnectDatabase } = await import('./dbInit');
      
      // Disconnect from database
      await disconnectDatabase();
    }
    
    logger.info('Application shut down successfully');
    return Promise.resolve();
  } catch (error) {
    logger.error('Failed to shut down application', error);
    return Promise.reject(error);
  }
}

// Browser environment doesn't have process events like Node.js
// We'll add event listeners for beforeunload instead

if (isBrowser) {
  window.addEventListener('beforeunload', () => {
    logger.info('Page unloading');
    // We can't await here because beforeunload doesn't wait for promises
    shutdownApp().catch(error => {
      logger.error('Error during shutdown', error);
    });
  });
} 
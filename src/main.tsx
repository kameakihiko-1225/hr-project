import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeApp } from './lib/init'
import { createLogger } from './lib/logger'
import './i18n';

// Create a logger for the main entry point
const logger = createLogger('main');

// Initialize the application
initializeApp()
  .then(() => {
    logger.info('Application initialized, rendering React app');
    
    // Render the React app
    createRoot(document.getElementById("root")!).render(<App />);
  })
  .catch((error) => {
    logger.error('Failed to initialize application', error);
  });

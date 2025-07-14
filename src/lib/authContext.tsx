import React, { createContext, useContext, useState, useEffect } from 'react';
import { createLogger } from './logger';
import api from './api';
import { env } from './env';

const logger = createLogger('authContext');

// Define the shape of the admin object
export interface Admin {
  id: string;
  email: string;
  isSuperAdmin: boolean;
  createdAt: string;
}

// Define the shape of the authentication context
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  admin: Admin | null;
  token: string | null;
  isAuthConfigured: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Authentication provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthConfigured, setIsAuthConfigured] = useState<boolean>(false);

  // Check if authentication is properly configured
  useEffect(() => {
    const checkAuthConfig = () => {
      const jwtSecret = env.jwtSecret;
      const isConfigured = jwtSecret && jwtSecret !== 'your-secret-key';
      setIsAuthConfigured(isConfigured);
      
      if (!isConfigured) {
        logger.warn('Authentication is not properly configured - missing JWT secret');
      } else {
        logger.debug('Authentication is properly configured');
      }
    };
    
    checkAuthConfig();
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        logger.debug('Checking for existing session');
        
        // Check local storage first for faster initial load
        const storedToken = localStorage.getItem('authToken');
        const storedAdmin = localStorage.getItem('adminData');
        
        if (storedToken && storedAdmin) {
          try {
            const adminData = JSON.parse(storedAdmin);
            if (adminData.id === 'mock-admin-id') {
              // Ignore mock sessions when mock auth disabled
              logger.info('Ignoring mock-admin session');
              localStorage.removeItem('authToken');
              localStorage.removeItem('adminData');
            } else {
              setToken(storedToken);
              setAdmin(adminData);
              setIsAuthenticated(true);
              logger.debug('Restored session from local storage');
            }
          } catch (error) {
            logger.warn('Failed to parse stored admin data', error);
            // Clear invalid data
            localStorage.removeItem('authToken');
            localStorage.removeItem('adminData');
          }
        }
        
        // Verify token with API
        if (storedToken) {
          // Set the token in the API client
          api.setToken(storedToken);
          
          // Make a request to verify the token
          const response = await api.get('/auth/verify');
          
          if (response.success && response.admin) {
            // Update state with fresh data
            setToken(storedToken);
            setAdmin(response.admin);
            setIsAuthenticated(true);
            
            // Update local storage
            localStorage.setItem('authToken', storedToken);
            localStorage.setItem('adminData', JSON.stringify(response.admin));
            
            logger.info('Session verified with API');
          } else {
            // Clear state if no valid session
            if (isAuthenticated) {
              setToken(null);
              setAdmin(null);
              setIsAuthenticated(false);
              
              // Clear local storage
              localStorage.removeItem('authToken');
              localStorage.removeItem('adminData');
              
              logger.debug('Session invalid, cleared authentication state');
            }
          }
        }
      } catch (error) {
        logger.error('Error checking session', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      if (!isAuthConfigured) {
        logger.warn('Login failed: Authentication not configured');
        return {
          success: false,
          error: 'Authentication service is not properly configured'
        };
      }
      
      const response = await api.post('/auth/login', { email, password });
      
      if (response.success && response.admin && response.token) {
        // Update state
        setToken(response.token);
        setAdmin(response.admin);
        setIsAuthenticated(true);
        
        // Store in local storage
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('adminData', JSON.stringify(response.admin));
        
        // Set token in API client
        api.setToken(response.token);
        
        logger.info('Login successful');
        
        return { success: true };
      } else {
        logger.warn(`Login failed: ${response.error}`);
        return { success: false, error: response.error };
      }
    } catch (error) {
      logger.error('Login error', error);
      return { success: false, error: 'An error occurred during login' };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Clear state
      setToken(null);
      setAdmin(null);
      setIsAuthenticated(false);
      
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('adminData');
      
      // Clear token in API client
      api.clearToken();
      
      logger.info('Logout successful');
    } catch (error) {
      logger.error('Logout error', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      
      if (!isAuthConfigured) {
        logger.warn('Password reset failed: Authentication not configured');
        return {
          success: false,
          error: 'Authentication service is not properly configured'
        };
      }
      
      const response = await api.post('/auth/reset-password', { email });
      
      if (response.success) {
        logger.info('Password reset email sent');
        return { success: true };
      } else {
        logger.warn(`Password reset failed: ${response.error}`);
        return { success: false, error: response.error };
      }
    } catch (error) {
      logger.error('Password reset error', error);
      return { success: false, error: 'An error occurred during password reset' };
    } finally {
      setIsLoading(false);
    }
  };

  // Create the context value
  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    admin,
    token,
    isAuthConfigured,
    login,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext; 
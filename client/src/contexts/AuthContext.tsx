import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminUser, AdminLogin } from '@shared/schema';
import { AuthClient, AuthState } from '@/lib/auth';

interface AuthContextType extends AuthState {
  login: (credentials: AdminLogin) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    admin: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state on mount
  useEffect(() => {
    refreshAuth();
  }, []);

  const refreshAuth = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const token = AuthClient.getStoredToken();
      if (!token) {
        setAuthState({
          admin: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      const admin = await AuthClient.getCurrentAdmin();
      if (admin) {
        setAuthState({
          admin,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Token is invalid, clear it
        AuthClient.removeToken();
        setAuthState({
          admin: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth refresh error:', error);
      AuthClient.removeToken();
      setAuthState({
        admin: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = async (credentials: AdminLogin): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await AuthClient.login(credentials);
      setAuthState({
        admin: result.admin,
        token: result.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await AuthClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        admin: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
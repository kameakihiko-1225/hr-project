import { AdminUser, AdminLogin } from '@shared/schema';

export interface AuthState {
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export class AuthClient {
  private static TOKEN_KEY = 'adminToken';

  // Get stored token
  static getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Store token
  static storeToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  // Remove token
  static removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // Login
  static async login(credentials: AdminLogin): Promise<{ admin: AdminUser; token: string }> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    
    // Store token
    this.storeToken(data.data.token);
    
    return data.data;
  }

  // Logout
  static async logout(): Promise<void> {
    const token = this.getStoredToken();
    
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always remove token locally
      this.removeToken();
    }
  }

  // Get current admin
  static async getCurrentAdmin(): Promise<AdminUser | null> {
    const token = this.getStoredToken();
    if (!token) return null;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token is invalid, remove it
        this.removeToken();
        return null;
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Get current admin error:', error);
      this.removeToken();
      return null;
    }
  }

  // Check if admin is authenticated
  static async isAuthenticated(): Promise<boolean> {
    const admin = await this.getCurrentAdmin();
    return admin !== null;
  }

  // Make authenticated request
  static async authenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getStoredToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized, remove token
    if (response.status === 401) {
      this.removeToken();
    }

    return response;
  }
}
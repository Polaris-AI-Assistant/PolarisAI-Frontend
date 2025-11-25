// Auth utility functions for handling authentication state

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface User {
  id: string;
  email: string;
  emailConfirmed: boolean;
  lastSignIn?: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// Get stored auth token
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
};

// Get stored refresh token
export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
};

// Get stored user data
export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  const userData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Clear all auth data
export const clearAuthData = (): void => {
  if (typeof window === 'undefined') return;
  
  // Clear localStorage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_data');
  
  // Clear sessionStorage
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('refresh_token');
  sessionStorage.removeItem('user_data');
  
  // Clear cookies - specifically delete auth_token and refresh_token
  const deleteCookie = (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  };
  
  deleteCookie('auth_token');
  deleteCookie('refresh_token');
};

// Refresh auth token
export const refreshAuthToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearAuthData();
      return false;
    }

    const data = await response.json();
    
    if (data.session) {
      const storage = localStorage.getItem('auth_token') ? localStorage : sessionStorage;
      storage.setItem('auth_token', data.session.access_token);
      storage.setItem('refresh_token', data.session.refresh_token);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearAuthData();
    return false;
  }
};

// Get current user from API
export const getCurrentUser = async (): Promise<User | null> => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/api/auth/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await refreshAuthToken();
        if (refreshed) {
          // Retry with new token
          return getCurrentUser();
        }
      }
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Get current user failed:', error);
    return null;
  }
};

// Sign out user
export const signOut = async (): Promise<void> => {
  try {
    console.log("Awaiting Signout")
    await fetch(`${API_URL}/api/auth/signout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log("Signed Out")
  } catch (error) {
    console.error('Sign out API call failed:', error);
  } finally {
    console.log("Finally block executing...")
    clearAuthData();
    console.log("Auth Data Cleared")
    
    // Redirect to landing page
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }
};

// Check if token is expired
export const isTokenExpired = (expiresAt: number): boolean => {
  return Date.now() >= expiresAt * 1000;
};

// API call with automatic token refresh
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  // Add auth header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    const refreshed = await refreshAuthToken();
    
    if (refreshed) {
      token = getAuthToken();
      // Retry with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
        },
      });
    } else {
      // Refresh failed, redirect to login
      clearAuthData();
      window.location.href = '/auth/signin';
      throw new Error('Authentication required');
    }
  }

  return response;
};

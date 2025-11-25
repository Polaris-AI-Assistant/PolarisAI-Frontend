// GitHub integration service

import { authenticatedFetch, getAuthToken, getStoredUser } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface GitHubConnectionStatus {
  connected: boolean;
  username?: string;
  connected_at?: string;
  error?: string;
  message?: string;
}

// Get GitHub OAuth URL for authenticated user
export const getGitHubAuthUrl = async (): Promise<string> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const response = await authenticatedFetch(`${API_URL}/api/auth/github/url`);
    
    if (!response.ok) {
      throw new Error('Failed to get GitHub OAuth URL');
    }
    
    const data = await response.json();
    return data.authUrl;
  } catch (error) {
    console.error('Error getting GitHub OAuth URL:', error);
    throw error;
  }
};

// Check GitHub connection status
export const checkGitHubStatus = async (): Promise<GitHubConnectionStatus> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { connected: false };
    }

    const user = getStoredUser();
    if (!user) {
      return { connected: false };
    }

    // Use the GitHub functions endpoint to check status
    const response = await fetch(`${API_URL}/api/github/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId: user.id })
    });
    
    if (!response.ok) {
      return { connected: false };
    }
    
    const data = await response.json();
    
    return {
      connected: data.connected || false,
      username: data.username,
      connected_at: data.connected_at,
      error: data.error,
      message: data.message
    };
  } catch (error) {
    console.error('Error checking GitHub status:', error);
    return { connected: false };
  }
};

// Handle GitHub OAuth callback (if needed for frontend)
export const handleGitHubCallback = async (code: string, state?: string): Promise<{
  success: boolean;
  username?: string;
  message?: string;
  error?: string;
}> => {
  try {
    const response = await fetch(`${API_URL}/api/auth/github/callback`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('GitHub OAuth callback failed');
    }

    const data = await response.json();
    
    return {
      success: data.success || false,
      username: data.user?.login,
      message: data.message
    };
  } catch (error) {
    console.error('Error handling GitHub callback:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Get GitHub profile information
export const getGitHubProfile = async (): Promise<{
  success: boolean;
  profile?: any;
  error?: string;
}> => {
  try {
    const token = getAuthToken();
    const user = getStoredUser();
    
    if (!token || !user) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/api/github/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId: user.id })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get GitHub profile');
    }

    const data = await response.json();
    return {
      success: true,
      profile: data.profile
    };
  } catch (error) {
    console.error('Error getting GitHub profile:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Get GitHub repositories
export const getGitHubRepos = async (options: {
  page?: number;
  per_page?: number;
  sort?: 'created' | 'updated' | 'pushed' | 'full_name';
  type?: 'all' | 'owner' | 'public' | 'private' | 'member';
} = {}): Promise<{
  success: boolean;
  repos?: any[];
  error?: string;
}> => {
  try {
    const token = getAuthToken();
    const user = getStoredUser();
    
    if (!token || !user) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/api/github/repos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId: user.id, options })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get GitHub repositories');
    }

    const data = await response.json();
    return {
      success: true,
      repos: data.repos
    };
  } catch (error) {
    console.error('Error getting GitHub repositories:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Get GitHub stats (basic info about connection)
export const getGitHubStats = async (): Promise<{
  total_repos?: number;
  public_repos?: number;
  private_repos?: number;
  followers?: number;
  following?: number;
  error?: string;
}> => {
  try {
    const profileResult = await getGitHubProfile();
    
    if (!profileResult.success || !profileResult.profile) {
      return { error: profileResult.error || 'Failed to get profile data' };
    }

    const profile = profileResult.profile;
    
    return {
      total_repos: profile.public_repos + (profile.total_private_repos || 0),
      public_repos: profile.public_repos,
      private_repos: profile.total_private_repos || 0,
      followers: profile.followers,
      following: profile.following
    };
  } catch (error) {
    console.error('Error getting GitHub stats:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Start GitHub OAuth flow
export const connectGitHub = async (): Promise<void> => {
  try {
    const authUrl = await getGitHubAuthUrl();
    
    // Open OAuth URL in current window
    window.location.href = authUrl;
  } catch (error) {
    console.error('Error starting GitHub OAuth:', error);
    throw error;
  }
};

// Disconnect GitHub account
export const disconnectGitHub = async (): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> => {
  try {
    const token = getAuthToken();
    const user = getStoredUser();
    
    if (!token || !user) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/api/auth/github/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId: user.id })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to disconnect GitHub');
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'GitHub account disconnected successfully'
    };
  } catch (error) {
    console.error('Error disconnecting GitHub:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};
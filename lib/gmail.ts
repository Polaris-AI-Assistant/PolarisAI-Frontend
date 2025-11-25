// Gmail integration service

import { authenticatedFetch, getAuthToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface GmailConnectionStatus {
  connected: boolean;
  email?: string;
  expiry?: number;
}

// Get Gmail OAuth URL for authenticated user
export const getGmailAuthUrl = async (): Promise<string> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const response = await authenticatedFetch(`${API_URL}/api/auth/gmail/url/authenticated`);
    
    if (!response.ok) {
      throw new Error('Failed to get Gmail OAuth URL');
    }
    
    const data = await response.json();
    return data.authUrl;
  } catch (error) {
    console.error('Error getting Gmail OAuth URL:', error);
    throw error;
  }
};

// Check Gmail connection status
export const checkGmailStatus = async (): Promise<GmailConnectionStatus> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { connected: false };
    }

    const response = await authenticatedFetch(`${API_URL}/api/gmail/status`);
    
    if (!response.ok) {
      return { connected: false };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking Gmail status:', error);
    return { connected: false };
  }
};

// Handle Gmail OAuth callback (if needed for frontend)
export const handleGmailCallback = async (code: string, state?: string): Promise<{
  success: boolean;
  email?: string;
  message?: string;
}> => {
  try {
    const response = await fetch(`${API_URL}/api/auth/gmail/callback/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state }),
    });

    if (!response.ok) {
      throw new Error('Gmail OAuth callback failed');
    }

    const data = await response.json();
    
    return {
      success: data.success,
      email: data.email,
      message: data.message
    };
  } catch (error) {
    console.error('Error handling Gmail callback:', error);
    return { success: false };
  }
};

// Manually trigger Gmail fetch and embedding
export const fetchAndEmbedGmailMessages = async (): Promise<{
  success: boolean;
  messages_fetched?: number;
  messages_embedded?: number;
  embedding_errors?: number;
  total_processed?: number;
  error?: string;
  message?: string;
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/gmail/fetch-and-embed`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch and embed Gmail messages');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching and embedding Gmail messages:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Check if user has any Gmail messages stored and embedded
export const getGmailStats = async (): Promise<{
  total_messages?: number;
  embedded_messages?: number;
  missing_embeddings?: number;
  error?: string;
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/gmail/stats`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get Gmail stats');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Gmail stats:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Start Gmail OAuth flow
export const connectGmail = async (): Promise<void> => {
  try {
    const authUrl = await getGmailAuthUrl();
    
    // Open OAuth URL in current window
    window.location.href = authUrl;
  } catch (error) {
    console.error('Error starting Gmail OAuth:', error);
    throw error;
  }
};

// Disconnect Gmail
export const disconnectGmail = async (): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/auth/gmail/disconnect`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to disconnect Gmail');
    }

    return await response.json();
  } catch (error) {
    console.error('Error disconnecting Gmail:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};


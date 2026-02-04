// Microsoft 365 integration service

import { authenticatedFetch, getAuthToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface MicrosoftConnectionStatus {
  connected: boolean;
  email?: string;
  name?: string;
  microsoftId?: string;
  apps: {
    outlook: boolean;
    calendar: boolean;
    onedrive: boolean;
    excel: boolean;
    teams: boolean;
    word: boolean;
  };
  grantedScopes?: string[];
  connectedAt?: string;
  lastUpdated?: string;
  expiresAt?: string;
}

// Individual app status interface
export interface MicrosoftAppStatus {
  connected: boolean;
  email?: string;
  name?: string;
}

// Get Microsoft OAuth URL for a specific app
export const getMicrosoftAuthUrl = async (app: 'outlook' | 'calendar' | 'onedrive' | 'excel' | 'teams' | 'word'): Promise<string> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const response = await authenticatedFetch(`${API_URL}/api/auth/microsoft/${app}/url`);
    
    if (!response.ok) {
      throw new Error(`Failed to get Microsoft ${app} OAuth URL`);
    }
    
    const data = await response.json();
    return data.authUrl;
  } catch (error) {
    console.error(`Error getting Microsoft ${app} OAuth URL:`, error);
    throw error;
  }
};

// Check Microsoft connection status for all apps
export const checkMicrosoftStatus = async (): Promise<MicrosoftConnectionStatus> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { 
        connected: false,
        apps: { outlook: false, calendar: false, onedrive: false, excel: false, teams: false, word: false }
      };
    }

    const response = await authenticatedFetch(`${API_URL}/api/auth/microsoft/status`);
    
    if (!response.ok) {
      return { 
        connected: false,
        apps: { outlook: false, calendar: false, onedrive: false, excel: false, teams: false, word: false }
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking Microsoft status:', error);
    return { 
      connected: false,
      apps: { outlook: false, calendar: false, onedrive: false, excel: false, teams: false, word: false }
    };
  }
};

// Check status for a specific Microsoft app
export const checkMicrosoftAppStatus = async (app: 'outlook' | 'calendar' | 'onedrive' | 'excel' | 'teams' | 'word'): Promise<MicrosoftAppStatus> => {
  try {
    const status = await checkMicrosoftStatus();
    
    return {
      connected: status.apps?.[app] || false,
      email: status.email,
      name: status.name
    };
  } catch (error) {
    console.error(`Error checking Microsoft ${app} status:`, error);
    return { connected: false };
  }
};

// Connect a specific Microsoft app (redirects to OAuth)
export const connectMicrosoftApp = async (app: 'outlook' | 'calendar' | 'onedrive' | 'excel' | 'teams' | 'word'): Promise<void> => {
  try {
    const authUrl = await getMicrosoftAuthUrl(app);
    window.location.href = authUrl;
  } catch (error) {
    console.error(`Error connecting Microsoft ${app}:`, error);
    throw error;
  }
};

// Disconnect all Microsoft apps
export const disconnectMicrosoft = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/auth/microsoft/disconnect`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || 'Failed to disconnect Microsoft' };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error disconnecting Microsoft:', error);
    return { success: false, error: 'Failed to disconnect Microsoft' };
  }
};

// Disconnect a specific Microsoft app
export const disconnectMicrosoftApp = async (app: 'outlook' | 'calendar' | 'onedrive' | 'excel' | 'teams' | 'word'): Promise<{ success: boolean; apps?: Record<string, boolean>; error?: string }> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/auth/microsoft/disconnect/${app}`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || `Failed to disconnect Microsoft ${app}` };
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error disconnecting Microsoft ${app}:`, error);
    return { success: false, error: `Failed to disconnect Microsoft ${app}` };
  }
};

// Refresh Microsoft tokens
export const refreshMicrosoftTokens = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/auth/microsoft/refresh`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || 'Failed to refresh Microsoft tokens' };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error refreshing Microsoft tokens:', error);
    return { success: false, error: 'Failed to refresh Microsoft tokens' };
  }
};

// Send query to Microsoft Agent
export const sendMicrosoftAgentQuery = async (query: string, conversationHistory: Array<{ role: string; content: string }> = []): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  toolsUsed?: string[];
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/microsoft/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, conversationHistory })
    });
    
    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || 'Failed to process Microsoft query' };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending Microsoft agent query:', error);
    return { success: false, error: 'Failed to process Microsoft query' };
  }
};

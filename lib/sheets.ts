// Google Sheets integration service

import { authenticatedFetch, getAuthToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface SheetsConnectionStatus {
  connected: boolean;
  email?: string;
  expiry?: string;
  expired?: boolean;
  scopes?: string[];
}

export interface Spreadsheet {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
}

export interface SheetValues {
  values: any[][];
  range: string;
}

// Get Sheets OAuth URL for authenticated user
export const getSheetsAuthUrl = async (): Promise<string> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const response = await authenticatedFetch(`${API_URL}/api/auth/sheets/url/authenticated`);
    
    if (!response.ok) {
      throw new Error('Failed to get Sheets OAuth URL');
    }
    
    const data = await response.json();
    return data.authUrl;
  } catch (error) {
    console.error('Error getting Sheets OAuth URL:', error);
    throw error;
  }
};

// Check Sheets connection status
export const checkSheetsStatus = async (): Promise<SheetsConnectionStatus> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { connected: false };
    }

    const response = await authenticatedFetch(`${API_URL}/api/sheets/status`);
    
    if (!response.ok) {
      return { connected: false };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking Sheets status:', error);
    return { connected: false };
  }
};

// Get list of user's spreadsheets
export const getUserSpreadsheets = async (): Promise<{
  success: boolean;
  spreadsheets?: Spreadsheet[];
  count?: number;
  email?: string;
  error?: string;
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/sheets/list`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch spreadsheets');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching spreadsheets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get a specific spreadsheet by ID
export const getSpreadsheetById = async (spreadsheetId: string): Promise<{
  success: boolean;
  spreadsheet?: any;
  error?: string;
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/sheets/${spreadsheetId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch spreadsheet');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching spreadsheet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get spreadsheet values from a range
export const getSpreadsheetValues = async (spreadsheetId: string, range: string): Promise<{
  success: boolean;
  values?: any[][];
  range?: string;
  error?: string;
}> => {
  try {
    const response = await authenticatedFetch(
      `${API_URL}/api/sheets/${spreadsheetId}/values?range=${encodeURIComponent(range)}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch spreadsheet values');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching spreadsheet values:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Disconnect Sheets
export const disconnectSheets = async (): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/auth/sheets/disconnect`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to disconnect Sheets');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error disconnecting Sheets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Send query to Sheets AI Agent
export const querySheetsAgent = async (
  query: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<{
  success: boolean;
  response?: string;
  tools_used?: any[];
  error?: string;
  message?: string;
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/sheets/agent/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        conversationHistory
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to process query');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error querying Sheets agent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get example queries
export const getSheetsExamples = async (): Promise<{
  success: boolean;
  examples?: any[];
  tips?: string[];
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/sheets/agent/examples`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch examples');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Sheets examples:', error);
    return {
      success: false
    };
  }
};

// Get agent capabilities
export const getSheetsCapabilities = async (): Promise<{
  success: boolean;
  capabilities?: any;
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/sheets/agent/capabilities`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch capabilities');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Sheets capabilities:', error);
    return {
      success: false
    };
  }
};

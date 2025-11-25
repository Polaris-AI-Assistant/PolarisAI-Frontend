// Google Forms integration service

import { authenticatedFetch, getAuthToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface FormsConnectionStatus {
  connected: boolean;
  email?: string;
  expiry?: string;
  expired?: boolean;
  scopes?: string[];
}

export interface Form {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
}

export interface FormResponse {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  answers: Record<string, any>;
}

// Get Forms OAuth URL for authenticated user
export const getFormsAuthUrl = async (): Promise<string> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const response = await authenticatedFetch(`${API_URL}/api/auth/forms/url/authenticated`);
    
    if (!response.ok) {
      throw new Error('Failed to get Forms OAuth URL');
    }
    
    const data = await response.json();
    return data.authUrl;
  } catch (error) {
    console.error('Error getting Forms OAuth URL:', error);
    throw error;
  }
};

// Check Forms connection status
export const checkFormsStatus = async (): Promise<FormsConnectionStatus> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { connected: false };
    }

    const response = await authenticatedFetch(`${API_URL}/api/forms/status`);
    
    if (!response.ok) {
      return { connected: false };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking Forms status:', error);
    return { connected: false };
  }
};

// Get list of user's forms
export const getUserForms = async (): Promise<{
  success: boolean;
  forms?: Form[];
  count?: number;
  email?: string;
  error?: string;
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/forms/list`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch forms');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching forms:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get a specific form by ID
export const getFormById = async (formId: string): Promise<{
  success: boolean;
  form?: any;
  error?: string;
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/forms/${formId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch form');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching form:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get form responses
export const getFormResponses = async (formId: string): Promise<{
  success: boolean;
  responses?: FormResponse[];
  count?: number;
  error?: string;
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/forms/${formId}/responses`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch form responses');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching form responses:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Disconnect Forms
export const disconnectForms = async (): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/forms/disconnect`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to disconnect Forms');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error disconnecting Forms:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

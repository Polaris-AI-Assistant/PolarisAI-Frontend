// Google Meet integration service

import { authenticatedFetch, getAuthToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface MeetConnectionStatus {
  connected: boolean;
  email?: string;
  connectedAt?: string;
  lastUpdated?: string;
  scopes?: string[];
}

export interface MeetingSpace {
  name: string;
  meetingUri: string;
  meetingCode: string;
  config?: any;
  activeConference?: any;
}

export interface Conference {
  name: string;
  startTime: string;
  endTime: string;
  space: string;
}

export interface Recording {
  name: string;
  driveDestination: any;
  startTime: string;
  endTime: string;
  state: string;
}

export interface Participant {
  name: string;
  earliestStartTime: string;
  latestEndTime: string;
  signedinUser?: any;
  anonymousUser?: any;
  phoneUser?: any;
}

// Get Meet OAuth URL for authenticated user
export const getMeetAuthUrl = async (): Promise<string> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const response = await authenticatedFetch(`${API_URL}/api/auth/meet/url/authenticated`);
    
    if (!response.ok) {
      throw new Error('Failed to get Meet OAuth URL');
    }
    
    const data = await response.json();
    return data.authUrl;
  } catch (error) {
    console.error('Error getting Meet OAuth URL:', error);
    throw error;
  }
};

// Check Meet connection status
export const checkMeetStatus = async (): Promise<MeetConnectionStatus> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { connected: false };
    }

    const response = await authenticatedFetch(`${API_URL}/api/auth/meet/status`);
    
    if (!response.ok) {
      return { connected: false };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking Meet status:', error);
    return { connected: false };
  }
};

// Create a new meeting space
export const createMeeting = async (): Promise<{
  success: boolean;
  space?: MeetingSpace;
  email?: string;
  error?: string;
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/meet/create`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create meeting');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating meeting:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get meeting space details
export const getMeetingSpace = async (spaceName: string): Promise<{
  success: boolean;
  space?: MeetingSpace;
  email?: string;
  error?: string;
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/meet/space/${spaceName}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get meeting space');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting meeting space:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Disconnect Google Meet
export const disconnectMeet = async (): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/auth/meet/disconnect`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to disconnect');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error disconnecting Meet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Send a query to the Meet AI agent
export const sendMeetAgentQuery = async (
  query: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<{
  success: boolean;
  response?: string;
  query?: string;
  tools_used?: Array<{ name: string; args: any }>;
  timestamp?: string;
  error?: string;
  message?: string;
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/meet/agent/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, conversationHistory })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to process query');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending Meet agent query:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get example queries
export const getMeetExamples = async (): Promise<{
  success: boolean;
  examples?: Array<{ category: string; queries: string[] }>;
  tips?: string[];
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/meet/agent/examples`);
    
    if (!response.ok) {
      throw new Error('Failed to get examples');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting Meet examples:', error);
    return { success: false };
  }
};

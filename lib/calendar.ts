// Google Calendar integration service

import { authenticatedFetch, getAuthToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface CalendarConnectionStatus {
  connected: boolean;
  email?: string;
  name?: string;
  picture?: string;
  connectedAt?: string;
  lastUpdated?: string;
  scopes?: string[];
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    responseStatus?: string;
  }>;
  status?: string;
  htmlLink?: string;
  hangoutLink?: string;
  recurrence?: string[];
}

export interface Calendar {
  id: string;
  summary: string;
  description?: string;
  timeZone?: string;
  primary?: boolean;
  accessRole?: string;
  backgroundColor?: string;
  foregroundColor?: string;
}

// Get Calendar OAuth URL for authenticated user
export const getCalendarAuthUrl = async (): Promise<string> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const response = await authenticatedFetch(`${API_URL}/api/auth/calendar/url/authenticated`);
    
    if (!response.ok) {
      throw new Error('Failed to get Calendar OAuth URL');
    }
    
    const data = await response.json();
    return data.authUrl;
  } catch (error) {
    console.error('Error getting Calendar OAuth URL:', error);
    throw error;
  }
};

// Check Calendar connection status
export const checkCalendarStatus = async (): Promise<CalendarConnectionStatus> => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.log('[Calendar] No auth token found');
      return { connected: false };
    }

    console.log('[Calendar] Checking status at:', `${API_URL}/api/auth/calendar/status`);
    const response = await authenticatedFetch(`${API_URL}/api/auth/calendar/status`);
    
    console.log('[Calendar] Status response status:', response.status);
    
    if (!response.ok) {
      console.log('[Calendar] Response not OK, status:', response.status);
      return { connected: false };
    }
    
    const data = await response.json();
    console.log('[Calendar] Status data:', data);
    
    return data;
  } catch (error) {
    console.error('Error checking Calendar status:', error);
    return { connected: false };
  }
};

// Get user's calendars
export const getUserCalendars = async (): Promise<{
  success: boolean;
  calendars?: Calendar[];
  count?: number;
  message?: string;
  error?: string;
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/calendar/calendars`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch calendars');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching calendars:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get calendar events
export const getCalendarEvents = async (params?: {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  calendarId?: string;
  query?: string;
}): Promise<{
  success: boolean;
  events?: CalendarEvent[];
  count?: number;
  message?: string;
  error?: string;
}> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.timeMin) queryParams.append('timeMin', params.timeMin);
    if (params?.timeMax) queryParams.append('timeMax', params.timeMax);
    if (params?.maxResults) queryParams.append('maxResults', params.maxResults.toString());
    if (params?.calendarId) queryParams.append('calendarId', params.calendarId);
    if (params?.query) queryParams.append('query', params.query);

    const url = `${API_URL}/api/calendar/events${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await authenticatedFetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch events');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Create a calendar event
export const createCalendarEvent = async (eventData: {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
  calendarId?: string;
  attendees?: string[];
  recurrence?: string;
  sendUpdates?: string;
  addGoogleMeet?: boolean;
}): Promise<{
  success: boolean;
  event?: CalendarEvent;
  eventId?: string;
  htmlLink?: string;
  message?: string;
  error?: string;
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/calendar/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create event');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Start Calendar OAuth flow
export const connectCalendar = async (): Promise<void> => {
  try {
    const authUrl = await getCalendarAuthUrl();
    
    // Open OAuth URL in current window
    window.location.href = authUrl;
  } catch (error) {
    console.error('Error starting Calendar OAuth:', error);
    throw error;
  }
};

// Disconnect Calendar
export const disconnectCalendar = async (): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/auth/calendar/disconnect`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to disconnect Calendar');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error disconnecting Calendar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Chat History Management System - Frontend API Client
// All logic is in the backend, this just makes API calls
// With caching support for better performance

import { getAuthToken, getStoredUser } from './auth';
import { useCacheStore } from './stores/cacheStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentsUsed?: string[];
  processingTime?: string;
  isError?: boolean;
  sequenceOrder?: number; // For reliable message ordering
  // File attachments (persisted as JSONB in chat_messages table)
  files?: Array<{
    id: string;
    filename: string;
    originalFilename: string;
    mimeType: string;
    size: number;
    url?: string;
    fileType: 'image' | 'document' | 'audio' | 'video' | 'other';
  }>;
  // Confirmation flow properties
  isPendingConfirmation?: boolean;
  isConfirmed?: boolean;
  isCanceled?: boolean;
  confirmationData?: {
    requestId: string;
    toolName: string;
    agentName: string;
    actionType: string;
    description: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
  messageCount: number;
}

const MAX_TITLE_LENGTH = 50;

// Helper function to get headers with auth token and user ID
const getHeaders = () => {
  const token = getAuthToken();
  const user = getStoredUser();
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-user-id': user?.id || '',
  };
};

// Generate a chat title from the first user message (client-side only)
export const generateChatTitle = (firstMessage: string): string => {
  const title = firstMessage.trim();
  if (title.length <= MAX_TITLE_LENGTH) {
    return title;
  }
  return title.substring(0, MAX_TITLE_LENGTH) + '...';
};

/**
 * Get all chat sessions for current user
 */
export const getAllChatSessions = async (): Promise<ChatSession[]> => {
  try {
    const response = await fetch(`${API_URL}/api/chat/sessions`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch chat sessions');
    }

    // Convert date strings to Date objects
    return data.sessions.map((session: any) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      messages: session.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }));
  } catch (error) {
    console.error('Error in getAllChatSessions:', error);
    return [];
  }
};

/**
 * Get a specific chat session by ID
 */
export const getChatSession = async (chatId: string): Promise<ChatSession | null> => {
  try {
    const response = await fetch(`${API_URL}/api/chat/sessions/${chatId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch chat session');
    }

    // Convert date strings to Date objects
    return {
      ...data.session,
      createdAt: new Date(data.session.createdAt),
      updatedAt: new Date(data.session.updatedAt),
      messages: data.session.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    };
  } catch (error) {
    console.error('Error fetching chat session:', error);
    return null;
  }
};

/**
 * Create a new chat session
 */
export const createNewChatSession = async (): Promise<ChatSession | null> => {
  try {
    const response = await fetch(`${API_URL}/api/chat/sessions`, {
      method: 'POST',
      headers: getHeaders(),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to create chat session');
    }

    return {
      ...data.session,
      createdAt: new Date(data.session.createdAt),
      updatedAt: new Date(data.session.updatedAt),
      messages: [],
      messageCount: 0,
    };
  } catch (error) {
    console.error('Error creating chat session:', error);
    return null;
  }
};

/**
 * Update a chat session with new messages
 */
export const updateChatSession = async (
  chatId: string,
  messages: ChatMessage[]
): Promise<ChatSession | null> => {
  try {
    // Filter out messages with empty content before sending
    const validMessages = messages.filter(m => m.content && m.content.trim() !== '');
    
    if (validMessages.length === 0) {
      console.warn('No valid messages to save');
      return null;
    }

    const response = await fetch(`${API_URL}/api/chat/sessions/${chatId}/messages`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ messages: validMessages }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to update chat session');
    }

    return {
      ...data.session,
      createdAt: new Date(data.session.createdAt),
      updatedAt: new Date(data.session.updatedAt),
      messages: data.session.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    };
  } catch (error) {
    console.error('Error in updateChatSession:', error);
    return null;
  }
};

/**
 * Delete a chat session
 */
export const deleteChatSession = async (chatId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/chat/sessions/${chatId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to delete chat session');
    }

    return true;
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return false;
  }
};

/**
 * Rename a chat session
 */
export const renameChatSession = async (chatId: string, newTitle: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/chat/sessions/${chatId}/rename`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ title: newTitle }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to rename chat session');
    }

    return true;
  } catch (error) {
    console.error('Error renaming chat session:', error);
    return false;
  }
};

/**
 * Clear all chat sessions
 */
export const clearAllChatSessions = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/chat/sessions`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to clear chat sessions');
    }

    return true;
  } catch (error) {
    console.error('Error clearing chat sessions:', error);
    return false;
  }
};

/**
 * Get chat sessions grouped by date (Today, Yesterday, Last 7 days, etc.)
 * Uses caching for better performance
 */
export interface GroupedChats {
  today: ChatSession[];
  yesterday: ChatSession[];
  lastWeek: ChatSession[];
  lastMonth: ChatSession[];
  older: ChatSession[];
}

// Helper function to group sessions by date
const groupSessionsByDate = (sessions: ChatSession[]): GroupedChats => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(today);
  lastMonth.setDate(lastMonth.getDate() - 30);

  const grouped: GroupedChats = {
    today: [],
    yesterday: [],
    lastWeek: [],
    lastMonth: [],
    older: [],
  };

  sessions.forEach((session) => {
    const sessionDate = new Date(session.updatedAt);
    const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

    if (sessionDay.getTime() === today.getTime()) {
      grouped.today.push(session);
    } else if (sessionDay.getTime() === yesterday.getTime()) {
      grouped.yesterday.push(session);
    } else if (sessionDay >= lastWeek) {
      grouped.lastWeek.push(session);
    } else if (sessionDay >= lastMonth) {
      grouped.lastMonth.push(session);
    } else {
      grouped.older.push(session);
    }
  });

  return grouped;
};

/**
 * Get grouped chat sessions with caching support
 * @param forceRefresh - If true, bypasses cache and fetches fresh data
 */
export const getGroupedChatSessions = async (forceRefresh: boolean = false): Promise<GroupedChats> => {
  const cacheStore = useCacheStore.getState();
  
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = cacheStore.getChatSessions();
    const isStale = cacheStore.isChatSessionsStale();
    
    // Return cached data immediately if available
    if (cached) {
      // If stale, trigger background refresh but return cached data
      if (isStale && !cacheStore.isLoadingChats) {
        // Background refresh (fire and forget)
        refreshChatSessionsInBackground();
      }
      
      // Convert cached data back to proper types
      return {
        today: cached.today.map(convertCachedSession),
        yesterday: cached.yesterday.map(convertCachedSession),
        lastWeek: cached.lastWeek.map(convertCachedSession),
        lastMonth: cached.lastMonth.map(convertCachedSession),
        older: cached.older.map(convertCachedSession),
      };
    }
  }
  
  // Fetch fresh data
  cacheStore.setLoadingChats(true);
  
  try {
    const sessions = await getAllChatSessions();
    const grouped = groupSessionsByDate(sessions);
    
    // Cache the grouped sessions (convert dates to strings for storage)
    const cacheableGrouped = {
      today: grouped.today.map(sessionToCacheable),
      yesterday: grouped.yesterday.map(sessionToCacheable),
      lastWeek: grouped.lastWeek.map(sessionToCacheable),
      lastMonth: grouped.lastMonth.map(sessionToCacheable),
      older: grouped.older.map(sessionToCacheable),
    };
    
    cacheStore.setChatSessions(cacheableGrouped);
    
    return grouped;
  } catch (error) {
    console.error('Error fetching grouped chat sessions:', error);
    cacheStore.setLoadingChats(false);
    return { today: [], yesterday: [], lastWeek: [], lastMonth: [], older: [] };
  }
};

// Helper to convert session to cacheable format
const sessionToCacheable = (session: ChatSession) => ({
  id: session.id,
  title: session.title,
  createdAt: session.createdAt.toISOString(),
  updatedAt: session.updatedAt.toISOString(),
  messageCount: session.messageCount,
});

// Helper to convert cached session back to proper types
const convertCachedSession = (cached: any): ChatSession => ({
  id: cached.id,
  title: cached.title,
  createdAt: new Date(cached.createdAt),
  updatedAt: new Date(cached.updatedAt),
  messages: [],
  messageCount: cached.messageCount,
});

// Background refresh function
const refreshChatSessionsInBackground = async () => {
  const cacheStore = useCacheStore.getState();
  
  if (cacheStore.isLoadingChats) return;
  
  cacheStore.setLoadingChats(true);
  
  try {
    const sessions = await getAllChatSessions();
    const grouped = groupSessionsByDate(sessions);
    
    const cacheableGrouped = {
      today: grouped.today.map(sessionToCacheable),
      yesterday: grouped.yesterday.map(sessionToCacheable),
      lastWeek: grouped.lastWeek.map(sessionToCacheable),
      lastMonth: grouped.lastMonth.map(sessionToCacheable),
      older: grouped.older.map(sessionToCacheable),
    };
    
    cacheStore.setChatSessions(cacheableGrouped);
  } catch (error) {
    console.error('Background chat refresh failed:', error);
    cacheStore.setLoadingChats(false);
  }
};

/**
 * Get a specific chat session with caching
 */
export const getChatSessionCached = async (chatId: string, forceRefresh: boolean = false): Promise<ChatSession | null> => {
  const cacheStore = useCacheStore.getState();
  
  // Check cache first
  if (!forceRefresh) {
    const cached = cacheStore.getChatSessionDetail(chatId);
    const isStale = cacheStore.isChatSessionDetailStale(chatId);
    
    if (cached && !isStale) {
      return {
        ...cached,
        createdAt: new Date(cached.createdAt),
        updatedAt: new Date(cached.updatedAt),
        messages: cached.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      };
    }
  }
  
  // Fetch fresh data
  const session = await getChatSession(chatId);
  
  if (session) {
    // Cache the session
    cacheStore.setChatSessionDetail(chatId, {
      ...session,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      messages: session.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      })),
    });
  }
  
  return session;
};

/**
 * Invalidate chat cache (call after mutations)
 */
export const invalidateChatCache = () => {
  const cacheStore = useCacheStore.getState();
  cacheStore.invalidateChatSessions();
};

/**
 * Invalidate specific chat session cache
 */
export const invalidateChatSessionCache = (chatId: string) => {
  const cacheStore = useCacheStore.getState();
  cacheStore.invalidateChatSessionDetail(chatId);
};

/**
 * Timeline event interface
 */
export interface TimelineEventData {
  type: string;
  eventId?: string;
  agentName?: string;
  agentDisplayName?: string;
  agentIcon?: string;
  toolName?: string;
  toolDisplayName?: string;
  status?: string;
  message?: string;
  description?: string;
  icon?: string;
  data?: any;
  result?: any;
  timestamp?: string;
  sequenceOrder?: number;
}

/**
 * Fetch timeline events for a specific message
 */
export const getTimelineEventsForMessage = async (chatId: string, messageId: string): Promise<TimelineEventData[]> => {
  try {
    const response = await fetch(`${API_URL}/api/chat/sessions/${chatId}/messages/${messageId}/timeline`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch timeline events');
    }

    return data.events || [];
  } catch (error) {
    console.error('Error in getTimelineEventsForMessage:', error);
    return [];
  }
};

/**
 * Fetch timeline events for multiple messages at once
 */
export const getTimelineEventsForMessages = async (messageIds: string[]): Promise<Record<string, TimelineEventData[]>> => {
  try {
    const response = await fetch(`${API_URL}/api/chat/timeline/batch`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ messageIds }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch timeline events');
    }

    return data.eventsByMessage || {};
  } catch (error) {
    console.error('Error in getTimelineEventsForMessages:', error);
    return {};
  }
};

/**
 * Migrate old conversation data from localStorage (for backward compatibility)
 */
export const migrateOldConversation = async (): Promise<void> => {
  if (typeof window === 'undefined') return;

  const oldData = localStorage.getItem('mainAgent_conversation');
  if (!oldData) return;

  try {
    const oldMessages = JSON.parse(oldData);
    if (oldMessages.length === 0) return;

    // Create a new session
    const newSession = await createNewChatSession();
    if (!newSession) {
      console.error('Failed to create migration session');
      return;
    }

    // Convert old messages to new format
    const convertedMessages: ChatMessage[] = oldMessages.map((msg: any) => ({
      id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      agentsUsed: msg.agentsUsed,
      processingTime: msg.processingTime,
      isError: msg.isError,
    }));

    // Update the session with messages
    await updateChatSession(newSession.id, convertedMessages);

    // Remove old data
    localStorage.removeItem('mainAgent_conversation');

    console.log('Successfully migrated old conversation to backend');
  } catch (error) {
    console.error('Error migrating old conversation:', error);
  }
};

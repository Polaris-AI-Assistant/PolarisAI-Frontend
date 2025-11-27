// Chat History Management System - Frontend API Client
// All logic is in the backend, this just makes API calls

import { getAuthToken, getStoredUser } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentsUsed?: string[];
  processingTime?: string;
  isError?: boolean;
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
 */
export interface GroupedChats {
  today: ChatSession[];
  yesterday: ChatSession[];
  lastWeek: ChatSession[];
  lastMonth: ChatSession[];
  older: ChatSession[];
}

export const getGroupedChatSessions = async (): Promise<GroupedChats> => {
  const sessions = await getAllChatSessions();
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

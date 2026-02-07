/**
 * Application Cache Store (Zustand)
 * 
 * Centralized caching for frequently accessed data:
 * - Chat sessions (grouped)
 * - Connection statuses (Gmail, GitHub, Forms, etc.)
 * - User data
 * 
 * Features:
 * - TTL-based cache invalidation
 * - Stale-while-revalidate pattern
 * - Optimistic updates
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Cache duration constants (in milliseconds)
const CACHE_DURATIONS = {
  CHAT_SESSIONS: 2 * 60 * 1000,      // 2 minutes for chat sessions
  CONNECTION_STATUS: 5 * 60 * 1000,   // 5 minutes for connection statuses
  CHAT_SESSION_DETAIL: 5 * 60 * 1000, // 5 minutes for individual chat details
};

// Connection status types
export interface GmailConnectionStatus {
  connected: boolean;
  email?: string;
  expiry?: number;
}

export interface GitHubConnectionStatus {
  connected: boolean;
  username?: string;
}

export interface FormsConnectionStatus {
  connected: boolean;
  email?: string;
}

export interface SheetsConnectionStatus {
  connected: boolean;
  email?: string;
}

export interface DocsConnectionStatus {
  connected: boolean;
  email: string | null;
}

export interface CalendarConnectionStatus {
  connected: boolean;
  email?: string;
}

export interface MeetConnectionStatus {
  connected: boolean;
  email?: string;
}

export interface MicrosoftConnectionStatus {
  connected: boolean;
  email?: string;
  apps: {
    outlook: boolean;
    calendar: boolean;
    onedrive: boolean;
    excel: boolean;
    teams: boolean;
    word: boolean;
  };
}

export interface ConnectionStatuses {
  gmail: GmailConnectionStatus;
  github: GitHubConnectionStatus;
  forms: FormsConnectionStatus;
  sheets: SheetsConnectionStatus;
  docs: DocsConnectionStatus;
  calendar: CalendarConnectionStatus;
  meet: MeetConnectionStatus;
  microsoft: MicrosoftConnectionStatus;
}

// Chat session cache types
export interface CachedChatSession {
  id: string;
  title: string;
  createdAt: string; // ISO string for serialization
  updatedAt: string;
  messageCount: number;
}

export interface GroupedChats {
  today: CachedChatSession[];
  yesterday: CachedChatSession[];
  lastWeek: CachedChatSession[];
  lastMonth: CachedChatSession[];
  older: CachedChatSession[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isLoading?: boolean;
}

interface CacheState {
  // Chat sessions cache
  chatSessions: CacheEntry<GroupedChats> | null;
  chatSessionDetails: Map<string, CacheEntry<any>>; // Map of chatId -> session details
  
  // Connection statuses cache
  connectionStatuses: CacheEntry<Partial<ConnectionStatuses>> | null;
  
  // Loading states
  isLoadingChats: boolean;
  isLoadingConnections: boolean;
  
  // Actions - Chat Sessions
  setChatSessions: (grouped: GroupedChats) => void;
  getChatSessions: () => GroupedChats | null;
  isChatSessionsStale: () => boolean;
  invalidateChatSessions: () => void;
  setLoadingChats: (loading: boolean) => void;
  
  // Actions - Individual Chat Session
  setChatSessionDetail: (chatId: string, session: any) => void;
  getChatSessionDetail: (chatId: string) => any | null;
  isChatSessionDetailStale: (chatId: string) => boolean;
  invalidateChatSessionDetail: (chatId: string) => void;
  
  // Actions - Connection Statuses
  setConnectionStatus: <K extends keyof ConnectionStatuses>(
    service: K,
    status: ConnectionStatuses[K]
  ) => void;
  setAllConnectionStatuses: (statuses: Partial<ConnectionStatuses>) => void;
  getConnectionStatus: <K extends keyof ConnectionStatuses>(
    service: K
  ) => ConnectionStatuses[K] | null;
  getAllConnectionStatuses: () => Partial<ConnectionStatuses> | null;
  isConnectionStatusStale: () => boolean;
  invalidateConnectionStatuses: () => void;
  setLoadingConnections: (loading: boolean) => void;
  
  // Clear all cache
  clearAllCache: () => void;
}

const defaultConnectionStatuses: ConnectionStatuses = {
  gmail: { connected: false },
  github: { connected: false },
  forms: { connected: false },
  sheets: { connected: false },
  docs: { connected: false, email: null },
  calendar: { connected: false },
  meet: { connected: false },
  microsoft: { 
    connected: false, 
    apps: { outlook: false, calendar: false, onedrive: false, excel: false, teams: false, word: false } 
  },
};

const defaultGroupedChats: GroupedChats = {
  today: [],
  yesterday: [],
  lastWeek: [],
  lastMonth: [],
  older: [],
};

export const useCacheStore = create<CacheState>()(
  persist(
    (set, get) => ({
      // Initial state
      chatSessions: null,
      chatSessionDetails: new Map(),
      connectionStatuses: null,
      isLoadingChats: false,
      isLoadingConnections: false,

      // ========== Chat Sessions Actions ==========
      
      setChatSessions: (grouped: GroupedChats) => {
        set({
          chatSessions: {
            data: grouped,
            timestamp: Date.now(),
          },
          isLoadingChats: false,
        });
      },

      getChatSessions: () => {
        const { chatSessions } = get();
        return chatSessions?.data || null;
      },

      isChatSessionsStale: () => {
        const { chatSessions } = get();
        if (!chatSessions) return true;
        return Date.now() - chatSessions.timestamp > CACHE_DURATIONS.CHAT_SESSIONS;
      },

      invalidateChatSessions: () => {
        set({ chatSessions: null });
      },

      setLoadingChats: (loading: boolean) => {
        set({ isLoadingChats: loading });
      },

      // ========== Individual Chat Session Actions ==========
      
      setChatSessionDetail: (chatId: string, session: any) => {
        const { chatSessionDetails } = get();
        const newDetails = new Map(chatSessionDetails);
        newDetails.set(chatId, {
          data: session,
          timestamp: Date.now(),
        });
        set({ chatSessionDetails: newDetails });
      },

      getChatSessionDetail: (chatId: string) => {
        const { chatSessionDetails } = get();
        const entry = chatSessionDetails.get(chatId);
        return entry?.data || null;
      },

      isChatSessionDetailStale: (chatId: string) => {
        const { chatSessionDetails } = get();
        const entry = chatSessionDetails.get(chatId);
        if (!entry) return true;
        return Date.now() - entry.timestamp > CACHE_DURATIONS.CHAT_SESSION_DETAIL;
      },

      invalidateChatSessionDetail: (chatId: string) => {
        const { chatSessionDetails } = get();
        const newDetails = new Map(chatSessionDetails);
        newDetails.delete(chatId);
        set({ chatSessionDetails: newDetails });
      },

      // ========== Connection Status Actions ==========
      
      setConnectionStatus: <K extends keyof ConnectionStatuses>(
        service: K,
        status: ConnectionStatuses[K]
      ) => {
        const { connectionStatuses } = get();
        const currentData = connectionStatuses?.data || {};
        set({
          connectionStatuses: {
            data: {
              ...currentData,
              [service]: status,
            },
            timestamp: Date.now(),
          },
        });
      },

      setAllConnectionStatuses: (statuses: Partial<ConnectionStatuses>) => {
        set({
          connectionStatuses: {
            data: statuses,
            timestamp: Date.now(),
          },
          isLoadingConnections: false,
        });
      },

      getConnectionStatus: <K extends keyof ConnectionStatuses>(
        service: K
      ): ConnectionStatuses[K] | null => {
        const { connectionStatuses } = get();
        if (!connectionStatuses?.data) return null;
        return connectionStatuses.data[service] as ConnectionStatuses[K] || null;
      },

      getAllConnectionStatuses: () => {
        const { connectionStatuses } = get();
        return connectionStatuses?.data || null;
      },

      isConnectionStatusStale: () => {
        const { connectionStatuses } = get();
        if (!connectionStatuses) return true;
        return Date.now() - connectionStatuses.timestamp > CACHE_DURATIONS.CONNECTION_STATUS;
      },

      invalidateConnectionStatuses: () => {
        set({ connectionStatuses: null });
      },

      setLoadingConnections: (loading: boolean) => {
        set({ isLoadingConnections: loading });
      },

      // ========== Clear All Cache ==========
      
      clearAllCache: () => {
        set({
          chatSessions: null,
          chatSessionDetails: new Map(),
          connectionStatuses: null,
          isLoadingChats: false,
          isLoadingConnections: false,
        });
      },
    }),
    {
      name: 'polaris-cache',
      // Persist both connection statuses and chat sessions for instant loading
      partialize: (state) => ({
        connectionStatuses: state.connectionStatuses,
        chatSessions: state.chatSessions,
      }),
      // Custom serialization for Map
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          return {
            state: {
              ...data.state,
              chatSessionDetails: new Map(),
            },
          };
        },
        setItem: (name, value) => {
          const { chatSessionDetails, ...rest } = value.state;
          localStorage.setItem(name, JSON.stringify({ state: rest }));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

// Helper hook to check if data needs refresh (stale-while-revalidate)
export const useStaleWhileRevalidate = () => {
  const store = useCacheStore();
  
  return {
    shouldRefreshChats: () => store.isChatSessionsStale() && !store.isLoadingChats,
    shouldRefreshConnections: () => store.isConnectionStatusStale() && !store.isLoadingConnections,
  };
};

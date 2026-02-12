'use client';

/**
 * Socket.io Context & Provider
 * 
 * Provides WebSocket connectivity for bidirectional real-time features:
 * - Presence/Typing indicators (user online/offline, "AI is thinking...")
 * - Notifications (push notifications, system alerts)
 * - Live Updates (agent additions/removals, chat title updates)
 * - Connection Management (heartbeat 30s, auto-reconnect with exponential backoff, state tracking)
 * 
 * SSE is used separately for AI response streaming (see mainAgent.ts).
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAuthToken, getStoredUser } from '@/lib/auth';

// ==================== Types ====================

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface OnlineUser {
  userId: string;
  userName: string;
  deviceCount: number;
}

export interface TypingUser {
  userId: string;
  userName: string;
}

export interface Notification {
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  data?: any;
  timestamp: string;
}

interface SocketContextValue {
  // Connection state
  connectionState: ConnectionState;
  isConnected: boolean;

  // Chat room management
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;

  // Typing indicators
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
  typingUsers: Map<string, TypingUser[]>; // chatId -> typing users

  // AI thinking
  aiThinking: { chatId: string; agentName?: string } | null;

  // Online presence
  onlineUsers: OnlineUser[];
  isUserOnline: (userId: string) => boolean;

  // Notifications
  notifications: Notification[];
  clearNotifications: () => void;

  // Agent updates
  lastAgentUpdate: { chatId: string; action: string; agentName: string; agentIcon?: string } | null;

  // Chat title updates
  lastChatTitleUpdate: { chatId: string; title: string } | null;
}

const SocketContext = createContext<SocketContextValue | null>(null);

// ==================== Provider ====================

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Max reconnection attempts with exponential backoff
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser[]>>(new Map());
  const [aiThinking, setAiThinking] = useState<{ chatId: string; agentName?: string } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastAgentUpdate, setLastAgentUpdate] = useState<{ chatId: string; action: string; agentName: string; agentIcon?: string } | null>(null);
  const [lastChatTitleUpdate, setLastChatTitleUpdate] = useState<{ chatId: string; title: string } | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const token = getAuthToken();
    const user = getStoredUser();

    if (!token || !user?.id) {
      // Not authenticated, don't connect
      return;
    }

    // Create socket with authentication
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: INITIAL_RECONNECT_DELAY,
      reconnectionDelayMax: 30000, // max 30 seconds between retries
      timeout: 20000,
    });

    socketRef.current = socket;

    // ---- Connection Events ----

    socket.on('connect', () => {
      console.log('[Socket] ✅ Connected:', socket.id);
      setConnectionState('connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] ❌ Disconnected:', reason);
      setConnectionState('disconnected');
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log(`[Socket] 🔄 Reconnecting (attempt ${attempt})...`);
      setConnectionState('reconnecting');
    });

    socket.on('reconnect', (attempt) => {
      console.log(`[Socket] ✅ Reconnected after ${attempt} attempts`);
      setConnectionState('connected');
    });

    socket.on('reconnect_failed', () => {
      console.error('[Socket] ❌ Reconnection failed after max attempts');
      setConnectionState('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      setConnectionState('disconnected');
    });

    // ---- Presence Events ----

    socket.on('online_users', ({ users }: { users: OnlineUser[] }) => {
      setOnlineUsers(users);
    });

    socket.on('user_online', ({ userId, userName }: { userId: string; userName: string }) => {
      setOnlineUsers(prev => {
        const exists = prev.find(u => u.userId === userId);
        if (exists) {
          return prev.map(u => u.userId === userId 
            ? { ...u, deviceCount: u.deviceCount + 1 } 
            : u
          );
        }
        return [...prev, { userId, userName, deviceCount: 1 }];
      });
    });

    socket.on('user_offline', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== userId));
    });

    // ---- Typing Events ----

    socket.on('user_typing', ({ userId, userName, chatId, isTyping }: {
      userId: string; userName: string; chatId: string; isTyping: boolean;
    }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        const chatUsers = next.get(chatId) || [];
        
        if (isTyping) {
          if (!chatUsers.find(u => u.userId === userId)) {
            next.set(chatId, [...chatUsers, { userId, userName }]);
          }
        } else {
          next.set(chatId, chatUsers.filter(u => u.userId !== userId));
        }
        
        return next;
      });
    });

    socket.on('typing_users', ({ chatId, users }: { chatId: string; users: TypingUser[] }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        next.set(chatId, users);
        return next;
      });
    });

    // ---- AI Thinking ----

    socket.on('ai_thinking', ({ chatId, isThinking, agentName }: {
      chatId: string; isThinking: boolean; agentName?: string;
    }) => {
      if (isThinking) {
        setAiThinking({ chatId, agentName: agentName || undefined });
      } else {
        setAiThinking(null);
      }
    });

    // ---- Agent Updates ----

    socket.on('agent_added', ({ chatId, agentName, agentIcon }: {
      chatId: string; agentName: string; agentIcon?: string;
    }) => {
      setLastAgentUpdate({ chatId, action: 'added', agentName, agentIcon });
    });

    socket.on('agent_removed', ({ chatId, agentName, agentIcon }: {
      chatId: string; agentName: string; agentIcon?: string;
    }) => {
      setLastAgentUpdate({ chatId, action: 'removed', agentName, agentIcon });
    });

    // ---- Chat Title Updates ----

    socket.on('chat_title_updated', ({ chatId, title }: { chatId: string; title: string }) => {
      setLastChatTitleUpdate({ chatId, title });
    });

    // ---- Notifications ----

    socket.on('notification', (notification: Notification) => {
      setNotifications(prev => [...prev, notification]);
    });

    socket.on('system_alert', (alert: { type: string; message: string; timestamp: string }) => {
      setNotifications(prev => [...prev, {
        type: alert.type as Notification['type'],
        title: 'System Alert',
        message: alert.message,
        timestamp: alert.timestamp,
      }]);
    });

    // Cleanup on unmount
    return () => {
      console.log('[Socket] Cleanup: disconnecting');
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // Only connect once on mount

  // ---- Actions ----

  const joinChat = useCallback((chatId: string) => {
    socketRef.current?.emit('join_chat', { chatId });
  }, []);

  const leaveChat = useCallback((chatId: string) => {
    socketRef.current?.emit('leave_chat', { chatId });
  }, []);

  const startTyping = useCallback((chatId: string) => {
    socketRef.current?.emit('typing_start', { chatId });
  }, []);

  const stopTyping = useCallback((chatId: string) => {
    socketRef.current?.emit('typing_stop', { chatId });
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.some(u => u.userId === userId);
  }, [onlineUsers]);

  const value: SocketContextValue = {
    connectionState,
    isConnected: connectionState === 'connected',
    joinChat,
    leaveChat,
    startTyping,
    stopTyping,
    typingUsers,
    aiThinking,
    onlineUsers,
    isUserOnline,
    notifications,
    clearNotifications,
    lastAgentUpdate,
    lastChatTitleUpdate,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

// ==================== Hook ====================

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

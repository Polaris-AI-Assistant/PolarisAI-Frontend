/**
 * Real-time Chat Subscription Hook
 * 
 * Combines two real-time channels:
 * 
 * 1. Supabase Realtime (PostgreSQL change notifications)
 *    - chat_messages INSERT/UPDATE → sync DB changes to UI
 *    - chat_sessions INSERT/UPDATE/DELETE → sync session list
 * 
 * 2. Socket.io (bidirectional WebSocket) - via useSocket() from SocketContext
 *    - Typing indicators (user_typing, typing_start/stop)
 *    - AI thinking indicator (ai_thinking)
 *    - Agent updates (agent_added/removed)
 *    - Chat title updates (chat_title_updated)
 *    - Presence (online/offline)
 *    - Auto join/leave chat rooms
 */
import { useEffect, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient, ChatMessageRow, ChatSessionRow, rowToChatMessage } from './supabase';
import { getStoredUser } from './auth';
import { ChatMessage } from './chatHistory';

// Re-export socket hook for convenience
export { useSocket } from '@/contexts/SocketContext';

interface UseRealtimeChatOptions {
  // === Supabase Realtime Callbacks (DB sync) ===
  // Called when a new message is inserted in the current chat
  onMessageInsert?: (message: ChatMessage) => void;
  // Called when a message is updated
  onMessageUpdate?: (message: ChatMessage) => void;
  // Called when a chat session is updated (title, message_count, etc.)
  onSessionUpdate?: (session: { id: string; title: string; messageCount: number }) => void;
  // Called when a new session is created
  onSessionInsert?: (session: { id: string; title: string; messageCount: number }) => void;
  // Called when a session is deleted
  onSessionDelete?: (sessionId: string) => void;

  // Current chat session ID to filter messages
  currentChatId?: string | null;
  // Enable/disable the subscription
  enabled?: boolean;
}

export function useRealtimeChat(options: UseRealtimeChatOptions) {
  const {
    onMessageInsert,
    onMessageUpdate,
    onSessionUpdate,
    onSessionInsert,
    onSessionDelete,
    currentChatId,
    enabled = true,
  } = options;

  const channelRef = useRef<RealtimeChannel | null>(null);
  const optionsRef = useRef(options);
  
  // Keep options ref up to date
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // ==================== Supabase Realtime (DB Sync) ====================

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const user = getStoredUser();
    if (!user?.id) {
      console.log('[Realtime] No user ID, skipping subscription');
      return;
    }

    const supabase = getSupabaseClient();
    
    // Create a unique channel name
    const channelName = `chat-updates-${user.id}`;
    
    console.log('[Realtime] Setting up Supabase subscription for user:', user.id);

    // Subscribe to chat_messages changes
    const channel = supabase
      .channel(channelName)
      // Listen for message inserts
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newRow = payload.new as ChatMessageRow;
          
          // Only process if it's for the current chat
          const currentOpts = optionsRef.current;
          if (currentOpts.currentChatId && newRow.chat_session_id === currentOpts.currentChatId) {
            const message = rowToChatMessage(newRow);
            currentOpts.onMessageInsert?.(message);
          }
        }
      )
      // Listen for message updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const updatedRow = payload.new as ChatMessageRow;
          
          const currentOpts = optionsRef.current;
          if (currentOpts.currentChatId && updatedRow.chat_session_id === currentOpts.currentChatId) {
            const message = rowToChatMessage(updatedRow);
            currentOpts.onMessageUpdate?.(message);
          }
        }
      )
      // Listen for session updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedSession = payload.new as ChatSessionRow;
          
          optionsRef.current.onSessionUpdate?.({
            id: updatedSession.id,
            title: updatedSession.title,
            messageCount: updatedSession.message_count,
          });
        }
      )
      // Listen for new sessions
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newSession = payload.new as ChatSessionRow;
          
          optionsRef.current.onSessionInsert?.({
            id: newSession.id,
            title: newSession.title,
            messageCount: newSession.message_count,
          });
        }
      )
      // Listen for session deletions
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_sessions',
        },
        (payload) => {
          const deletedSession = payload.old as { id: string };
          
          optionsRef.current.onSessionDelete?.(deletedSession.id);
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Supabase subscription status:', status);
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      console.log('[Realtime] Cleaning up Supabase subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled]); // Only re-subscribe when enabled changes

  // Return channel status helpers
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      const supabase = getSupabaseClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  return { unsubscribe };
}

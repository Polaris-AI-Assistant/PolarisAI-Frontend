// Supabase Client for Frontend Realtime Subscriptions
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration - using the same instance as backend
const SUPABASE_URL = 'https://onztclcwwbquobbbrnkl.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create singleton Supabase client
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    if (!SUPABASE_ANON_KEY) {
      console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY not set - realtime features will be disabled');
    }
    
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  
  return supabaseClient;
}

// Type definitions for Supabase tables
export interface ChatMessageRow {
  id: string;
  chat_session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  agents_used: string[] | null;
  processing_time: string | null;
  is_error: boolean;
  is_pending_confirmation: boolean;
  is_confirmed: boolean;
  is_canceled: boolean;
  confirmation_data: any | null;
}

export interface ChatSessionRow {
  id: string;
  user_id: string;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

// Convert database row to frontend ChatMessage type
export function rowToChatMessage(row: ChatMessageRow) {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    timestamp: new Date(row.created_at),
    agentsUsed: row.agents_used || [],
    processingTime: row.processing_time || undefined,
    isError: row.is_error,
    isPendingConfirmation: row.is_pending_confirmation,
    isConfirmed: row.is_confirmed,
    isCanceled: row.is_canceled,
    confirmationData: row.confirmation_data || undefined,
  };
}

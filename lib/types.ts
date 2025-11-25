// Types and interfaces for Gmail functionality

export interface SearchResult {
  message_id: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  sender: string;
  similarity: number;
}

export interface SearchResponse {
  results: SearchResult[];
  message: string;
  similarity_threshold: number;
  total_searched: number;
}

export interface EmailSendResponse {
  success: boolean;
  messageId?: string;
  threadId?: string;
  generatedContent?: {
    subject: string;
    body: string;
  };
  recipient?: string;
  error?: string;
}

export interface UserIntent {
  type: 'search' | 'send' | 'upcoming' | 'create' | 'stats';
  confidence: number;
  extractedInfo?: {
    recipientEmail?: string;
    emailPrompt?: string;
    searchQuery?: string;
  };
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  results?: SearchResult[];
  emailSent?: EmailSendResponse;
  isLoading?: boolean;
  intent?: UserIntent;
  error?: boolean;
  githubData?: any;
  metadata?: {
    toolsUsed?: Array<{ name: string; arguments: any }>;
    rawResults?: any[];
  };
}

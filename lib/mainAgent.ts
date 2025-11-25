/**
 * Main Coordinator Agent API Client
 * 
 * Provides functions to interact with the Main Coordinator Agent backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface AgentQuery {
  query: string;
  conversationHistory?: ConversationMessage[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentResponse {
  success: boolean;
  query: string;
  response: string;
  agentUsed?: string;
  agentsUsed?: string[];
  toolsUsed?: any[];
  singleAgent?: boolean;
  multiAgent?: boolean;
  analysis?: {
    reasoning: string;
    sequential: boolean;
  };
  processingTime?: string;
  timestamp: string;
  errors?: any;
  error?: string;
  message?: string;
}

export interface AgentInfo {
  success: boolean;
  mainAgent: {
    name: string;
    description: string;
    capabilities: string[];
  };
  specializedAgents: {
    [key: string]: {
      name: string;
      service: string;
      capabilities: string[];
    };
  };
  timestamp: string;
}

export interface AgentExamples {
  success: boolean;
  examples: {
    singleAgent: {
      [key: string]: string[];
    };
    multiAgent: Array<{
      query: string;
      agents: string[];
      description: string;
    }>;
    tips: string[];
  };
  timestamp: string;
}

export interface AgentHealth {
  success: boolean;
  status: string;
  mainAgent: string;
  specializedAgents: {
    count: number;
    available: string[];
  };
  capabilities: string[];
  timestamp: string;
}

/**
 * Process a query through the Main Coordinator Agent with streaming
 */
export async function processQueryStreaming(
  query: string,
  conversationHistory: ConversationMessage[] | undefined,
  onChunk: (chunk: StreamChunk) => void
): Promise<void> {
  // Import auth functions dynamically to avoid circular dependencies
  const { getAuthToken, refreshAuthToken } = await import('./auth');
  
  // Get token from localStorage or sessionStorage
  let token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }

  const makeRequest = async (authToken: string) => {
    return fetch(`${API_BASE_URL}/api/agent/query/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        query,
        conversationHistory,
      }),
    });
  };

  let response = await makeRequest(token);

  // If unauthorized, try to refresh token and retry
  if (response.status === 401) {
    const refreshed = await refreshAuthToken();
    if (refreshed) {
      token = getAuthToken();
      if (token) {
        response = await makeRequest(token);
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // If still unauthorized after refresh attempt, redirect to login
    if (response.status === 401) {
      throw new Error('Session expired. Please sign in again.');
    }
    
    throw new Error(errorData.message || errorData.error || 'Failed to process query');
  }

  // Process the SSE stream
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('No response body');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      // Decode the chunk
      const chunk = decoder.decode(value, { stream: true });
      
      // Split by newlines and process each event
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            onChunk(data);
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export interface StreamChunk {
  type: 'thinking' | 'status' | 'analysis' | 'content' | 'metadata' | 'error' | 'done';
  status?: 'start' | 'stop';
  message?: string;
  agents?: string[];
  reasoning?: string;
  text?: string;
  agentsUsed?: string[];
  processingTime?: string;
  timestamp?: string;
  error?: string;
}

/**
 * Process a query through the Main Coordinator Agent
 */
export async function processQuery(
  query: string,
  conversationHistory?: ConversationMessage[]
): Promise<AgentResponse> {
  // Import auth functions dynamically to avoid circular dependencies
  const { getAuthToken, refreshAuthToken } = await import('./auth');
  
  // Get token from localStorage or sessionStorage (consistent with auth system)
  let token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }

  const makeRequest = async (authToken: string) => {
    return fetch(`${API_BASE_URL}/api/agent/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        query,
        conversationHistory,
      }),
    });
  };

  let response = await makeRequest(token);

  // If unauthorized, try to refresh token and retry
  if (response.status === 401) {
    const refreshed = await refreshAuthToken();
    if (refreshed) {
      token = getAuthToken();
      if (token) {
        response = await makeRequest(token);
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // If still unauthorized after refresh attempt, redirect to login
    if (response.status === 401) {
      throw new Error('Session expired. Please sign in again.');
    }
    
    throw new Error(errorData.message || errorData.error || 'Failed to process query');
  }

  return response.json();
}

/**
 * Get information about available agents
 */
export async function getAgentInfo(): Promise<AgentInfo> {
  const response = await fetch(`${API_BASE_URL}/api/agent/info`);

  if (!response.ok) {
    throw new Error('Failed to fetch agent information');
  }

  return response.json();
}

/**
 * Get example queries
 */
export async function getAgentExamples(): Promise<AgentExamples> {
  const response = await fetch(`${API_BASE_URL}/api/agent/examples`);

  if (!response.ok) {
    throw new Error('Failed to fetch examples');
  }

  return response.json();
}

/**
 * Check agent system health
 */
export async function checkAgentHealth(): Promise<AgentHealth> {
  const response = await fetch(`${API_BASE_URL}/api/agent/health`);

  if (!response.ok) {
    throw new Error('Failed to check agent health');
  }

  return response.json();
}

/**
 * Format agent names for display
 */
export function formatAgentName(agentKey: string): string {
  const names: { [key: string]: string } = {
    calendar: 'Calendar',
    docs: 'Docs',
    forms: 'Forms',
    github: 'GitHub',
    meet: 'Meet',
    sheets: 'Sheets',
  };
  return names[agentKey] || agentKey;
}

/**
 * Get agent icon/emoji
 */
export function getAgentIcon(agentKey: string): string {
  const icons: { [key: string]: string } = {
    calendar: '📅',
    docs: '📄',
    forms: '📝',
    github: '⚡',
    meet: '📹',
    sheets: '📊',
  };
  return icons[agentKey] || '🤖';
}

/**
 * Get agent color for UI
 */
export function getAgentColor(agentKey: string): string {
  const colors: { [key: string]: string } = {
    calendar: 'blue',
    docs: 'indigo',
    forms: 'purple',
    github: 'gray',
    meet: 'green',
    sheets: 'emerald',
  };
  return colors[agentKey] || 'gray';
}

/**
 * Main Coordinator Agent API Client
 * 
 * Provides functions to interact with the Main Coordinator Agent backend
 * Includes support for confirmation flow and smooth token-by-token streaming
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface UserLocation {
  lat: number;
  lng: number;
}

export interface AgentQuery {
  query: string;
  conversationHistory?: ConversationMessage[];
  userLocation?: UserLocation;
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
 * Confirmation request from the agent when a sensitive action is detected
 */
export interface ConfirmationRequest {
  requestId: string;
  toolName: string;
  agentName: string;
  actionType: string;
  description: string;
  params: Record<string, any>;
  previewContent: string;
  originalQuery?: string;
  chainInfo?: {
    chainId: string;
    currentStep: number;
    totalSteps: number;
    previousResults?: any[];
  };
}

/**
 * Result of confirming an action
 */
export interface ConfirmActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Result of canceling an action
 */
export interface CancelActionResult {
  success: boolean;
  message: string;
  canceledAction?: {
    toolName: string;
    agentName: string;
  };
  error?: string;
}

/**
 * Pending action stored in the backend
 */
export interface PendingAction {
  requestId: string;
  toolName: string;
  agentName: string;
  previewContent: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Process a query through the Main Coordinator Agent with streaming
 */
export async function processQueryStreaming(
  query: string,
  conversationHistory: ConversationMessage[] | undefined,
  onChunk: (chunk: StreamChunk) => void,
  conversationId?: string,  // Optional: for artifact memory
  userLocation?: UserLocation  // Optional: for Maps queries requiring location
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
        conversationId,  // Pass conversationId for artifact memory
        userLocation,  // Pass userLocation for Maps queries
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
  type: 'thinking' | 'status' | 'analysis' | 'content' | 'metadata' | 'error' | 'done' | 'confirmation_request';
  status?: 'start' | 'stop';
  message?: string;
  agents?: string[];
  reasoning?: string;
  text?: string;
  agentsUsed?: string[];
  toolsUsed?: string[];
  processingTime?: string;
  timestamp?: string;
  error?: string;
  // Confirmation request fields
  requestId?: string;
  toolName?: string;
  agentName?: string;
  actionType?: string;
  description?: string;
  params?: Record<string, any>;
  previewContent?: string;
  originalQuery?: string;
  // Chain info for multi-action requests
  chainInfo?: {
    chainId: string;
    currentStep: number;
    totalSteps: number;
    previousResults?: any[];
  };
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
    gmail: 'Gmail',
    meet: 'Meet',
    sheets: 'Sheets',
    flights: 'Flights',
    maps: 'Maps',
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
    gmail: '📧',
    meet: '📹',
    sheets: '📊',
    flights: '✈️',
    maps: '🗺️',
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
    gmail: 'red',
    meet: 'green',
    sheets: 'emerald',
    flights: 'sky',
    maps: 'orange',
  };
  return colors[agentKey] || 'gray';
}

/**
 * Confirm and execute a pending action with streaming response
 * This provides smooth word-by-word streaming like ChatGPT/Copilot
 */
export async function confirmActionStreaming(
  requestId: string,
  onChunk: (chunk: StreamChunk) => void
): Promise<void> {
  const { getAuthToken, refreshAuthToken } = await import('./auth');
  
  let token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }

  const makeRequest = async (authToken: string) => {
    return fetch(`${API_BASE_URL}/api/agent/confirm-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ requestId }),
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
    
    if (response.status === 401) {
      throw new Error('Session expired. Please sign in again.');
    }
    if (response.status === 404) {
      throw new Error('Action not found or expired. Please try again.');
    }
    
    throw new Error(errorData.message || errorData.error || 'Failed to confirm action');
  }

  // Process the SSE stream
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('No response body');
  }

  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete events from buffer
      const lines = buffer.split('\n');
      
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';
      
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
    
    // Process any remaining data in buffer
    if (buffer.startsWith('data: ')) {
      try {
        const data = JSON.parse(buffer.slice(6));
        onChunk(data);
      } catch (e) {
        // Ignore incomplete data at the end
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Cancel a pending action
 */
export async function cancelAction(requestId: string): Promise<CancelActionResult> {
  const { getAuthToken, refreshAuthToken } = await import('./auth');
  
  let token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }

  const makeRequest = async (authToken: string) => {
    return fetch(`${API_BASE_URL}/api/agent/cancel-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ requestId }),
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
    
    if (response.status === 401) {
      throw new Error('Session expired. Please sign in again.');
    }
    
    return {
      success: false,
      message: errorData.message || 'Failed to cancel action',
      error: errorData.error
    };
  }

  return response.json();
}

/**
 * Get all pending actions for the current user
 */
export async function getPendingActions(): Promise<PendingAction[]> {
  const { getAuthToken, refreshAuthToken } = await import('./auth');
  
  let token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }

  const makeRequest = async (authToken: string) => {
    return fetch(`${API_BASE_URL}/api/agent/pending-actions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
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
    throw new Error(errorData.message || 'Failed to fetch pending actions');
  }

  const data = await response.json();
  return data.pendingActions || [];
}

/**
 * Get action type icon for display
 */
export function getActionTypeIcon(actionType: string): string {
  const icons: { [key: string]: string } = {
    create_event: '📅',
    update_event: '✏️',
    delete_event: '🗑️',
    create_document: '📄',
    delete_document: '🗑️',
    share_document: '🔗',
    create_form: '📝',
    delete_form: '🗑️',
    create_meeting: '📹',
    create_spreadsheet: '📊',
    delete_spreadsheet: '🗑️',
    share_spreadsheet: '🔗',
    create_repository: '⚡',
    delete_repository: '🗑️',
    create_issue: '📋',
    create_pull_request: '🔀',
    send_email: '✉️',
  };
  return icons[actionType] || '⚙️';
}

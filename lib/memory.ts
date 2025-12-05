/**
 * Memory System API Client
 * 
 * Provides functions to interact with the long-term semantic memory backend
 * Enables storing and retrieving user conversations with vector similarity search
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Memory types matching backend
export type MemoryType = 'user_profile' | 'behavior_pattern' | 'task_state' | 'cross_app';

export interface Memory {
  id: string;
  user_id: string;
  content: string;
  memory_type: MemoryType;
  source_app: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  similarity?: number; // Present when retrieved via similarity search
}

export interface AddMemoryRequest {
  userMessage: string;
  assistantMessage: string;
  sourceApp?: string;
  metadata?: Record<string, any>;
}

export interface AddMemoryResponse {
  success: boolean;
  memory?: Memory;
  memoryType?: MemoryType;
  error?: string;
  message?: string;
}

export interface RetrieveMemoriesRequest {
  query: string;
  limit?: number;
  threshold?: number;
}

export interface RetrieveMemoriesResponse {
  success: boolean;
  memories: Memory[];
  count: number;
  error?: string;
  message?: string;
}

export interface ListMemoriesResponse {
  success: boolean;
  memories: Memory[];
  count: number;
  error?: string;
  message?: string;
}

export interface DeleteMemoryResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Get auth token and refresh helper
 */
async function getAuthHelpers() {
  const { getAuthToken, refreshAuthToken } = await import('./auth');
  return { getAuthToken, refreshAuthToken };
}

/**
 * Make authenticated request with automatic token refresh
 */
async function makeAuthenticatedRequest<T>(
  url: string,
  options: RequestInit
): Promise<T> {
  const { getAuthToken, refreshAuthToken } = await getAuthHelpers();
  
  let token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }

  const makeRequest = async (authToken: string) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...options.headers,
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
    
    if (response.status === 401) {
      throw new Error('Session expired. Please sign in again.');
    }
    
    throw new Error(errorData.message || errorData.error || 'Request failed');
  }

  return response.json();
}

/**
 * Add a conversation to long-term memory
 * 
 * @param request - The memory content to add
 * @returns The created memory object
 */
export async function addMemory(request: AddMemoryRequest): Promise<AddMemoryResponse> {
  return makeAuthenticatedRequest<AddMemoryResponse>(
    `${API_BASE_URL}/api/memory/add`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );
}

/**
 * Retrieve relevant memories using semantic similarity search
 * 
 * @param request - Query and search parameters
 * @returns Array of relevant memories with similarity scores
 */
export async function retrieveMemories(request: RetrieveMemoriesRequest): Promise<RetrieveMemoriesResponse> {
  return makeAuthenticatedRequest<RetrieveMemoriesResponse>(
    `${API_BASE_URL}/api/memory/retrieve`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );
}

/**
 * List all memories for the current user
 * 
 * @param limit - Maximum number of memories to return (default: 50)
 * @param offset - Number of memories to skip (default: 0)
 * @returns Array of all user memories
 */
export async function listMemories(limit = 50, offset = 0): Promise<ListMemoriesResponse> {
  return makeAuthenticatedRequest<ListMemoriesResponse>(
    `${API_BASE_URL}/api/memory/list?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
    }
  );
}

/**
 * Delete a specific memory
 * 
 * @param memoryId - The ID of the memory to delete
 * @returns Success status
 */
export async function deleteMemory(memoryId: string): Promise<DeleteMemoryResponse> {
  return makeAuthenticatedRequest<DeleteMemoryResponse>(
    `${API_BASE_URL}/api/memory/${memoryId}`,
    {
      method: 'DELETE',
    }
  );
}

/**
 * Get display label for memory type
 */
export function getMemoryTypeLabel(type: MemoryType): string {
  const labels: Record<MemoryType, string> = {
    user_profile: 'Profile',
    behavior_pattern: 'Pattern',
    task_state: 'Task',
    cross_app: 'Cross-App',
  };
  return labels[type] || type;
}

/**
 * Get color for memory type (for UI badges)
 */
export function getMemoryTypeColor(type: MemoryType): string {
  const colors: Record<MemoryType, string> = {
    user_profile: 'blue',
    behavior_pattern: 'purple',
    task_state: 'green',
    cross_app: 'orange',
  };
  return colors[type] || 'gray';
}

/**
 * Get icon for memory type
 */
export function getMemoryTypeIcon(type: MemoryType): string {
  const icons: Record<MemoryType, string> = {
    user_profile: '👤',
    behavior_pattern: '🔄',
    task_state: '📋',
    cross_app: '🔗',
  };
  return icons[type] || '💭';
}

/**
 * Format memory content for display (truncate if too long)
 */
export function formatMemoryPreview(content: string, maxLength = 150): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.substring(0, maxLength).trim() + '...';
}

/**
 * Format similarity score as percentage
 */
export function formatSimilarityScore(similarity: number): string {
  return `${Math.round(similarity * 100)}%`;
}

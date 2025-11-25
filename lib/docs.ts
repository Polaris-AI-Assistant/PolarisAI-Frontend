import { authenticatedFetch } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface DocsConnectionStatus {
  connected: boolean;
  email: string | null;
  connectedAt?: string;
}

export interface Document {
  documentId: string;
  title: string;
  createdTime: string;
  modifiedTime: string;
  url: string;
  owners?: any[];
}

export interface DocumentContent {
  success: boolean;
  title: string;
  content: string;
  structure: any[];
  documentId: string;
}

export interface AgentResponse {
  success: boolean;
  response: string;
  toolCalls?: any[];
  conversationHistory?: any[];
  error?: string;
}

/**
 * Get OAuth URL for Google Docs
 */
export async function getDocsAuthUrl(): Promise<{ authUrl: string }> {
  const response = await authenticatedFetch(`${API_URL}/api/auth/docs/connect`);
  if (!response.ok) {
    throw new Error('Failed to get authentication URL');
  }
  return response.json();
}

/**
 * Check if user has connected Google Docs
 */
export async function checkDocsStatus(): Promise<DocsConnectionStatus> {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/docs/status`);
    if (!response.ok) {
      return { connected: false, email: null };
    }
    return response.json();
  } catch (error) {
    console.error('Error checking Docs status:', error);
    return { connected: false, email: null };
  }
}

/**
 * Get list of user's documents
 */
export async function getUserDocuments(pageSize: number = 50): Promise<{ success: boolean; documents: Document[]; count: number }> {
  const response = await authenticatedFetch(`${API_URL}/api/docs/list?pageSize=${pageSize}`);
  if (!response.ok) {
    throw new Error('Failed to get documents');
  }
  return response.json();
}

/**
 * Get document metadata
 */
export async function getDocumentById(documentId: string): Promise<any> {
  const response = await authenticatedFetch(`${API_URL}/api/docs/${documentId}`);
  if (!response.ok) {
    throw new Error('Failed to get document metadata');
  }
  return response.json();
}

/**
 * Read document content
 */
export async function getDocumentContent(documentId: string): Promise<DocumentContent> {
  const response = await authenticatedFetch(`${API_URL}/api/docs/${documentId}/content`);
  if (!response.ok) {
    throw new Error('Failed to read document content');
  }
  return response.json();
}

/**
 * Query the Docs AI agent
 */
export async function queryDocsAgent(
  query: string,
  conversationHistory?: any[]
): Promise<AgentResponse> {
  const response = await authenticatedFetch(`${API_URL}/api/docs/agent/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      conversationHistory
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to query agent');
  }

  return response.json();
}

/**
 * Get example queries
 */
export async function getDocsExamples(): Promise<any> {
  const response = await authenticatedFetch(`${API_URL}/api/docs/agent/examples`);
  if (!response.ok) {
    throw new Error('Failed to get examples');
  }
  return response.json();
}

/**
 * Get agent capabilities
 */
export async function getDocsCapabilities(): Promise<any> {
  const response = await authenticatedFetch(`${API_URL}/api/docs/agent/capabilities`);
  if (!response.ok) {
    throw new Error('Failed to get capabilities');
  }
  return response.json();
}

/**
 * Disconnect Google Docs
 */
export async function disconnectDocs(): Promise<{ success: boolean; message: string }> {
  const response = await authenticatedFetch(`${API_URL}/api/auth/docs/disconnect`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to disconnect Google Docs');
  }

  return response.json();
}

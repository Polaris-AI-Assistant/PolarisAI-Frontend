/**
 * Vault API Client - Simple file management
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

function getUserId(): string | null {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
    if (userData) {
      try { return JSON.parse(userData).id; } catch { return null; }
    }
  }
  return null;
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const userId = getUserId();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(userId && { 'x-user-id': userId })
  };
}

// ============================================
// Types
// ============================================

export interface VaultFile {
  id: string;
  user_id: string;
  original_filename: string;
  filename: string;
  mime_type: string;
  size: number;
  storage_path: string;
  public_url?: string;
  file_type: 'image' | 'document' | 'audio' | 'video' | 'other';
  status: string;
  created_at: string;
  updated_at: string;
}

export interface VaultStats {
  totalStorage: number;
  storageLimit: number;
  totalFiles: number;
  byType: Record<string, number>;
}

export interface VaultFilters {
  timeFilter?: string;
  type?: string;
  search?: string;
}

// ============================================
// API Functions
// ============================================

export async function getVaultFiles(filters: VaultFilters = {}): Promise<{ files: VaultFile[] }> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.append(key, value);
  }

  const response = await fetch(`${API_URL}/api/vault/files?${params}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) throw new Error('Failed to fetch files');
  return response.json();
}

export async function getVaultStats(): Promise<VaultStats> {
  const response = await fetch(`${API_URL}/api/vault/stats`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

export async function deleteVaultFile(fileId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/api/vault/files/${fileId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!response.ok) throw new Error('Failed to delete file');
  return response.json();
}

// ============================================
// Helpers
// ============================================

export function formatFileSize(bytes: number): string {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function getFileIcon(type: string): string {
  const icons: Record<string, string> = {
    image: '🖼️',
    document: '📄',
    audio: '🎵',
    video: '🎬'
  };
  return icons[type] || '📎';
}

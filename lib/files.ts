/**
 * Files API Client
 * Helper functions for interacting with file upload APIs
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Type for uploaded file result
 */
export interface UploadedFile {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  url?: string;
  fileType: 'image' | 'document' | 'audio' | 'video' | 'other';
  status: 'uploading' | 'processing' | 'ready' | 'failed';
}

/**
 * Upload options
 */
export interface UploadOptions {
  chatId?: string;
  messageId?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Get authentication token from localStorage
 */
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

/**
 * Get authorization headers
 */
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export interface FileListOptions {
  chatId?: string;
  fileType?: 'image' | 'document' | 'audio' | 'video' | 'other';
  status?: 'uploading' | 'processing' | 'ready' | 'failed';
  limit?: number;
  offset?: number;
}

export interface FileData {
  id: string;
  user_id: string;
  chat_id?: string;
  message_id?: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  size: number;
  storage_path: string;
  storage_bucket: string;
  public_url?: string;
  file_type: 'image' | 'document' | 'audio' | 'video' | 'other';
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  processing_error?: string;
  extracted_text?: string;
  metadata?: any;
  is_public: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FileListResponse {
  files: FileData[];
  total: number;
  limit: number;
  offset: number;
}

export interface StorageUsage {
  total_files: number;
  total_size: number;
  total_size_mb: number;
}

/**
 * List user's files
 */
export async function listFiles(options: FileListOptions = {}): Promise<FileListResponse> {
  const params = new URLSearchParams();
  
  if (options.chatId) params.append('chatId', options.chatId);
  if (options.fileType) params.append('fileType', options.fileType);
  if (options.status) params.append('status', options.status);
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.offset) params.append('offset', options.offset.toString());

  const response = await fetch(`${API_URL}/api/files?${params}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch files');
  }

  return response.json();
}

/**
 * Get file by ID
 */
export async function getFile(fileId: string): Promise<FileData> {
  const response = await fetch(`${API_URL}/api/files/${fileId}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch file');
  }

  return response.json();
}

/**
 * Delete file
 */
export async function deleteFile(fileId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/api/files/${fileId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to delete file');
  }

  return response.json();
}

/**
 * Search files
 */
export async function searchFiles(
  query: string,
  options: { limit?: number; offset?: number } = {}
): Promise<FileListResponse> {
  const params = new URLSearchParams({ q: query });
  
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.offset) params.append('offset', options.offset.toString());

  const response = await fetch(`${API_URL}/api/files/search?${params}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to search files');
  }

  return response.json();
}

/**
 * Get storage usage
 */
export async function getStorageUsage(): Promise<StorageUsage> {
  const response = await fetch(`${API_URL}/api/files/storage-usage`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch storage usage');
  }

  const data = await response.json();
  return data[0] || data;
}

/**
 * Get file statistics
 */
export async function getFileStats(): Promise<any> {
  const response = await fetch(`${API_URL}/api/files/stats`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch file statistics');
  }

  return response.json();
}

/**
 * Get recent files
 */
export async function getRecentFiles(limit: number = 10): Promise<{ files: FileData[] }> {
  const response = await fetch(`${API_URL}/api/files/recent?limit=${limit}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch recent files');
  }

  return response.json();
}

/**
 * Get files for a specific chat
 */
export async function getChatFiles(chatId: string, limit: number = 50): Promise<{ files: FileData[] }> {
  const response = await fetch(`${API_URL}/api/files/chat/${chatId}?limit=${limit}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch chat files');
  }

  return response.json();
}

/**
 * Manually trigger file processing
 */
export async function reprocessFile(fileId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/api/files/${fileId}/process`, {
    method: 'POST',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to reprocess file');
  }

  return response.json();
}

/**
 * Download file
 */
export async function downloadFile(fileId: string, filename: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/files/${fileId}/download`, {
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });

  if (!response.ok) {
    throw new Error('Failed to download file');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Upload file to server
 */
export async function uploadFile(
  file: File,
  options: UploadOptions = {}
): Promise<UploadedFile> {
  console.log('[uploadFile] Starting upload for:', file.name);
  
  const token = getAuthToken();
  
  // Get user ID from stored user data
  let userId: string | null = null;
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        userId = user.id;
        console.log('[uploadFile] Got userId from storage:', userId);
      } catch (e) {
        console.error('[uploadFile] Failed to parse user data:', e);
      }
    }
  }
  
  console.log('[uploadFile] Auth check - token:', !!token, 'userId:', !!userId);
  
  if (!userId && !token) {
    throw new Error('Not authenticated');
  }

  // Step 1: Get upload URL
  console.log('[uploadFile] Requesting upload URL from:', `${API_URL}/api/files/upload-simple`);
  const uploadUrlResponse = await fetch(`${API_URL}/api/files/upload-simple`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(userId && { 'x-user-id': userId })
    },
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      chatId: options.chatId,
      messageId: options.messageId
    })
  });

  if (!uploadUrlResponse.ok) {
    const error = await uploadUrlResponse.json();
    console.error('[uploadFile] Failed to get upload URL:', error);
    throw new Error(error.error || 'Failed to get upload URL');
  }

  const { fileId, uploadUrl, fileName } = await uploadUrlResponse.json();
  console.log('[uploadFile] Got upload URL, fileId:', fileId);

  // Step 2: Upload file to Supabase storage with progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (options.onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          options.onProgress?.(progress);
        }
      });
    }

    // Handle completion
    xhr.addEventListener('load', async () => {
      console.log('[uploadFile] Storage upload complete, status:', xhr.status);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          // Step 3: Confirm upload
          console.log('[uploadFile] Confirming upload...');
          const confirmResponse = await fetch(`${API_URL}/api/files/confirm-simple`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
              ...(userId && { 'x-user-id': userId })
            },
            body: JSON.stringify({ fileId })
          });

          if (!confirmResponse.ok) {
            const error = await confirmResponse.json();
            console.error('[uploadFile] Confirm failed:', error);
            reject(new Error(error.error || 'Failed to confirm upload'));
            return;
          }

          const result = await confirmResponse.json();
          console.log('[uploadFile] Upload confirmed successfully:', result);
          
          resolve({
            id: fileId,
            filename: fileName,
            originalFilename: file.name,
            mimeType: file.type,
            size: file.size,
            url: result.url,
            fileType: result.fileType || 'other',
            status: result.status || 'ready'
          });
        } catch (error) {
          reject(error);
        }
      } else {
        console.error('[uploadFile] Upload failed with status:', xhr.status);
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      console.error('[uploadFile] XHR error occurred');
      reject(new Error('Upload failed'));
    });

    xhr.addEventListener('abort', () => {
      console.log('[uploadFile] Upload cancelled');
      reject(new Error('Upload cancelled'));
    });

    // Start upload
    console.log('[uploadFile] Starting XHR upload to Supabase storage');
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

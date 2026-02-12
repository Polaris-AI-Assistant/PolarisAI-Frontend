/**
 * Type definitions for file upload system
 */

export type FileType = 'image' | 'document' | 'audio' | 'video' | 'other';

export type FileStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export interface FileMetadata {
  // Image metadata
  width?: number;
  height?: number;
  format?: string;

  // Audio/Video metadata
  duration?: number;
  bitrate?: number;
  codec?: string;

  // Video specific
  fps?: number;

  // Document metadata
  pageCount?: number;
  author?: string;
  title?: string;
  creator?: string;
  producer?: string;

  // Thumbnail URLs
  thumbnailUrl?: string;
  previewUrl?: string;

  // AI-generated metadata
  aiDescription?: string;
}

export interface FileData {
  id: string;
  user_id: string;
  chat_id?: string;
  message_id?: string;
  
  // File metadata
  filename: string;
  original_filename: string;
  mime_type: string;
  size: number;
  
  // Storage info
  storage_path: string;
  storage_bucket: string;
  public_url?: string;
  
  // File classification
  file_type: FileType;
  
  // Processing status
  status: FileStatus;
  processing_error?: string;
  
  // Extracted data
  extracted_text?: string;
  metadata?: FileMetadata;
  
  // Access control
  is_public: boolean;
  expires_at?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface UploadUrlRequest {
  filename: string;
  mimeType: string;
  size: number;
  chatId?: string;
  messageId?: string;
}

export interface UploadUrlResponse {
  fileId: string;
  uploadUrl: string;
  token: string;
  fileName: string;
}

export interface ConfirmUploadRequest {
  fileId: string;
}

export interface ConfirmUploadResponse {
  fileId: string;
  url: string;
  status: FileStatus;
  fileType: FileType;
  originalFilename: string;
}

export interface FileListOptions {
  chatId?: string;
  fileType?: FileType;
  status?: FileStatus;
  limit?: number;
  offset?: number;
}

export interface FileListResponse {
  files: FileData[];
  total: number;
  limit: number;
  offset: number;
}

export interface SearchFilesOptions {
  limit?: number;
  offset?: number;
}

export interface StorageUsage {
  total_files: number;
  total_size: number;
  total_size_mb: number;
}

export interface FileStats {
  total: number;
  byType: {
    image: number;
    document: number;
    audio: number;
    video: number;
    other: number;
  };
  storage?: StorageUsage;
}

export interface UploadProgress {
  fileId: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export interface FileUploadCallbacks {
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (file: FileData) => void;
  onError?: (error: Error) => void;
}

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,      // 10 MB
  document: 50 * 1024 * 1024,   // 50 MB
  audio: 25 * 1024 * 1024,      // 25 MB
  video: 100 * 1024 * 1024,     // 100 MB
  other: 5 * 1024 * 1024        // 5 MB
} as const;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  // Documents
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
  // Video
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  // Code/Text
  'application/json',
  'application/xml',
  'text/html',
  'text/css',
  'text/javascript',
  'application/javascript'
] as const;

// File type icons
export const FILE_TYPE_ICONS: Record<FileType, string> = {
  image: '🖼️',
  document: '📄',
  audio: '🎵',
  video: '🎥',
  other: '📎'
};

// File type colors for UI
export const FILE_TYPE_COLORS: Record<FileType, { bg: string; text: string; border: string }> = {
  image: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800'
  },
  document: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800'
  },
  audio: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800'
  },
  video: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800'
  },
  other: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-800'
  }
};

// Helper type guards
export function isImageFile(file: FileData): boolean {
  return file.file_type === 'image';
}

export function isDocumentFile(file: FileData): boolean {
  return file.file_type === 'document';
}

export function isAudioFile(file: FileData): boolean {
  return file.file_type === 'audio';
}

export function isVideoFile(file: FileData): boolean {
  return file.file_type === 'video';
}

export function isProcessing(file: FileData): boolean {
  return file.status === 'uploading' || file.status === 'processing';
}

export function isReady(file: FileData): boolean {
  return file.status === 'ready';
}

export function hasFailed(file: FileData): boolean {
  return file.status === 'failed';
}

export function hasExtractedText(file: FileData): boolean {
  return !!file.extracted_text && file.extracted_text.trim().length > 0;
}

export function hasThumbnail(file: FileData): boolean {
  return !!file.metadata?.thumbnailUrl || (isImageFile(file) && !!file.public_url);
}

// Utility functions
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getFileTypeFromMimeType(mimeType: string): FileType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (
    mimeType.includes('pdf') || 
    mimeType.includes('document') || 
    mimeType.includes('spreadsheet') ||
    mimeType.startsWith('text/')
  ) {
    return 'document';
  }
  return 'other';
}

export function validateFileSize(size: number, fileType: FileType): boolean {
  return size <= FILE_SIZE_LIMITS[fileType];
}

export function validateMimeType(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

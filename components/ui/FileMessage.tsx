'use client';

import React from 'react';
import Image from 'next/image';

interface FileData {
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
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    duration?: number;
    bitrate?: number;
    pageCount?: number;
    author?: string;
    thumbnailUrl?: string;
  };
  is_public: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

interface FileMessageProps {
  file: FileData;
  onDelete?: (fileId: string) => void;
  showDeleteButton?: boolean;
}

const FileMessage: React.FC<FileMessageProps> = ({ 
  file, 
  onDelete, 
  showDeleteButton = false 
}) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this file?')) {
      onDelete(file.id);
    }
  };

  const renderFileIcon = () => {
    switch (file.file_type) {
      case 'image':
        return '🖼️';
      case 'document':
        return '📄';
      case 'audio':
        return '🎵';
      case 'video':
        return '🎥';
      default:
        return '📎';
    }
  };

  const renderPreview = () => {
    switch (file.file_type) {
      case 'image':
        return (
          <div className="file-preview-image-container rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            {file.metadata?.thumbnailUrl || file.public_url ? (
              <img
                src={file.metadata?.thumbnailUrl || file.public_url}
                alt={file.original_filename}
                className="max-w-full max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => file.public_url && window.open(file.public_url, '_blank')}
              />
            ) : (
              <div className="p-8 text-gray-400">No preview available</div>
            )}
            {file.metadata?.width && file.metadata?.height && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {file.metadata.width} × {file.metadata.height}
              </div>
            )}
          </div>
        );

      case 'document':
        return (
          <div className="file-preview-document flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="file-icon text-4xl">{renderFileIcon()}</div>
            <div className="file-info flex-1 space-y-1">
              <div className="filename font-medium text-gray-900 dark:text-gray-100">
                {file.original_filename}
              </div>
              <div className="filesize text-sm text-gray-500 dark:text-gray-400">
                {formatBytes(file.size)}
              </div>
              {file.metadata?.pageCount && (
                <div className="pages text-sm text-gray-500 dark:text-gray-400">
                  {file.metadata.pageCount} pages
                </div>
              )}
            </div>
            <button
              className="file-action-btn px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              onClick={() => file.public_url && window.open(file.public_url, '_blank')}
            >
              Open
            </button>
          </div>
        );

      case 'audio':
        return (
          <div className="file-preview-audio-container space-y-2">
            {file.public_url && (
              <audio
                controls
                src={file.public_url}
                className="file-preview-audio w-full rounded-lg"
              >
                Your browser does not support audio playback.
              </audio>
            )}
            <div className="text-sm text-gray-500 dark:text-gray-400 flex justify-between">
              <span>{file.original_filename}</span>
              {file.metadata?.duration && (
                <span>Duration: {formatDuration(file.metadata.duration)}</span>
              )}
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="file-preview-video-container space-y-2">
            {file.public_url && (
              <video
                controls
                src={file.public_url}
                poster={file.metadata?.thumbnailUrl}
                className="file-preview-video w-full max-h-96 rounded-lg bg-black"
              >
                Your browser does not support video playback.
              </video>
            )}
            <div className="text-sm text-gray-500 dark:text-gray-400 flex justify-between">
              <span>{file.original_filename}</span>
              {file.metadata?.duration && (
                <span>Duration: {formatDuration(file.metadata.duration)}</span>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="file-preview-generic flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="file-icon text-4xl">{renderFileIcon()}</div>
            <div className="file-info flex-1 space-y-1">
              <div className="filename font-medium text-gray-900 dark:text-gray-100">
                {file.original_filename}
              </div>
              <div className="filesize text-sm text-gray-500 dark:text-gray-400">
                {formatBytes(file.size)}
              </div>
            </div>
            <button
              className="file-action-btn px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              onClick={() => file.public_url && window.open(file.public_url, '_blank')}
            >
              Download
            </button>
          </div>
        );
    }
  };

  return (
    <div className="file-message p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 space-y-3">
      {file.status === 'uploading' && (
        <div className="processing-indicator flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <div className="spinner w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Uploading file...</span>
        </div>
      )}

      {file.status === 'processing' && (
        <div className="processing-indicator flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
          <div className="spinner w-4 h-4 border-2 border-yellow-600 dark:border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Processing file...</span>
        </div>
      )}

      {file.status === 'ready' && renderPreview()}

      {file.status === 'failed' && (
        <div className="error-indicator space-y-1">
          <div className="text-red-600 dark:text-red-400 font-medium">
            ❌ Failed to process file
          </div>
          {file.processing_error && (
            <div className="error-detail text-sm text-gray-600 dark:text-gray-400">
              {file.processing_error}
            </div>
          )}
        </div>
      )}

      {showDeleteButton && (
        <button
          onClick={handleDelete}
          className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
        >
          Delete file
        </button>
      )}
    </div>
  );
};

export default FileMessage;

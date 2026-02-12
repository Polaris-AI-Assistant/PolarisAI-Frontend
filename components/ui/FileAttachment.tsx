'use client';

import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { X, FileText, Image as ImageIcon, FileVideo, FileAudio, File, Upload, Check } from 'lucide-react';
import { uploadFile, UploadedFile } from '@/lib/files';

interface FileAttachmentProps {
  onFileAttached?: (file: UploadedFile) => void;
  onFileRemoved?: (fileId: string) => void;
  attachedFiles?: UploadedFile[];
  maxSize?: number;
  disabled?: boolean;
}

export interface FileAttachmentRef {
  triggerFileSelect: () => void;
}

export const FileAttachment = forwardRef<FileAttachmentRef, FileAttachmentProps>(({
  onFileAttached,
  onFileRemoved,
  attachedFiles = [],
  maxSize = 50 * 1024 * 1024, // 50MB default
  disabled = false
}, ref) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expose method to parent to trigger file selection
  useImperativeHandle(ref, () => ({
    triggerFileSelect: () => {
      console.log('[FileAttachment] triggerFileSelect called');
      fileInputRef.current?.click();
    }
  }));

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('[FileAttachment] No file selected');
      return;
    }

    console.log('[FileAttachment] File selected:', file.name, file.size, 'bytes');

    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    console.log('[FileAttachment] Starting upload...');

    try {
      const uploadedFile = await uploadFile(file, {
        onProgress: (progress) => {
          console.log('[FileAttachment] Upload progress:', progress + '%');
          setUploadProgress(progress);
        }
      });

      console.log('[FileAttachment] Upload complete:', uploadedFile);
      onFileAttached?.(uploadedFile);
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('[FileAttachment] Upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (mimeType.startsWith('video/')) return <FileVideo className="w-4 h-4" />;
    if (mimeType.startsWith('audio/')) return <FileAudio className="w-4 h-4" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />
      
      {/* Attached Files Display */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-sm"
            >
              {getFileIcon(file.mimeType)}
              <span className="text-white truncate max-w-[200px]">{file.filename}</span>
              <span className="text-gray-400 text-xs">{formatBytes(file.size)}</span>
              {!disabled && (
                <button
                  onClick={() => onFileRemoved?.(file.id)}
                  className="ml-1 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="mb-2 px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700">
          <div className="flex items-center gap-2 mb-1">
            <Upload className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-sm text-white">Uploading...</span>
            <span className="text-xs text-gray-400 ml-auto">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-neutral-700 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

FileAttachment.displayName = 'FileAttachment';

export function FileAttachButton({ 
  onClick, 
  disabled = false 
}: { 
  onClick: () => void; 
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group p-2 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1"
    >
      <Upload className="w-4 h-4 text-white" />
      <span className="text-xs text-zinc-400 hidden group-hover:inline transition-opacity">
        Attach
      </span>
    </button>
  );
}

'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  chatId?: string;
  messageId?: string;
  onUploadComplete?: (fileData: UploadedFileData) => void;
  onUploadError?: (error: string) => void;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
}

interface UploadedFileData {
  fileId: string;
  url: string;
  status: string;
  filename: string;
  mimeType: string;
  size: number;
  fileType: string;
  originalFilename: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  chatId,
  messageId,
  onUploadComplete,
  onUploadError,
  maxSize = 100 * 1024 * 1024, // 100MB default
  acceptedFileTypes
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>('');

  const uploadFile = async (file: File) => {
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      const errorMsg = `File too large (max ${maxSizeMB}MB)`;
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);
    setCurrentFileName(file.name);

    try {
      // Step 1: Get upload URL from backend
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          chatId,
          messageId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { fileId, uploadUrl, token: uploadToken } = await response.json();

      // Step 2: Upload to Supabase Storage using signed URL
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentCompleted = Math.round((e.loaded * 100) / e.total);
            setProgress(percentCompleted);
          }
        });

        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.setRequestHeader('Authorization', `Bearer ${uploadToken}`);
        xhr.send(file);
      });

      // Step 3: Confirm upload with backend
      const confirmResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fileId })
      });

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm upload');
      }

      const confirmData = await confirmResponse.json();

      // Step 4: Call completion callback
      const uploadedFileData: UploadedFileData = {
        fileId,
        url: confirmData.url,
        status: confirmData.status,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        fileType: confirmData.fileType,
        originalFilename: confirmData.originalFilename
      };

      if (onUploadComplete) {
        onUploadComplete(uploadedFileData);
      }

      setUploading(false);
      setProgress(0);
      setCurrentFileName('');

    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMsg = error.message || 'Upload failed';
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      setUploading(false);
      setProgress(0);
      setCurrentFileName('');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      await uploadFile(file);
    }
  }, [chatId, messageId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize,
    accept: acceptedFileTypes ? acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}) : undefined
  });

  return (
    <div className="file-upload-container w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${isDragActive 
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
          }
          ${uploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="upload-progress space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Uploading {currentFileName}...
            </div>
            <div className="progress-bar-container w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="progress-bar h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-text text-sm font-medium text-gray-700 dark:text-gray-300">
              {progress}%
            </span>
          </div>
        ) : (
          <div className="upload-prompt space-y-2">
            {isDragActive ? (
              <div className="text-green-600 dark:text-green-400 font-medium">
                📁 Drop file here...
              </div>
            ) : (
              <>
                <div className="text-gray-700 dark:text-gray-300 font-medium">
                  📎 Drag & drop or click to upload
                </div>
                <span className="upload-hint text-sm text-gray-500 dark:text-gray-400">
                  Max {(maxSize / (1024 * 1024)).toFixed(0)}MB
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="upload-error mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;

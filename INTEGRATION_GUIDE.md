# File Upload Integration Guide

## Quick Integration into Existing Chat

### 1. Add File Upload to Chat Interface

```tsx
// In your chat component (e.g., MainAgentContent.tsx or similar)

import FileUpload from '@/components/ui/FileUpload';
import FileMessage from '@/components/ui/FileMessage';
import { useState } from 'react';

function ChatInterface({ chatId }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileUploadComplete = (fileData) => {
    // Add file to the uploaded files list
    setUploadedFiles(prev => [...prev, fileData]);

    // Optionally, add a message to chat about the upload
    const fileMessage = {
      role: 'system',
      content: `📎 File uploaded: ${fileData.filename}`,
      metadata: {
        fileId: fileData.fileId,
        fileType: fileData.fileType,
        fileUrl: fileData.url
      }
    };

    // Add to your messages array
    // addMessage(fileMessage);
  };

  const handleFileUploadError = (error) => {
    console.error('File upload error:', error);
    // Show error to user
  };

  return (
    <div className="chat-container">
      {/* Existing chat messages */}
      
      {/* File Upload Area */}
      <div className="mb-4">
        <FileUpload
          chatId={chatId}
          onUploadComplete={handleFileUploadComplete}
          onUploadError={handleFileUploadError}
          maxSize={50 * 1024 * 1024} // 50MB to match bucket limit
        />
      </div>

      {/* Display uploaded files */}
      <div className="uploaded-files space-y-2">
        {uploadedFiles.map(file => (
          <FileMessage
            key={file.fileId}
            file={file}
            showDeleteButton={true}
          />
        ))}
      </div>

      {/* Existing chat input */}
    </div>
  );
}
```

### 2. Add File Attachments to Chat Messages

```tsx
// When displaying a message that has file attachments

import FileMessage from '@/components/ui/FileMessage';
import { getFilesByMessageId } from '@/lib/files';
import { useEffect, useState } from 'react';

function ChatMessage({ message }) {
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    if (message.id) {
      // Fetch files attached to this message
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/message/${message.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.json())
        .then(data => setAttachments(data.files || []))
        .catch(console.error);
    }
  }, [message.id]);

  return (
    <div className="message">
      <div className="message-content">
        {message.content}
      </div>

      {/* Display attachments */}
      {attachments.length > 0 && (
        <div className="message-attachments mt-2 space-y-2">
          {attachments.map(file => (
            <FileMessage key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3. Add File Button to Chat Input

```tsx
// Add a file attachment button to your chat input

import { Paperclip } from 'lucide-react';
import { useRef } from 'react';

function ChatInput({ chatId, onFileUpload }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Trigger file upload
      onFileUpload(file);
    }
  };

  return (
    <div className="chat-input-container flex items-center gap-2">
      {/* File attachment button */}
      <button
        onClick={handleFileButtonClick}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        title="Attach file"
      >
        <Paperclip className="w-5 h-5" />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,video/*,audio/*,.pdf,.txt,.docx"
      />

      {/* Existing text input */}
      <input
        type="text"
        placeholder="Type a message..."
        className="flex-1 p-2 rounded-lg border"
      />

      {/* Send button */}
    </div>
  );
}
```

### 4. Add Paste Image Support

```tsx
// Allow users to paste images directly into chat

import { useEffect } from 'react';

function ChatInterface({ onFileUpload }) {
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await onFileUpload(file);
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [onFileUpload]);

  return (
    <div className="chat-interface">
      {/* Your chat UI */}
    </div>
  );
}
```

### 5. Display File Context in AI Responses

```tsx
// When sending a message with file context to the AI

async function sendMessage(userMessage, fileIds = []) {
  // If files are attached, fetch their data
  const fileContexts = await Promise.all(
    fileIds.map(async (fileId) => {
      const response = await fetch(`${API_URL}/api/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.json();
    })
  );

  // Build context for AI
  const context = fileContexts.map(file => {
    let contextText = `[File: ${file.original_filename}]`;
    
    if (file.file_type === 'image' && file.public_url) {
      contextText += `\nImage URL: ${file.public_url}`;
    }
    
    if (file.extracted_text) {
      contextText += `\nExtracted text:\n${file.extracted_text}`;
    }
    
    return contextText;
  }).join('\n\n');

  // Send to AI with context
  const aiMessage = `${context}\n\nUser: ${userMessage}`;
  
  // Your existing AI call
  // await callAI(aiMessage);
}
```

### 6. Show Storage Usage

```tsx
// Display user's storage usage

import { getStorageUsage } from '@/lib/files';
import { useEffect, useState } from 'react';

function StorageUsageIndicator() {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    getStorageUsage()
      .then(setUsage)
      .catch(console.error);
  }, []);

  if (!usage) return null;

  const usagePercent = (usage.total_size_mb / 5120) * 100; // 5GB limit
  const usageMB = usage.total_size_mb.toFixed(2);

  return (
    <div className="storage-usage p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Storage: {usageMB} MB / 5 GB ({usagePercent.toFixed(1)}%)
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            usagePercent > 90 ? 'bg-red-500' : 
            usagePercent > 75 ? 'bg-yellow-500' : 
            'bg-green-500'
          }`}
          style={{ width: `${Math.min(usagePercent, 100)}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {usage.total_files} files
      </div>
    </div>
  );
}
```

### 7. Create File Gallery View

```tsx
// Display all files in a gallery

import { listFiles } from '@/lib/files';
import { useEffect, useState } from 'react';
import FileMessage from '@/components/ui/FileMessage';

function FileGallery({ chatId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFiles();
  }, [chatId]);

  const loadFiles = async () => {
    try {
      const response = await listFiles({ 
        chatId, 
        limit: 50,
        status: 'ready'
      });
      setFiles(response.files);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId) => {
    // Delete file and refresh list
    await deleteFile(fileId);
    await loadFiles();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="file-gallery grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map(file => (
        <FileMessage
          key={file.id}
          file={file}
          onDelete={handleDelete}
          showDeleteButton={true}
        />
      ))}
    </div>
  );
}
```

## Common Use Cases

### 1. Image-Based Questions

User uploads an image and asks questions about it:

```tsx
const handleImageUpload = async (fileData) => {
  // Wait for processing to complete
  await waitForProcessing(fileData.fileId);
  
  // Get the processed file with extracted text
  const file = await getFile(fileData.fileId);
  
  // Ask AI about the image
  const message = `I uploaded an image. ${file.extracted_text ? 'OCR text: ' + file.extracted_text : ''} What can you tell me about it?`;
  
  // Send to AI with image URL
  sendToAI(message, { imageUrl: file.public_url });
};
```

### 2. Document Analysis

User uploads a PDF and asks for summary:

```tsx
const handleDocumentUpload = async (fileData) => {
  await waitForProcessing(fileData.fileId);
  const file = await getFile(fileData.fileId);
  
  if (file.extracted_text) {
    const message = `Please summarize this document:\n\n${file.extracted_text}`;
    sendToAI(message);
  }
};
```

### 3. Audio Transcription

User uploads audio for transcription:

```tsx
const handleAudioUpload = async (fileData) => {
  // Show processing status
  setProcessingStatus('Transcribing audio...');
  
  await waitForProcessing(fileData.fileId);
  const file = await getFile(fileData.fileId);
  
  if (file.extracted_text) {
    // Display transcription
    addMessage({
      role: 'assistant',
      content: `Transcription:\n\n${file.extracted_text}`
    });
  }
};
```

## Helper Function: Wait for Processing

```tsx
async function waitForProcessing(fileId: string, maxAttempts = 30): Promise<FileData> {
  for (let i = 0; i < maxAttempts; i++) {
    const file = await getFile(fileId);
    
    if (file.status === 'ready' || file.status === 'failed') {
      return file;
    }
    
    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('File processing timeout');
}
```

## Testing Checklist

- [ ] Upload image (< 10MB)
- [ ] Upload PDF (< 50MB)
- [ ] Upload audio (< 25MB)
- [ ] Verify thumbnail generation
- [ ] Verify text extraction (if enabled)
- [ ] Test file deletion
- [ ] Test file search
- [ ] Check storage usage display
- [ ] Verify RLS policies (users can only see their files)
- [ ] Test drag & drop
- [ ] Test paste image
- [ ] Test file download
- [ ] Verify processing status updates

## Tips & Best Practices

1. **Show Processing Status** - Always show users when files are being processed
2. **Handle Errors Gracefully** - Display clear error messages
3. **Validate Before Upload** - Check file size and type on client
4. **Show Progress** - Use progress bars for large uploads
5. **Cache File Data** - Avoid repeated API calls for same file
6. **Optimize Thumbnails** - Display thumbnails instead of full images
7. **Lazy Load** - Load files on demand in galleries
8. **Mobile Support** - Ensure file upload works on mobile devices
9. **Accessibility** - Add proper ARIA labels and keyboard navigation
10. **Analytics** - Track upload success/failure rates

## Environment Setup Reminder

Before testing, ensure:
1. ✅ SQL schema is run in Supabase
2. ✅ Redis is running (`redis-cli ping` returns PONG)
3. ✅ FFmpeg is installed (`ffmpeg -version`)
4. ✅ Dependencies are installed (`npm install` in both folders)
5. ✅ Environment variables are set (.env files)
6. ✅ Backend server is running
7. ✅ Frontend server is running

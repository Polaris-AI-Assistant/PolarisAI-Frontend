/**
 * File Generation Utility
 * Frontend service for generating and downloading PDF/TXT files
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface FileGenerationOptions {
  type: 'pdf' | 'txt';
  content: string;
  title?: string;
}

export interface FileGenerationResponse {
  success: boolean;
  type?: string;
  filename?: string;
  fileSize?: number;
  fileUrl?: string;
  expiresIn?: number;
  message?: string;
  error?: string;
}

/**
 * Generate a file (PDF or TXT) from content
 * @param options - Generation options (type, content, title)
 * @param userId - User ID (optional, will use from auth if available)
 * @returns Promise with download URL
 */
export async function generateFile(
  options: FileGenerationOptions,
  userId?: string
): Promise<FileGenerationResponse> {
  try {
    if (!options.type || !['pdf', 'txt'].includes(options.type)) {
      return {
        success: false,
        error: 'Invalid file type. Must be "pdf" or "txt"',
      };
    }

    if (!options.content || options.content.trim().length === 0) {
      return {
        success: false,
        error: 'Content cannot be empty',
      };
    }

    // Get user ID from localStorage if not provided
    const userIdToUse = userId || localStorage.getItem('userId');

    const response = await fetch(`${API_BASE_URL}/api/files/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userIdToUse && { 'x-user-id': userIdToUse }),
      },
      body: JSON.stringify({
        type: options.type,
        content: options.content,
        title: options.title || `${options.type}-${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || 'Failed to generate file',
      };
    }

    const data: FileGenerationResponse = await response.json();
    return data;
  } catch (error) {
    console.error('[generateFile] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Generate a PDF file from HTML content
 * @param htmlContent - HTML content to convert to PDF
 * @param title - File title (optional)
 * @param userId - User ID (optional)
 * @returns Promise with download URL
 */
export async function generatePDF(
  htmlContent: string,
  title?: string,
  userId?: string
): Promise<FileGenerationResponse> {
  try {
    if (!htmlContent || htmlContent.trim().length === 0) {
      return {
        success: false,
        error: 'HTML content cannot be empty',
      };
    }

    const userIdToUse = userId || localStorage.getItem('userId');

    const response = await fetch(`${API_BASE_URL}/api/files/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userIdToUse && { 'x-user-id': userIdToUse }),
      },
      body: JSON.stringify({
        htmlContent,
        title: title || `pdf-${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || 'Failed to generate PDF',
      };
    }

    const data: FileGenerationResponse = await response.json();
    return data;
  } catch (error) {
    console.error('[generatePDF] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF',
    };
  }
}

/**
 * Generate a TXT file from text content
 * @param textContent - Text content for the file
 * @param title - File title (optional)
 * @param userId - User ID (optional)
 * @returns Promise with download URL
 */
export async function generateTextFile(
  textContent: string,
  title?: string,
  userId?: string
): Promise<FileGenerationResponse> {
  try {
    if (!textContent || textContent.trim().length === 0) {
      return {
        success: false,
        error: 'Text content cannot be empty',
      };
    }

    const userIdToUse = userId || localStorage.getItem('userId');

    const response = await fetch(`${API_BASE_URL}/api/files/generate-txt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userIdToUse && { 'x-user-id': userIdToUse }),
      },
      body: JSON.stringify({
        textContent,
        title: title || `txt-${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || 'Failed to generate text file',
      };
    }

    const data: FileGenerationResponse = await response.json();
    return data;
  } catch (error) {
    console.error('[generateTextFile] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate text file',
    };
  }
}

/**
 * Download file from URL using window.open or fetch
 * @param fileUrl - Signed URL to download from
 * @param filename - Filename for download (optional)
 */
export function downloadFile(fileUrl: string, filename?: string): void {
  try {
    // Use window.open for simplicity - browser will handle download
    if (filename) {
      // Try to set download attribute with filename
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Fallback to window.open
      window.open(fileUrl, '_blank');
    }
  } catch (error) {
    console.error('[downloadFile] Error:', error);
    // Fallback to window.open if download attribute fails
    window.open(fileUrl, '_blank');
  }
}

/**
 * Convert markdown string to HTML (simple conversion)
 * This is a basic implementation. For production, consider using a markdown library.
 * @param markdown - Markdown string
 * @returns HTML string
 */
export function markdownToHTML(markdown: string): string {
  let html = markdown
    // Headers
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Code blocks
    .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br/>');

  return html;
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Sanitize filename for safe download
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}

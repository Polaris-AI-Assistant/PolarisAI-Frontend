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

/**
 * Detect if a query is asking for file generation
 * @param query - User's query string
 * @returns Object with fileType ('pdf' | 'txt' | null) and isExplicit flag
 */
export function detectFileGenerationRequest(
  query: string
): { fileType: 'pdf' | 'txt' | null; isExplicit: boolean } {
  if (!query) return { fileType: null, isExplicit: false };

  const lowerQuery = query.toLowerCase();

  // Regex patterns for explicit file generation requests
  const pdfPatterns = [
    /generate\s+(?:a\s+)?pdf/i,
    /export\s+(?:as\s+)?pdf/i,
    /create\s+(?:a\s+)?pdf/i,
    /make\s+(?:a\s+)?pdf/i,
    /convert\s+(?:to\s+)?pdf/i,
    /save\s+(?:as\s+)?pdf/i,
    /download\s+(?:as\s+)?pdf/i,
    /in\s+(?:a\s+)?pdf/i,  // Added: "in a pdf" or "in pdf"
    /in\s+pdf\s+(?:format|file)/i,  // Added: "in pdf format" or "in pdf file"
    /as\s+(?:a\s+)?pdf/i,  // Added: "as pdf"
    /\bpdf\b.*(?:file|document|export|generate|create|download|format)/i,
    /(?:file|document|export|generate|create|download)\s+.*pdf/i,  // Added: "create ... pdf"
  ];

  const txtPatterns = [
    /generate\s+(?:a\s+)?(?:text|txt)\s+file/i,
    /export\s+(?:as\s+)?(?:text|txt)/i,
    /create\s+(?:a\s+)?(?:text|txt)\s+file/i,
    /make\s+(?:a\s+)?(?:text|txt)\s+file/i,
    /convert\s+(?:to\s+)?(?:text|txt)/i,
    /save\s+(?:as\s+)?(?:text|txt)/i,
    /download\s+(?:as\s+)?(?:text|txt)/i,
    /in\s+(?:a\s+)?(?:text|txt)\s+(?:file|format)/i,  // Added: "in a text file"
    /as\s+(?:a\s+)?(?:text|txt)/i,  // Added: "as text"
    /\b(?:text|txt)\b.*(?:file|export|generate|create|download|format)/i,
  ];

  // Check for PDF request
  if (pdfPatterns.some(pattern => pattern.test(query))) {
    return { fileType: 'pdf', isExplicit: true };
  }

  // Check for TXT request
  if (txtPatterns.some(pattern => pattern.test(query))) {
    return { fileType: 'txt', isExplicit: true };
  }

  return { fileType: null, isExplicit: false };
}

'use client';

import React, { useState, useEffect } from 'react';
import { 
  generatePDF, 
  generateTextFile, 
  downloadFile, 
  formatFileSize,
  markdownToHTML,
  sanitizeFilename 
} from '@/lib/fileGeneration';
import { FileText, Download, Loader } from 'lucide-react';

interface FileGenerationPanelProps {
  content: string;
  isMarkdown?: boolean;
  title?: string;
  onSuccess?: (url: string, filename: string) => void;
  onError?: (error: string) => void;
  userId?: string;
  // New: indicates if file generation was explicitly requested by user
  requestedFileType?: 'pdf' | 'txt' | null;
}

/**
 * File Generation Panel Component
 * - When requestedFileType is set: Auto-generates file and shows download link only (no buttons)
 * - When requestedFileType is null: Returns null (doesn't render anything)
 */
export const FileGenerationPanel: React.FC<FileGenerationPanelProps> = ({
  content,
  isMarkdown = false,
  title = 'document',
  onSuccess,
  onError,
  userId,
  requestedFileType = null,
}) => {
  const [loading, setLoading] = useState<boolean>(requestedFileType !== null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sanitizedTitle = sanitizeFilename(title);

  // Auto-generate file when requestedFileType is set
  useEffect(() => {
    if (!requestedFileType) {
      console.log('[FileGenerationPanel] No requestedFileType, skipping generation');
      return;
    }

    console.log('[FileGenerationPanel] Starting auto-generation', {
      requestedFileType,
      contentLength: content.length,
      title,
      userId,
    });

    const autoGenerate = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[FileGenerationPanel] Calling file generation API', { requestedFileType });

        let result;
        if (requestedFileType === 'pdf') {
          const htmlContent = isMarkdown ? markdownToHTML(content) : content;
          console.log('[FileGenerationPanel] Generating PDF', { htmlLength: htmlContent.length });
          result = await generatePDF(htmlContent, sanitizedTitle, userId);
          console.log('[FileGenerationPanel] PDF generation result:', result);
        } else {
          console.log('[FileGenerationPanel] Generating TXT');
          result = await generateTextFile(content, sanitizedTitle, userId);
          console.log('[FileGenerationPanel] TXT generation result:', result);
        }

        if (result.success && result.fileUrl) {
          console.log('[FileGenerationPanel] Generation successful, file ready for download');
          setDownloadUrl(result.fileUrl);
          setDownloadFilename(
            result.filename || `${sanitizedTitle}.${requestedFileType}`
          );
          onSuccess?.(
            result.fileUrl,
            result.filename || `${sanitizedTitle}.${requestedFileType}`
          );
        } else {
          const errorMsg =
            result.error || `Failed to generate ${requestedFileType.toUpperCase()}`;
          console.error('[FileGenerationPanel] Generation failed:', errorMsg);
          setError(errorMsg);
          onError?.(errorMsg);
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'An error occurred';
        console.error('[FileGenerationPanel] Exception during generation:', errorMsg);
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    autoGenerate();
  }, [requestedFileType, content, isMarkdown, sanitizedTitle, userId, onSuccess, onError]);

  const handleDownload = () => {
    if (downloadUrl && downloadFilename) {
      downloadFile(downloadUrl, downloadFilename);
    }
  };

  // If file was NOT explicitly requested, don't render anything
  if (!requestedFileType) {
    return null;
  }

  // If file WAS explicitly requested, show auto-generated download link (no buttons)
  return (
    <div className="flex flex-col gap-3 mt-4 p-4 bg-gradient-to-r from-green-900/20 to-green-800/20 rounded-lg border border-green-700/50">
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700 rounded text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center gap-2 text-green-300">
          <Loader className="w-4 h-4 animate-spin" />
          <span className="text-sm">
            Generating {requestedFileType.toUpperCase()} file...
          </span>
        </div>
      )}

      {/* Download Ready State */}
      {downloadUrl && downloadFilename && !loading && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-200">
              {downloadFilename}
            </span>
          </div>
          <button
            onClick={handleDownload}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
          >
            Download
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Compact File Generation Button Component
 * Smaller version for inline use in messages
 */
interface CompactFileGenerationButtonProps {
  content: string;
  isMarkdown?: boolean;
  title?: string;
  fileType: 'pdf' | 'txt';
  onDownload?: (url: string, filename: string) => void;
  userId?: string;
}

export const CompactFileGenerationButton: React.FC<CompactFileGenerationButtonProps> = ({
  content,
  isMarkdown = false,
  title = 'document',
  fileType,
  onDownload,
  userId,
}) => {
  const [loading, setLoading] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);
  const sanitizedTitle = sanitizeFilename(title);

  const handleClick = async () => {
    try {
      setLoading(true);

      let result;
      if (fileType === 'pdf') {
        const htmlContent = isMarkdown ? markdownToHTML(content) : content;
        result = await generatePDF(htmlContent, sanitizedTitle, userId);
      } else {
        result = await generateTextFile(content, sanitizedTitle, userId);
      }

      if (result.success && result.fileUrl) {
        setDownloadReady(true);
        downloadFile(result.fileUrl, result.filename);
        onDownload?.(result.fileUrl, result.filename || `${sanitizedTitle}.${fileType}`);

        // Reset after 2 seconds
        setTimeout(() => setDownloadReady(false), 2000);
      }
    } catch (error) {
      console.error('[CompactFileGenerationButton] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const label = fileType.toUpperCase();
  const bgColor = fileType === 'pdf' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700';

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-1 px-2 py-1 ${bgColor} disabled:opacity-50 text-white text-xs font-medium rounded transition-all`}
    >
      {loading ? (
        <>
          <Loader className="w-3 h-3 animate-spin" />
          Generating...
        </>
      ) : downloadReady ? (
        <>
          <Download className="w-3 h-3" />
          Downloaded
        </>
      ) : (
        <>
          <FileText className="w-3 h-3" />
          Export as {label}
        </>
      )}
    </button>
  );
};

export default FileGenerationPanel;

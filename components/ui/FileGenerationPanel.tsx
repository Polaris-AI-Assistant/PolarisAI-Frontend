'use client';

import React, { useState } from 'react';
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
}

/**
 * File Generation Panel Component
 * Provides UI for generating and downloading PDF/TXT files
 */
export const FileGenerationPanel: React.FC<FileGenerationPanelProps> = ({
  content,
  isMarkdown = false,
  title = 'document',
  onSuccess,
  onError,
  userId,
}) => {
  const [loading, setLoading] = useState<'pdf' | 'txt' | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sanitizedTitle = sanitizeFilename(title);

  const handleGeneratePDF = async () => {
    try {
      setLoading('pdf');
      setError(null);

      // Convert markdown to HTML if needed
      const htmlContent = isMarkdown ? markdownToHTML(content) : content;

      const result = await generatePDF(htmlContent, sanitizedTitle, userId);

      if (result.success && result.fileUrl) {
        setDownloadUrl(result.fileUrl);
        setDownloadFilename(result.filename || `${sanitizedTitle}.pdf`);
        onSuccess?.(result.fileUrl, result.filename || `${sanitizedTitle}.pdf`);
      } else {
        const errorMsg = result.error || 'Failed to generate PDF';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateTXT = async () => {
    try {
      setLoading('txt');
      setError(null);

      // Use content as-is for TXT
      const result = await generateTextFile(content, sanitizedTitle, userId);

      if (result.success && result.fileUrl) {
        setDownloadUrl(result.fileUrl);
        setDownloadFilename(result.filename || `${sanitizedTitle}.txt`);
        onSuccess?.(result.fileUrl, result.filename || `${sanitizedTitle}.txt`);
      } else {
        const errorMsg = result.error || 'Failed to generate text file';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(null);
    }
  };

  const handleDownload = () => {
    if (downloadUrl && downloadFilename) {
      downloadFile(downloadUrl, downloadFilename);
    }
  };

  return (
    <div className="flex flex-col gap-3 mt-4 p-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-gray-200">Export Content</h3>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700 rounded text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleGeneratePDF}
          disabled={loading !== null}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white text-sm font-medium rounded transition-all"
        >
          {loading === 'pdf' ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Generate PDF
            </>
          )}
        </button>

        <button
          onClick={handleGenerateTXT}
          disabled={loading !== null}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white text-sm font-medium rounded transition-all"
        >
          {loading === 'txt' ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Generate TXT
            </>
          )}
        </button>
      </div>

      {/* Download Ready State */}
      {downloadUrl && downloadFilename && !loading && (
        <div className="p-3 bg-green-900/30 border border-green-700 rounded">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-200">
                {downloadFilename} ready
              </span>
            </div>
            <button
              onClick={handleDownload}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
            >
              Download
            </button>
          </div>
        </div>
      )}

      {/* Info Text */}
      <p className="text-xs text-gray-400">
        Download link expires in 10 minutes. PDF and TXT formats are supported.
      </p>
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

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  'js': 'JavaScript',
  'jsx': 'JSX',
  'ts': 'TypeScript',
  'tsx': 'TSX',
  'py': 'Python',
  'java': 'Java',
  'cpp': 'C++',
  'c': 'C',
  'cs': 'C#',
  'go': 'Go',
  'rs': 'Rust',
  'php': 'PHP',
  'rb': 'Ruby',
  'swift': 'Swift',
  'kt': 'Kotlin',
  'html': 'HTML',
  'css': 'CSS',
  'scss': 'SCSS',
  'json': 'JSON',
  'xml': 'XML',
  'yaml': 'YAML',
  'yml': 'YAML',
  'sql': 'SQL',
  'bash': 'Bash',
  'sh': 'Shell',
  'markdown': 'Markdown',
  'md': 'Markdown',
  'text': 'Text',
  'plain': 'Text',
};

export function CodeBlockShiki({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const displayLanguage = LANGUAGE_NAMES[language.toLowerCase()] || language || 'Text';

  // Highlight code using Shiki on the server
  useEffect(() => {
    const highlightCode = async () => {
      try {
        setIsLoading(true);
        
        // Use dynamic import to load Shiki
        const { codeToHtml } = await import('shiki');
        
        const html = await codeToHtml(code, {
          lang: language || 'text',
          theme: 'github-dark',
        });
        
        setHighlightedHtml(html);
      } catch (error) {
        console.error('Syntax highlighting error:', error);
        // Fallback: render plain code with basic styling
        setHighlightedHtml(
          `<pre style="margin:0; overflow:auto"><code style="font-family:inherit; font-size:inherit">${escapeHtml(code)}</code></pre>`
        );
      } finally {
        setIsLoading(false);
      }
    };

    highlightCode();
  }, [code, language]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  return (
    <div
      className="my-4 rounded-2xl overflow-hidden border border-white/[0.08] transition-all duration-300 hover:border-white/[0.12] relative group"
      role="region"
      aria-label="Code block"
      style={{
        backgroundColor: '#181818',
      }}
    >
      {/* Copy Button - Inside Code Block Top Right */}
      <button
        onClick={handleCopy}
        className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] hover:border-white/[0.15] text-white/[0.7] hover:text-white/[0.9] transition-all duration-200 active:scale-95 opacity-0 group-hover:opacity-100"
        aria-label={copied ? 'Code copied' : 'Copy code to clipboard'}
        aria-live="polite"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400">Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </>
        )}
      </button>

      {/* Code Container */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="px-5 py-4 text-white/[0.4] text-sm">Highlighting...</div>
        ) : (
          <div
            className="shiki-container"
            style={{
              padding: '1.25rem 1.5rem',
            }}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        )}
      </div>
    </div>
  );
}

// Helper to escape HTML
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export default CodeBlockShiki;

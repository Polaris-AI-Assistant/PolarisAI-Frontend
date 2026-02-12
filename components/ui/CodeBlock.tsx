'use client';

import { useState, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers / non-HTTPS
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
    <div className="my-4 rounded-lg overflow-hidden border border-white/[0.08] bg-[#1e1e1e]" role="region" aria-label="Code block">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-white/[0.08]">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] hover:border-white/[0.2] text-gray-300 transition-all duration-200 active:scale-95"
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
      </div>
      {/* Code */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.8125rem',
          lineHeight: '1.5rem',
          padding: '1rem',
          background: '#1e1e1e',
        }}
        wrapLongLines={true}
        showLineNumbers={false}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export default CodeBlock;

'use client';

import { useState, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
    <div 
      className="my-4 rounded-2xl overflow-hidden border border-white/[0.08] bg-gradient-to-b from-[#0D1117] to-[#0B0F14] transition-all duration-300 hover:border-white/[0.12] group" 
      role="region" 
      aria-label="Code block"
      style={{
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-white/[0.02] to-white/[0.01] border-b border-white/[0.05]">
        <span className="text-xs font-semibold text-white/[0.6] uppercase tracking-widest flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-white/[0.3]"></span>
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] hover:border-white/[0.15] text-white/[0.7] hover:text-white/[0.9] transition-all duration-200 active:scale-95 group/btn"
          aria-label={copied ? 'Code copied' : 'Copy code to clipboard'}
          aria-live="polite"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language || 'text'}
          style={atomDark}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: '0.875rem',
            lineHeight: '1.6',
            padding: '1.25rem 1.5rem',
            background: 'transparent',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'IBM Plex Mono', 'Consolas', monospace",
            fontFeatureSettings: '"liga" 1, "calt" 1',
          }}
          wrapLongLines={true}
          showLineNumbers={false}
          codeTagProps={{
            style: {
              fontFamily: 'inherit',
              fontSize: 'inherit',
              lineHeight: 'inherit',
            }
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export default CodeBlock;

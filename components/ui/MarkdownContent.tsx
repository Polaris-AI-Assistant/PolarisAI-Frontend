'use client';

import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { CodeBlock } from './CodeBlock';

interface MarkdownContentProps {
  content: string;
}

/**
 * MarkdownContent — renders AI markdown responses with proper formatting,
 * syntax-highlighted code blocks, tables, blockquotes, etc.
 */
const MarkdownContent = memo(function MarkdownContent({ content }: MarkdownContentProps) {
  const components: Components = {
    // ---------- Code ----------
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const code = String(children).replace(/\n$/, '');

      // Multi-line → full code block, single-line → inline
      const isBlock = code.includes('\n') || (className && className.startsWith('language-'));

      if (isBlock) {
        return <CodeBlock language={language} code={code} />;
      }

      return (
        <code className="markdown-inline-code" {...props}>
          {children}
        </code>
      );
    },

    // ---------- Headings ----------
    h1: ({ children }) => <h1 className="markdown-h1">{children}</h1>,
    h2: ({ children }) => <h2 className="markdown-h2">{children}</h2>,
    h3: ({ children }) => <h3 className="markdown-h3">{children}</h3>,
    h4: ({ children }) => <h4 className="markdown-h4">{children}</h4>,
    h5: ({ children }) => <h5 className="markdown-h5">{children}</h5>,
    h6: ({ children }) => <h6 className="markdown-h6">{children}</h6>,

    // ---------- Text ----------
    p: ({ children }) => <p className="markdown-p">{children}</p>,
    strong: ({ children }) => <strong className="markdown-strong">{children}</strong>,
    em: ({ children }) => <em className="markdown-em">{children}</em>,

    // ---------- Lists ----------
    ul: ({ children }) => <ul className="markdown-ul">{children}</ul>,
    ol: ({ children }) => <ol className="markdown-ol">{children}</ol>,
    li: ({ children }) => <li className="markdown-li">{children}</li>,

    // ---------- Links ----------
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="markdown-link"
      >
        {children}
        <svg
          className="inline-block w-3 h-3 ml-1 mb-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    ),

    // ---------- Blockquote ----------
    blockquote: ({ children }) => (
      <blockquote className="markdown-blockquote">{children}</blockquote>
    ),

    // ---------- Table ----------
    table: ({ children }) => (
      <div className="markdown-table-wrapper">
        <table className="markdown-table">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="markdown-thead">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="markdown-tr">{children}</tr>,
    th: ({ children }) => <th className="markdown-th">{children}</th>,
    td: ({ children }) => <td className="markdown-td">{children}</td>,

    // ---------- Misc ----------
    hr: () => <hr className="markdown-hr" />,
    img: ({ src, alt }) => (
      <img
        src={src}
        alt={alt || ''}
        className="max-w-full rounded-lg my-4 border border-white/[0.08]"
        loading="lazy"
      />
    ),
  };

  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});

export { MarkdownContent };
export default MarkdownContent;

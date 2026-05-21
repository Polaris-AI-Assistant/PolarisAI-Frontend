'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
  /** 
   * Pass `true` while the AI is still streaming this block.
   * When omitted / false the block is treated as complete and highlighted immediately.
   */
  isStreaming?: boolean;
}

const LANGUAGE_NAMES: Record<string, string> = {
  js: 'JavaScript', jsx: 'JSX', ts: 'TypeScript', tsx: 'TSX',
  py: 'Python', java: 'Java', cpp: 'C++', c: 'C', cs: 'C#',
  go: 'Go', rs: 'Rust', php: 'PHP', rb: 'Ruby', swift: 'Swift',
  kt: 'Kotlin', html: 'HTML', css: 'CSS', scss: 'SCSS', json: 'JSON',
  xml: 'XML', yaml: 'YAML', yml: 'YAML', sql: 'SQL', bash: 'Bash',
  sh: 'Shell', markdown: 'Markdown', md: 'Markdown',
  text: 'Text', plain: 'Text',
};

// Escape HTML for the plain-text fallback shown during streaming
function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]!)
  );
}

// Singleton Shiki instance – loaded once, reused everywhere
let shikiHighlighter: Awaited<ReturnType<typeof import('shiki').createHighlighter>> | null = null;
async function getHighlighter() {
  if (!shikiHighlighter) {
    const { createHighlighter } = await import('shiki');
    shikiHighlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: [
        'javascript', 'jsx', 'typescript', 'tsx', 'python', 'java', 'cpp', 'c',
        'csharp', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'html', 'css',
        'scss', 'json', 'xml', 'yaml', 'sql', 'bash', 'shell', 'markdown', 'text',
      ],
    });
  }
  return shikiHighlighter;
}

// How long (ms) to wait after the last code change before syntax-highlighting.
// This prevents Shiki from running on every streamed token.
const HIGHLIGHT_DEBOUNCE_MS = 600;

export function CodeBlockShiki({ language, code, isStreaming = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  // The Shiki-rendered HTML; null while we haven't highlighted yet
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  // Controls the CSS opacity so we can crossfade instead of hard-swapping
  const [htmlVisible, setHtmlVisible] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestCodeRef = useRef(code);
  latestCodeRef.current = code;

  const displayLanguage = LANGUAGE_NAMES[language.toLowerCase()] || language || 'Text';

  // ─── Highlighting logic ──────────────────────────────────────────────────
  useEffect(() => {
    // Clear any pending highlight while new tokens arrive
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // While actively streaming: hide any stale highlighted HTML so the plain
    // text view is shown — no flickering flash from Shiki loading states.
    if (isStreaming) {
      setHtmlVisible(false);
      // Don't nullify highlightedHtml here; keeping stale HTML avoids a
      // layout shift if streaming briefly pauses.
    }

    const delay = isStreaming ? HIGHLIGHT_DEBOUNCE_MS : 0;

    debounceRef.current = setTimeout(async () => {
      const codeSnapshot = latestCodeRef.current;
      try {
        const hl = await getHighlighter();
        const html = hl.codeToHtml(codeSnapshot, {
          lang: language || 'text',
          theme: 'github-dark',
        });
        // Only apply if the code hasn't changed while we were highlighting
        if (codeSnapshot === latestCodeRef.current) {
          setHighlightedHtml(html);
          // Small rAF delay lets React paint the hidden HTML before fading in
          requestAnimationFrame(() => setHtmlVisible(true));
        }
      } catch {
        // Graceful fallback – plain pre/code, no flash
        if (codeSnapshot === latestCodeRef.current) {
          setHighlightedHtml(
            `<pre style="margin:0;overflow:auto"><code>${escapeHtml(codeSnapshot)}</code></pre>`
          );
          requestAnimationFrame(() => setHtmlVisible(true));
        }
      }
    }, delay);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, language, isStreaming]);

  // ─── Copy handler ────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      className="my-4 rounded-2xl overflow-hidden border border-white/8 transition-all duration-300 hover:border-white/12 relative group"
      role="region"
      aria-label="Code block"
      style={{ backgroundColor: '#181818' }}
    >
      {/* Language label */}
      <div
        className="px-4 pt-3 pb-0 text-xs font-medium tracking-wide select-none"
        style={{ color: 'rgba(255,255,255,0.35)' }}
      >
        {displayLanguage}
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg
                   bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15
                   text-white/70 hover:text-white/90 transition-all duration-200 active:scale-95
                   opacity-0 group-hover:opacity-100"
        aria-label={copied ? 'Code copied' : 'Copy code to clipboard'}
        aria-live="polite"
      >
        {copied ? (
          <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
        ) : (
          <><Copy className="w-3 h-3" /><span>Copy</span></>
        )}
      </button>

      {/* Code area — two layers, crossfaded */}
      <div className="overflow-x-auto relative" style={{ padding: '1rem 1.5rem 1.25rem' }}>

        {/*
          Layer 1 – Plain text (always rendered, visible while streaming or
          before the first highlight completes). We use `pre` + `code` so the
          font / whitespace behaviour matches Shiki's output exactly, which
          prevents any layout shift when we fade in the highlighted version.
        */}
        <pre
          aria-hidden={htmlVisible}          // hide from a11y tree once Shiki is shown
          style={{
            margin: 0,
            fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            color: 'rgba(255,255,255,0.75)',
            whiteSpace: 'pre',
            tabSize: 2,
            // Fade out as soon as the highlighted layer is ready
            opacity: htmlVisible ? 0 : 1,
            transition: 'opacity 250ms ease',
            // Keep in flow so the container never collapses
            position: htmlVisible ? 'absolute' : 'relative',
            inset: htmlVisible ? '1rem 1.5rem' : 'auto',
            pointerEvents: 'none',
          }}
        >
          <code>{code}</code>
        </pre>

        {/*
          Layer 2 – Shiki highlighted HTML. Starts transparent, fades in once
          ready. When `htmlVisible` is false it is `position:absolute` so it
          doesn't push the plain-text layer down.
        */}
        {highlightedHtml && (
          <div
            className="shiki-container"
            style={{
              position: htmlVisible ? 'relative' : 'absolute',
              inset: htmlVisible ? 'auto' : '1rem 1.5rem',
              opacity: htmlVisible ? 1 : 0,
              transition: 'opacity 250ms ease',
              pointerEvents: htmlVisible ? 'auto' : 'none',
            }}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        )}
      </div>
    </div>
  );
}

export default CodeBlockShiki;
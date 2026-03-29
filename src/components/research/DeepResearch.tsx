/**
 * Deep Research Component
 * 
 * Perplexity-style research interface with real-time progress updates
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { getAuthToken } from '@/lib/auth';
import ReactMarkdown from 'react-markdown';
import './DeepResearch.css';

// ==================== Types ====================

interface Source {
  id: number;
  title: string;
  url: string;
}

interface Subtopic {
  name: string;
  description: string;
  questions?: string[];
}

interface ResearchPlan {
  title: string;
  mainTopic: string;
  subtopics: Subtopic[];
  expectedOutcome: string;
}

interface ResearchMetadata {
  query: string;
  duration: string;
  searchCount: number;
  citationCount: number;
  sourcesAnalyzed: number;
  timestamp: string;
}

interface ResearchResult {
  success: boolean;
  answer: string;
  sources: Source[];
  plan?: ResearchPlan;
  metadata: ResearchMetadata;
  error?: string;
}

interface ProgressUpdate {
  step: string;
  message: string;
  progress: number;
  userId?: string;
  query?: string;
  timestamp?: string;
  plan?: ResearchPlan;
}

interface ResearchProgress {
  step: string;
  message: string;
  progress: number;
  searchCount?: number;
  iteration?: number;
}

const DeepResearch: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [isResearching, setIsResearching] = useState<boolean>(false);
  const [progress, setProgress] = useState<ResearchProgress>({ step: '', message: '', progress: 0 });
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [researchPlan, setResearchPlan] = useState<ResearchPlan | null>(null);
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [planApproved, setPlanApproved] = useState<boolean>(false);
  const socketRef = React.useRef<any>(null);

  useEffect(() => {
    // Import socket.io-client dynamically
    import('socket.io-client').then(({ io }) => {
      const token = getAuthToken();
      if (!token) return;

      const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socket;

      // Listen for research plan
      socket.on('research:plan', (data: { plan: ResearchPlan }) => {
        console.log('Research plan received:', data.plan);
        setResearchPlan(data.plan);
        setShowPlanModal(true);
      });

      // Listen for research progress updates
      socket.on('research:progress', (data: ProgressUpdate) => {
        console.log('Research progress:', data);
        
        // Extract iteration and search count from message
        const iterationMatch = data.message.match(/iteration (\d+)/);
        const searchMatch = data.message.match(/(\d+) sources/);
        
        setProgress({
          step: data.step,
          message: data.message,
          progress: data.progress || 0,
          iteration: iterationMatch ? parseInt(iterationMatch[1]) : undefined,
          searchCount: searchMatch ? parseInt(searchMatch[1]) : undefined
        });
      });

      return () => {
        socket.off('research:plan');
        socket.off('research:progress');
        socket.disconnect();
      };
    });
  }, []);

  const handleResearch = async (): Promise<void> => {
    if (!query.trim()) return;

    setIsResearching(true);
    setError(null);
    setResult(null);
    setResearchPlan(null);
    setShowPlanModal(false);
    setPlanApproved(false);
    setProgress({ step: 'starting', message: '🚀 Starting research...', progress: 0 });

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const socketId = socketRef.current?.id;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const response = await fetch(`${API_URL}/api/research/agent/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: query.trim(),
          socketId
        })
      });

      const data: ResearchResult = await response.json();

      if (data.success) {
        setResult(data);
        setProgress({ step: 'completed', message: '✅ Research completed!', progress: 100 });
        setShowPlanModal(false);
      } else {
        setError(data.error || 'Research failed');
      }
    } catch (err) {
      console.error('Research error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to conduct research';
      setError(errorMessage);
    } finally {
      setIsResearching(false);
    }
  };

  const handleApprovePlan = () => {
    setPlanApproved(true);
    setShowPlanModal(false);
  };

  const handleCancelResearch = () => {
    setShowPlanModal(false);
    setIsResearching(false);
    setResearchPlan(null);
    setProgress({ step: '', message: '', progress: 0 });
  };

  const handleNewResearch = (): void => {
    setQuery('');
    setResult(null);
    setResearchPlan(null);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleResearch();
    }
  };

  return (
    <div className="deep-research-container">
      {!result && (
        <>
          <div className="research-header">
            <h1>🔬 Deep Research</h1>
            <p>AI-powered comprehensive research with iterative analysis</p>
          </div>

          <div className="research-input-section">
            <div className="input-wrapper">
              <textarea
                className="research-input"
                placeholder="Ask a research question... (e.g., What is data science and its applications?)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isResearching}
                rows={3}
              />
              <button
                className="research-button"
                onClick={handleResearch}
                disabled={isResearching || !query.trim()}
              >
                {isResearching ? '🔍 Researching...' : '🚀 Start Research'}
              </button>
            </div>

            {isResearching && !showPlanModal && (
              <div className="progress-section">
                <div className="progress-header">
                  <div className="progress-title">{progress.message}</div>
                  {progress.iteration && (
                    <div className="progress-stats">
                      Iteration {progress.iteration} · {progress.searchCount || 0} sources
                    </div>
                  )}
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                <div className="progress-steps">
                  <div className={`step ${progress.step === 'planning' || progress.progress >= 10 ? 'active' : ''}`}>
                    🧠 Planning
                  </div>
                  <div className={`step ${progress.step === 'searching' || progress.progress >= 25 ? 'active' : ''}`}>
                    🌐 Searching
                  </div>
                  <div className={`step ${progress.step === 'fetching' || progress.progress >= 45 ? 'active' : ''}`}>
                    📄 Reading
                  </div>
                  <div className={`step ${progress.step === 'analyzing' || progress.progress >= 65 ? 'active' : ''}`}>
                    🔍 Analyzing
                  </div>
                  <div className={`step ${progress.step === 'synthesizing' || progress.progress >= 90 ? 'active' : ''}`}>
                    ✍️ Writing
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              <span>{error}</span>
            </div>
          )}
        </>
      )}

      {/* Research Plan Modal */}
      {showPlanModal && researchPlan && (
        <div className="plan-modal-overlay">
          <div className="plan-modal">
            <div className="plan-header">
              <h2>📋 Research Plan</h2>
              <p className="plan-query">{query}</p>
            </div>
            
            <div className="plan-content">
              <div className="plan-title">{researchPlan.title}</div>
              <div className="plan-description">{researchPlan.mainTopic}</div>
              
              <div className="plan-subtopics">
                <h3>Topics to explore:</h3>
                {researchPlan.subtopics.map((subtopic, index) => (
                  <div key={index} className="subtopic-item">
                    <div className="subtopic-number">{index + 1}</div>
                    <div className="subtopic-content">
                      <div className="subtopic-name">{subtopic.name}</div>
                      <div className="subtopic-description">{subtopic.description}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="plan-outcome">
                <strong>Expected outcome:</strong> {researchPlan.expectedOutcome}
              </div>
            </div>
            
            <div className="plan-actions">
              <button className="plan-button cancel" onClick={handleCancelResearch}>
                Cancel
              </button>
              <button className="plan-button approve" onClick={handleApprovePlan}>
                Start Research
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Research Results */}
      {result && result.success && (
        <div className="research-results">
          <div className="results-header">
            <button className="new-research-button" onClick={handleNewResearch}>
              ← New Research
            </button>
            <div className="results-meta">
              <span className="results-query">{result.metadata.query}</span>
              <div className="results-stats">
                Research completed in {result.metadata.duration} · {result.metadata.citationCount} citations · {result.metadata.searchCount} searches
              </div>
            </div>
          </div>

          <div className="executive-summary">
            <div className="summary-header">
              <h2>Executive Summary</h2>
            </div>
            <div className="summary-content">
              <ReactMarkdown
                components={{
                  h2: ({node, ...props}) => <h2 className="section-heading" {...props} />,
                  h3: ({node, ...props}) => <h3 className="subsection-heading" {...props} />,
                  p: ({node, ...props}) => <p className="summary-paragraph" {...props} />,
                  ul: ({node, ...props}) => <ul className="summary-list" {...props} />,
                  ol: ({node, ...props}) => <ol className="summary-list" {...props} />,
                  a: ({node, ...props}) => <a className="citation-link" {...props} />
                }}
              >
                {result.answer}
              </ReactMarkdown>
            </div>
          </div>

          {result.sources && result.sources.length > 0 && (
            <div className="sources-section">
              <h3>📚 Sources ({result.sources.length})</h3>
              <div className="sources-grid">
                {result.sources.map((source) => (
                  <div key={source.id} className="source-card">
                    <div className="source-number">[{source.id}]</div>
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="source-link"
                    >
                      <div className="source-title">{source.title}</div>
                      <div className="source-url">{new URL(source.url).hostname}</div>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeepResearch;

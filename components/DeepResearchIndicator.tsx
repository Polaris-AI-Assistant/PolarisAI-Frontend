'use client';

import React from 'react';
import { Loader2, Search } from 'lucide-react';

/**
 * Search query tracked in the research feed
 */
export interface SearchQueryItem {
  id: string;
  text: string;         // Display text (prefix-stripped)
  rawText?: string;     // Full original query
  status: 'active' | 'done';
  sources: string[];    // Array of domains, added incrementally
  sourceCount?: number; // Final count when done
}

/**
 * Research phase with hierarchical structure
 */
export interface ResearchPhase {
  id: 'planning' | 'searching' | 'analyzing' | 'synthesizing';
  status: 'idle' | 'active' | 'done' | 'error';
  planTitle?: string;
  // Searching-specific:
  searchQueries?: SearchQueryItem[];
  replanningPoints?: number[];          // Indices after which replanning occurred
  totalSources?: number;
  totalSearches?: number;
  // Synthesizing-specific:
  wordCount?: number;
  // Legacy support (deprecated):
  action?: 'planning' | 'searching' | 'reading' | 'analyzing' | 'synthesizing';
  label?: string;
  detail?: string;
  doneLabel?: string;
  sources?: string[];  // For backward compat, shows in old format
}

interface DeepResearchIndicatorProps {
  phases: ResearchPhase[];
}

// Source chip component with staggered animation on entry
const SourceChip: React.FC<{ domain: string; index: number }> = ({ domain, index }) => (
  <span 
    className="inline-flex items-center gap-1 bg-neutral-800 border border-neutral-700 rounded-full px-2 py-0.5 text-xs text-neutral-400 animate-[chipIn_0.2s_ease]"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    {domain}
  </span>
);

// Individual search query row
const SearchQueryRow: React.FC<{ query: SearchQueryItem }> = ({ query }) => {
  const isActive = query.status === 'active';
  const sourceCount = query.sourceCount ?? query.sources.length;
  
  return (
    <div className="flex flex-col gap-1">
      {/* Query header row */}
      <div className="flex items-center gap-2">
        {/* Icon */}
        <div className="flex-shrink-0 w-3.5 h-3.5">
          {isActive ? (
            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '1s' }} />
          ) : (
            <Search className="w-3.5 h-3.5 text-neutral-500" />
          )}
        </div>
        
        {/* Query text */}
        <span className={`text-xs font-medium flex-1 max-w-[280px] truncate ${isActive ? 'text-white' : 'text-neutral-300'}`}>
          {query.text}
        </span>
        
        {/* Source count badge */}
        <span className="text-xs text-neutral-500 whitespace-nowrap">
          {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
        </span>
      </div>
      
      {/* Sources row */}
      {query.sources.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-5 mt-0.5">
          {query.sources.map((domain, index) => (
            <SourceChip key={`${query.id}-${domain}-${index}`} domain={domain} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

// Replanning indicator divider
const ReplanningDivider: React.FC = () => (
  <div className="flex items-center gap-2 py-1 pl-5">
    <div className="h-px flex-1 bg-neutral-700" />
    <span className="text-xs text-amber-500/70 px-2">Expanding research scope</span>
    <div className="h-px flex-1 bg-neutral-700" />
  </div>
);

// Phase indicator row
const PhaseRow: React.FC<{ phase: ResearchPhase; isSearching: boolean }> = ({ phase, isSearching }) => {
  const renderIcon = () => {
    switch (phase.status) {
      case 'idle':
        return <div className="w-2 h-2 rounded-full bg-neutral-600" />;
      case 'active':
        return (
          <Loader2 
            className="w-3.5 h-3.5 animate-spin" 
            style={{ color: phaseColors[phase.id], animationDuration: '1s' }}
          />
        );
      case 'done':
        return <div className="w-2 h-2 rounded-full bg-green-500" />;
      case 'error':
        return <div className="w-2 h-2 rounded-full bg-red-400" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-neutral-600" />;
    }
  };

  const getLabel = (): string => {
    const labels: Record<string, string> = {
      'planning': 'Planning',
      'searching': 'Researching',
      'analyzing': 'Analyzing',
      'synthesizing': 'Synthesizing',
    };
    return labels[phase.id] || phase.label || phase.id;
  };

  return (
    <div className="flex items-center gap-2 py-1">
      <div className="w-5 flex items-center justify-center flex-shrink-0">
        {renderIcon()}
      </div>
      <span className="text-sm font-medium text-neutral-300">
        {getLabel()}
      </span>
      {phase.status === 'done' && phase.totalSources !== undefined && phase.totalSearches !== undefined && (
        <span className="text-xs text-neutral-500 ml-auto">
          {phase.totalSearches} searches, {phase.totalSources} sources
        </span>
      )}
      {phase.status === 'done' && phase.wordCount !== undefined && (
        <span className="text-xs text-neutral-500 ml-auto">
          {phase.wordCount} words
        </span>
      )}
    </div>
  );
};

const phaseColors: Record<string, string> = {
  'planning': '#7F77DD',
  'searching': '#378ADD',
  'analyzing': '#BA7517',
  'synthesizing': '#D4537E',
};

export const DeepResearchIndicator: React.FC<DeepResearchIndicatorProps> = ({ phases }) => {
  return (
    <div className="ml-2 mt-2 mb-1 flex flex-col gap-2 border-l border-neutral-700 pl-3">
      {/* Render each phase */}
      {phases.map((phase) => (
        <div key={phase.id} className="flex flex-col gap-1">
          {/* Phase header row */}
          <PhaseRow phase={phase} isSearching={phase.id === 'searching'} />
          
          {/* Searching: show live search query feed */}
          {phase.id === 'searching' && phase.searchQueries && phase.searchQueries.length > 0 && (
            <div className="max-h-52 overflow-y-auto">
              <div className="ml-2 mt-1 border-l border-neutral-700 pl-3 flex flex-col gap-2">
                {phase.searchQueries.map((query, queryIndex) => {
                  // Check if replanning happened after this query
                  const replanningAfter = phase.replanningPoints?.includes(queryIndex);
                  
                  return (
                    <React.Fragment key={query.id}>
                      <SearchQueryRow query={query} />
                      {replanningAfter && <ReplanningDivider />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
      
      <style jsx>{`
        @keyframes chipIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default DeepResearchIndicator;

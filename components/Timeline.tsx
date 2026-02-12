'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Check, Clock, AlertCircle, Loader2, Sparkles, Calendar, FileText, Mail, Github, Map, Video, Table, Plane, Brain, Bot, Wrench, MessageSquare, Database, CheckCircle, XCircle } from 'lucide-react';

// Timeline event types matching backend
export type TimelineEventType = 
  // Processing phases (real-time backend operations)
  | 'timeline_memory_searching'
  | 'timeline_memory_retrieved'
  | 'timeline_memory_stored'
  | 'timeline_artifact_scanning'
  | 'timeline_artifact_resolved'
  | 'timeline_analyzing_query'
  | 'timeline_analysis_complete'
  // Agent lifecycle
  | 'timeline_plan'
  | 'timeline_agent_added'
  | 'timeline_agent_executing'
  | 'timeline_agent_completed'
  | 'timeline_agent_failed'
  | 'timeline_narrative'
  // Tool execution
  | 'timeline_tool_started'
  | 'timeline_tool_completed'
  | 'timeline_tool_failed'
  // Confirmation
  | 'timeline_confirmation_required'
  | 'timeline_confirmation_received'
  // Response generation
  | 'timeline_generating_response'
  // Completion
  | 'timeline_task_completed'
  | 'timeline_task_failed';

export interface TimelineEvent {
  eventId: string;
  type: TimelineEventType;
  timestamp: string;
  message?: string;
  agentName?: string;
  agentIcon?: string;
  agentDisplayName?: string;
  toolName?: string;
  toolDisplayName?: string;
  query?: string;
  result?: any;
  data?: any;
  summary?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'failed' | 'needs_input';
  needsClarification?: boolean;
}

// Agent icon mapping
const getAgentIcon = (agentName: string) => {
  const icons: Record<string, React.ReactNode> = {
    calendar: <Calendar className="w-4 h-4" />,
    docs: <FileText className="w-4 h-4" />,
    gmail: <Mail className="w-4 h-4" />,
    github: <Github className="w-4 h-4" />,
    maps: <Map className="w-4 h-4" />,
    meet: <Video className="w-4 h-4" />,
    sheets: <Table className="w-4 h-4" />,
    flights: <Plane className="w-4 h-4" />,
    forms: <FileText className="w-4 h-4" />,
    microsoft: <Bot className="w-4 h-4" />,
  };
  return icons[agentName?.toLowerCase()] || <Bot className="w-4 h-4" />;
};

// Event type icon mapping
const getEventIcon = (type: TimelineEventType) => {
  switch (type) {
    // Processing phases
    case 'timeline_memory_searching':
    case 'timeline_memory_retrieved':
    case 'timeline_memory_stored':
      return <Database className="w-4 h-4" />;
    case 'timeline_artifact_scanning':
    case 'timeline_artifact_resolved':
      return <FileText className="w-4 h-4" />;
    case 'timeline_analyzing_query':
    case 'timeline_analysis_complete':
      return <Brain className="w-4 h-4" />;
    case 'timeline_generating_response':
      return <MessageSquare className="w-4 h-4" />;
    // Planning
    case 'timeline_plan':
      return <Sparkles className="w-4 h-4" />;
    case 'timeline_narrative':
      return <MessageSquare className="w-4 h-4" />;
    // Agents
    case 'timeline_agent_added':
    case 'timeline_agent_executing':
      return <Bot className="w-4 h-4" />;
    case 'timeline_agent_completed':
      return <CheckCircle className="w-4 h-4" />;
    case 'timeline_agent_failed':
      return <XCircle className="w-4 h-4" />;
    // Tools
    case 'timeline_tool_started':
    case 'timeline_tool_completed':
      return <Wrench className="w-4 h-4" />;
    case 'timeline_tool_failed':
      return <AlertCircle className="w-4 h-4" />;
    // Confirmation
    case 'timeline_confirmation_required':
    case 'timeline_confirmation_received':
      return <Clock className="w-4 h-4" />;
    // Completion
    case 'timeline_task_completed':
      return <Check className="w-4 h-4" />;
    case 'timeline_task_failed':
      return <AlertCircle className="w-4 h-4" />;
    default:
      return <Bot className="w-4 h-4" />;
  }
};

// Status dot component
interface StatusDotProps {
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'needs_input';
  animate?: boolean;
}

const StatusDot: React.FC<StatusDotProps> = ({ status, animate = false }) => {
  const baseClasses = "w-3 h-3 rounded-full flex-shrink-0";
  
  switch (status) {
    case 'completed':
      return <div className={`${baseClasses} bg-green-400`} />;
    case 'in-progress':
      return (
        <div className={`${baseClasses} bg-yellow-400 ${animate ? 'animate-pulse' : ''}`} />
      );
    case 'failed':
      return <div className={`${baseClasses} bg-red-400`} />;
    case 'needs_input':
      return <div className={`${baseClasses} bg-orange-400`} />;
    case 'pending':
    default:
      return <div className={`${baseClasses} bg-neutral-600`} />;
  }
};

// Single timeline step component
interface TimelineStepProps {
  event: TimelineEvent;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}

const TimelineStep: React.FC<TimelineStepProps> = ({ event, isExpanded, onToggle, isLast }) => {
  // Determine status based on event type
  const getStatus = (): 'pending' | 'in-progress' | 'completed' | 'failed' => {
    // Check explicit status first (handle both backend format and frontend format)
    const statusStr = event.status as string;
    if (statusStr === 'in_progress' || statusStr === 'in-progress') return 'in-progress';
    if (event.status === 'completed') return 'completed';
    if (event.status === 'failed') return 'failed';
    
    // Infer from event type
    if (event.type.includes('failed')) return 'failed';
    if (event.type.includes('completed') || event.type.includes('resolved') || event.type.includes('retrieved')) return 'completed';
    if (event.type.includes('searching') || event.type.includes('scanning') || event.type.includes('analyzing') || event.type.includes('generating')) return 'in-progress';
    if (event.type.includes('executing') || event.type.includes('started')) return 'in-progress';
    if (event.type === 'timeline_agent_added' || event.type === 'timeline_analysis_complete') return 'completed';
    if (event.type === 'timeline_narrative' || event.type === 'timeline_plan') return 'completed';
    if (event.type === 'timeline_memory_stored') return 'completed';
    return 'pending';
  };

  const status = event.status || getStatus();

  // Get display text based on event type - always use real data from backend
  const getDisplayText = () => {
    switch (event.type) {
      // Processing phases - show actual message from backend
      case 'timeline_memory_searching':
        return event.message || 'Searching long-term memory...';
      case 'timeline_memory_retrieved':
        return event.message || 'Memory search complete';
      case 'timeline_artifact_scanning':
        return event.message || 'Scanning conversation artifacts...';
      case 'timeline_artifact_resolved':
        return event.message || 'Artifact scan complete';
      case 'timeline_analyzing_query':
        return event.message || 'Analyzing request with AI...';
      case 'timeline_analysis_complete':
        return event.message || 'Analysis complete';
      case 'timeline_generating_response':
        return event.message || 'Generating response...';
      case 'timeline_plan':
        return event.message || 'Plan created';
      case 'timeline_narrative':
        return event.message || 'Processing...';
      case 'timeline_agent_added':
        return `Added ${event.agentDisplayName || event.agentName || 'agent'}`;
      case 'timeline_agent_executing':
        return `${event.agentDisplayName || event.agentName || 'Agent'} is processing...`;
      case 'timeline_agent_completed':
        // Check if needs clarification
        if (event.status === 'needs_input' || event.needsClarification) {
          return `${event.agentDisplayName || event.agentName || 'Agent'} needs your input`;
        }
        return `${event.agentDisplayName || event.agentName || 'Agent'} completed successfully`;
      case 'timeline_agent_failed':
        return `${event.agentDisplayName || event.agentName || 'Agent'} encountered an error`;
      case 'timeline_tool_started':
        return `Running ${event.toolDisplayName || event.toolName || 'tool'}...`;
      case 'timeline_tool_completed':
        return `${event.toolDisplayName || event.toolName || 'Tool'} completed`;
      case 'timeline_tool_failed':
        return `${event.toolDisplayName || event.toolName || 'Tool'} failed`;
      case 'timeline_memory_retrieved':
        return event.message || 'Retrieved relevant memories';
      case 'timeline_memory_stored':
        return event.message || 'Stored new memory';
      case 'timeline_confirmation_required':
        return 'Waiting for confirmation...';
      case 'timeline_confirmation_received':
        return 'Confirmation received';
      case 'timeline_task_completed':
        // Check if awaiting user response
        if (event.status === 'needs_input') {
          return 'Awaiting your response';
        }
        return event.summary || 'Task completed successfully';
      case 'timeline_task_failed':
        return event.message || 'Task failed';
      default:
        return event.message || 'Processing...';
    }
  };

  // Get the appropriate icon
  const getIcon = () => {
    if (event.agentName) {
      return getAgentIcon(event.agentName);
    }
    return getEventIcon(event.type);
  };

  // Check if this step has expandable details
  const hasDetails = event.query || event.result || event.data;

  return (
    <div className="relative flex gap-3">
      {/* Vertical line connector */}
      {!isLast && (
        <div 
          className="absolute left-[5.5px] top-6 w-0.5 h-[calc(100%-12px)] bg-neutral-700"
        />
      )}
      
      {/* Status dot */}
      <div className="relative z-10 mt-1">
        <StatusDot status={status} animate={status === 'in-progress'} />
      </div>
      
      {/* Content */}
      <div className="flex-1 pb-4">
        <button
          onClick={hasDetails ? onToggle : undefined}
          className={`flex items-start gap-2 w-full text-left ${hasDetails ? 'cursor-pointer hover:bg-neutral-800/50 rounded-lg p-1 -m-1' : ''}`}
          disabled={!hasDetails}
        >
          {/* Icon */}
          <span className={`flex-shrink-0 mt-0.5 ${
            status === 'completed' ? 'text-green-400' :
            status === 'in-progress' ? 'text-yellow-400' :
            status === 'failed' ? 'text-red-400' :
            status === 'needs_input' ? 'text-orange-400' :
            'text-neutral-500'
          }`}>
            {status === 'in-progress' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : status === 'needs_input' ? (
              <MessageSquare className="w-4 h-4" />
            ) : (
              getIcon()
            )}
          </span>
          
          {/* Text */}
          <span className={`text-sm flex-1 ${
            status === 'completed' ? 'text-neutral-300' :
            status === 'in-progress' ? 'text-white font-medium' :
            status === 'failed' ? 'text-red-400' :
            'text-neutral-500'
          }`}>
            {getDisplayText()}
          </span>
          
          {/* Expand/collapse chevron */}
          {hasDetails && (
            <span className="text-neutral-500 flex-shrink-0">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          )}
        </button>
        
        {/* Expanded details */}
        {isExpanded && hasDetails && (
          <div className="mt-2 ml-6 p-3 bg-neutral-800/50 rounded-lg text-xs font-mono">
            {event.query && (
              <div className="mb-2">
                <span className="text-neutral-500">Query: </span>
                <span className="text-neutral-300">{event.query}</span>
              </div>
            )}
            {event.result && (
              <div className="mb-2">
                <span className="text-neutral-500">Result: </span>
                <pre className="text-neutral-300 whitespace-pre-wrap overflow-x-auto">
                  {typeof event.result === 'string' ? event.result : JSON.stringify(event.result, null, 2)}
                </pre>
              </div>
            )}
            {event.data && (
              <div>
                <span className="text-neutral-500">Data: </span>
                <pre className="text-neutral-300 whitespace-pre-wrap overflow-x-auto">
                  {typeof event.data === 'string' ? event.data : JSON.stringify(event.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Timeline container component
interface TimelineContainerProps {
  events: TimelineEvent[];
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  className?: string;
}

export const TimelineContainer: React.FC<TimelineContainerProps> = ({ 
  events, 
  isVisible = true,
  onToggleVisibility,
  className = ''
}) => {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest event
  useEffect(() => {
    if (containerRef.current && events.length > 0) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  const toggleEvent = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden ${className}`}>
      {/* Header with toggle */}
      <div 
        className="flex items-center justify-between px-4 py-2 bg-neutral-800/50 border-b border-neutral-800 cursor-pointer hover:bg-neutral-800"
        onClick={onToggleVisibility}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-neutral-200">
            Execution Progress
          </span>
          <span className="text-xs text-neutral-500">
            ({events.length} {events.length === 1 ? 'step' : 'steps'})
          </span>
        </div>
        <button className="text-neutral-400 hover:text-neutral-200">
          {isVisible ? (
            <span className="text-xs flex items-center gap-1">
              Hide steps <ChevronUp className="w-3 h-3" />
            </span>
          ) : (
            <span className="text-xs flex items-center gap-1">
              Show steps <ChevronDown className="w-3 h-3" />
            </span>
          )}
        </button>
      </div>
      
      {/* Timeline content */}
      {isVisible && (
        <div 
          ref={containerRef}
          className="p-4 max-h-80 overflow-y-auto bg-neutral-900"
        >
          {events.map((event, index) => (
            <TimelineStep
              key={event.eventId}
              event={event}
              isExpanded={expandedEvents.has(event.eventId)}
              onToggle={() => toggleEvent(event.eventId)}
              isLast={index === events.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TimelineContainer;

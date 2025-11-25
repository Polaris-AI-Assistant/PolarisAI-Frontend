'use client';

import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: black;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #262626;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #404040;
  }
`;
import { isAuthenticated, getStoredUser } from '../../lib/auth';
import {
  processQuery,
  processQueryStreaming,
  StreamChunk,
  getAgentExamples,
  checkAgentHealth,
  formatAgentName,
  getAgentIcon,
  getAgentColor,
  AgentResponse,
  ConversationMessage,
} from '../../lib/mainAgent';
import {
  ChatMessage,
  ChatSession,
  createNewChatSession,
  getChatSession,
  updateChatSession,
  deleteChatSession,
  renameChatSession,
  getGroupedChatSessions,
  migrateOldConversation,
  GroupedChats,
} from '../../lib/chatHistory';
import { VercelV0Chat } from '@/components/ui/v0-ai-chat';
import { TwoLevelSidebar } from '@/components/ui/sidebar-component';
import { ThinkingIndicator } from '@/components/ui/thinking-indicator';
import { CallbackWrapper } from '@/components/ui/callback-wrapper';
import { Calendar, FileText, ClipboardList, Github, Video, Sheet } from 'lucide-react';
import { EventCard } from '@/components/ui/event-card';

// Helper function to format markdown-style text
const formatMessageContent = (content: string) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inListItem = false; // Track if we're inside a numbered list item
  
  lines.forEach((line, lineIndex) => {
    // Empty lines
    if (line.trim() === '') {
      elements.push(<div key={`br-${lineIndex}`} className="h-3" />);
      inListItem = false;
      return;
    }
    
    // Check if line is a numbered list (e.g., "1.", "2.", etc.)
    const numberedListMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberedListMatch) {
      const [, number, restOfLine] = numberedListMatch;
      inListItem = true;
      elements.push(
        <div key={lineIndex} className="flex gap-3 mb-2 mt-3">
          <span className="text-gray-400 font-medium min-w-[24px] flex-shrink-0">{number}.</span>
          <div className="flex-1 text-white">{parseInlineFormatting(restOfLine)}</div>
        </div>
      );
      return;
    }
    
    // Check if line is a bullet list - match with any amount of leading whitespace
    const bulletMatch = line.match(/^(\s*)[\-•]\s+(.+)$/);
    if (bulletMatch) {
      const [, , restOfLine] = bulletMatch;
      
      // All bullets after a numbered item should be indented
      elements.push(
        <div key={lineIndex} className="flex gap-2 ml-8 mb-1">
          <span className="text-gray-500 flex-shrink-0 mt-0.5">•</span>
          <div className="flex-1 text-gray-300 text-[15px]">{parseInlineFormatting(restOfLine)}</div>
        </div>
      );
      return;
    }
    
    // Regular line
    inListItem = false;
    elements.push(
      <div key={lineIndex} className="mb-2 text-gray-200">
        {parseInlineFormatting(line)}
      </div>
    );
  });
  
  return elements;
};

// Helper function to parse inline formatting (bold, links)
const parseInlineFormatting = (text: string) => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  
  while (remaining.length > 0) {
    // Match link: [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const [fullMatch, linkText, url] = linkMatch;
      const index = remaining.indexOf(fullMatch);
      
      // Add text before link
      if (index > 0) {
        const beforeText = remaining.slice(0, index);
        parts.push(...parseBoldText(beforeText, key++));
      }
      
      // Add link
      parts.push(
        <a
          key={`link-${key++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
        >
          {linkText}
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      );
      
      remaining = remaining.slice(index + fullMatch.length);
      continue;
    }
    
    // No more links, parse remaining for bold
    parts.push(...parseBoldText(remaining, key++));
    break;
  }
  
  return parts;
};

// Helper function to parse bold text
const parseBoldText = (text: string, baseKey: number | string) => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    if (boldMatch) {
      const [fullMatch, boldText] = boldMatch;
      const index = remaining.indexOf(fullMatch);
      
      // Add text before bold
      if (index > 0) {
        parts.push(remaining.slice(0, index));
      }
      
      // Add bold text
      parts.push(
        <strong key={`${baseKey}-bold-${key++}`} className="font-semibold text-white">
          {boldText}
        </strong>
      );
      
      remaining = remaining.slice(index + fullMatch.length);
      continue;
    }
    
    // No more bold, add remaining text
    if (remaining) {
      parts.push(remaining);
    }
    break;
  }
  
  return parts;
};

// Helper function to extract event information from message
const extractEventInfo = (content: string) => {
  // Check if the message contains event/meeting keywords (but NOT forms)
  const hasEventKeywords = /created|scheduled|event|meeting|google meet/i.test(content);
  const isFormRelated = /form|survey|questionnaire|google forms/i.test(content);
  
  // Don't show card for forms - only for calendar events and meetings
  if (!hasEventKeywords || isFormRelated) return null;

  // Try to extract event details using various patterns
  const eventInfo: any = {};

  // Extract title (look for "Event Title" section or bold text near the start)
  // Clean up any markdown formatting
  const titleMatch = content.match(/Event Title[:\s]+\*\*([^*\n]+)\*\*/i) ||
                     content.match(/Event Title[:\s]+([^\n]+)/i) || 
                     content.match(/(?:created|scheduled)\s+(?:event|meeting)[:\s]+["']?([^"'\n]+)["']?/i) ||
                     content.match(/^\*\*([^*]+)\*\*/m);
  if (titleMatch) {
    eventInfo.title = titleMatch[1].trim().replace(/\*\*/g, '');
  }

  // Extract date - look for clean date format without time
  const dateMatch = content.match(/(?:Date & Time|Date)[:\s]+([A-Za-z]+,\s+[A-Za-z]+\s+\d{1,2},\s+\d{4})/i) ||
                    content.match(/((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,\s+\w+\s+\d{1,2},\s+\d{4})/i) ||
                    content.match(/(\w+,\s+\w+\s+\d{1,2},\s+\d{4})/i) ||
                    content.match(/(\w+\s+\d{1,2},\s+\d{4})/);
  if (dateMatch) {
    eventInfo.date = dateMatch[1].trim().replace(/\*\*/g, '');
  }

  // Extract time - look for time range only (without date)
  const timeMatch = content.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)\s*(?:GMT[+\-]\d+:\d+)?\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM)\s*(?:GMT[+\-]\d+:\d+)?)/i);
  if (timeMatch) {
    eventInfo.time = timeMatch[1].trim().replace(/\*\*/g, '');
  }

  // Extract duration - clean up formatting
  const durationMatch = content.match(/Duration[:\s]+([^\n]+)/i) ||
                        content.match(/\*\*\s*(\d+\s*(?:hour|hr|minute|min)s?)\s*\*\*/i);
  if (durationMatch) {
    let duration = durationMatch[1].trim().replace(/\*\*/g, '');
    // Normalize duration format
    duration = duration.replace(/\bhr\b/gi, 'hour').replace(/\bmin\b/gi, 'minute');
    // Add 's' for plural if needed
    if (!duration.match(/hours?|minutes?/i)) {
      duration = duration.replace(/(\d+)\s*(hour|minute)/gi, (match, num, unit) => {
        return parseInt(num) > 1 ? `${num} ${unit}s` : `${num} ${unit}`;
      });
    }
    eventInfo.duration = `Duration: ${duration}`;
  }

  // Extract location/meet link
  const meetLinkMatch = content.match(/https:\/\/meet\.google\.com\/[a-z0-9\-]+/i);
  if (meetLinkMatch) {
    eventInfo.meetLink = meetLinkMatch[0];
    eventInfo.location = meetLinkMatch[0];
  } else {
    const locationMatch = content.match(/Location[:\s]+([^\n]+)/i);
    if (locationMatch) {
      eventInfo.location = locationMatch[1].trim();
    }
  }

  // Extract attendees - improved to capture all attendees
  const attendeesMatch = content.match(/Attendees[:\s]+\((\d+)\)[:\s]*\n?([^\n]+(?:\n(?!Location|Date|Event)[^\n]+)*)/i);
  if (attendeesMatch) {
    const attendeesText = attendeesMatch[2];
    // Split by comma or newline and filter out empty strings
    const attendeesList = attendeesText
      .split(/[,\n]/)
      .map(a => a.trim())
      .filter(a => a && a.includes('@'));
    eventInfo.attendees = attendeesList;
  }

  // Only return if we have at least title or date+time
  if (eventInfo.title || (eventInfo.date && eventInfo.time)) {
    return eventInfo;
  }

  return null;
};

function MainAgentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState('Thinking...');
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [examples, setExamples] = useState<any>(null);
  const [showExamples, setShowExamples] = useState(true);
  const [agentHealth, setAgentHealth] = useState<any>(null);
  const [groupedChats, setGroupedChats] = useState<GroupedChats>({
    today: [],
    yesterday: [],
    lastWeek: [],
    lastMonth: [],
    older: [],
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamingContentRef = useRef<string>('');
  const metadataRef = useRef<{ agentsUsed?: string[], processingTime?: string }>({});

  // Initialize or load chat session
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/signin');
      return;
    }

    // Initialize chat system
    const initializeChat = async () => {
      // Migrate old conversation data if exists
      await migrateOldConversation();

      // Load examples and health check
      loadExamplesAndHealth();

      // Check for chatId in URL params
      const chatIdFromUrl = searchParams.get('chatId');
      
      if (chatIdFromUrl) {
        // Load existing chat
        await loadChatSession(chatIdFromUrl);
      } else {
        // Create new chat session
        const newSession = await createNewChatSession();
        if (newSession) {
          setCurrentChatId(newSession.id);
          setMessages([]);
          setShowExamples(true);
          // Update URL without reload
          window.history.replaceState({}, '', `/agent?chatId=${newSession.id}`);
        }
      }

      // Load chat history for sidebar
      await loadChatHistory();
    };

    initializeChat();
  }, [router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  useEffect(() => {
    // Auto-scroll when streaming
    if (streamingMessageId) {
      scrollToBottom();
    }
  }, [streamingMessageId, messages]);

  useEffect(() => {
    // Save conversation whenever messages change
    const updateChat = async () => {
      if (currentChatId && messages.length > 0) {
        await updateChatSession(currentChatId, messages);
        await loadChatHistory(); // Refresh sidebar
      }
    };
    
    updateChat();
  }, [messages, currentChatId]);

  const loadExamplesAndHealth = async () => {
    try {
      const [examplesData, healthData] = await Promise.all([
        getAgentExamples(),
        checkAgentHealth(),
      ]);
      setExamples(examplesData);
      setAgentHealth(healthData);
    } catch (error) {
      console.error('Error loading examples/health:', error);
    }
  };

  const loadChatHistory = async () => {
    const grouped = await getGroupedChatSessions();
    setGroupedChats(grouped);
  };

  const loadChatSession = async (chatId: string) => {
    const session = await getChatSession(chatId);
    if (session) {
      setCurrentChatId(session.id);
      setMessages(session.messages);
      setShowExamples(session.messages.length === 0);
    } else {
      // Chat not found, create new one
      const newSession = await createNewChatSession();
      if (newSession) {
        setCurrentChatId(newSession.id);
        setMessages([]);
        setShowExamples(true);
        window.history.replaceState({}, '', `/agent?chatId=${newSession.id}`);
      }
    }
  };

  const handleNewChat = async () => {
    const newSession = await createNewChatSession();
    if (newSession) {
      setCurrentChatId(newSession.id);
      setMessages([]);
      setShowExamples(true);
      setInput('');
      await loadChatHistory();
      window.history.pushState({}, '', `/agent?chatId=${newSession.id}`);
    }
  };

  const handleChatSelect = async (chatId: string) => {
    if (chatId === currentChatId) return;
    window.history.pushState({}, '', `/agent?chatId=${chatId}`);
    await loadChatSession(chatId);
    await loadChatHistory();
  };

  const handleDeleteChat = async (chatId: string) => {
    if (confirm('Delete this chat?')) {
      const success = await deleteChatSession(chatId);
      if (success) {
        await loadChatHistory();
        
        // If deleting current chat, create new one
        if (chatId === currentChatId) {
          await handleNewChat();
        }
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (queryText?: string) => {
    const query = queryText || input.trim();
    
    if (!query || isLoading) return;

    setInput('');
    setShowExamples(false);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setIsThinking(true);
    setThinkingMessage('Thinking...');
    
    // Create a placeholder for the assistant's streaming message
    const assistantMessageId = (Date.now() + 1).toString();
    setStreamingMessageId(assistantMessageId);
    streamingContentRef.current = '';
    metadataRef.current = {};
    
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, assistantMessage]);
    
    try {
      // Build conversation history
      const conversationHistory: ConversationMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Process query with streaming
      await processQueryStreaming(query, conversationHistory, (chunk: StreamChunk) => {
        switch (chunk.type) {
          case 'thinking':
            setIsThinking(chunk.status === 'start');
            break;
            
          case 'status':
            setThinkingMessage(chunk.message || 'Processing...');
            break;
            
          case 'analysis':
            // Could show which agents are being used
            if (chunk.agents) {
              metadataRef.current.agentsUsed = chunk.agents;
            }
            break;
            
          case 'content':
            // Append streaming text
            if (chunk.text) {
              streamingContentRef.current += chunk.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: streamingContentRef.current }
                    : m
                )
              );
            }
            break;
            
          case 'metadata':
            // Store metadata for final message
            metadataRef.current = {
              agentsUsed: chunk.agentsUsed,
              processingTime: chunk.processingTime,
            };
            break;
            
          case 'error':
            throw new Error(chunk.error || chunk.message || 'Unknown error');
            
          case 'done':
            // Finalize the message with metadata
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: streamingContentRef.current,
                      agentsUsed: metadataRef.current.agentsUsed,
                      processingTime: metadataRef.current.processingTime,
                    }
                  : m
              )
            );
            break;
        }
      });

    } catch (error: any) {
      // Check if it's an authentication error
      if (error.message && (error.message.includes('Session expired') || error.message.includes('Authentication required'))) {
        router.push('/auth/signin');
        return;
      }
      
      // Update the streaming message with error
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: `Error: ${error.message || 'Failed to process your request. Please try again.'}`,
                isError: true,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      setIsThinking(false);
      setStreamingMessageId(null);
      streamingContentRef.current = '';
      metadataRef.current = {};
      inputRef.current?.focus();
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden fixed inset-0">
      {/* New Two-Level Sidebar - Always Visible */}
      <TwoLevelSidebar
        chats={[
          ...groupedChats.today,
          ...groupedChats.yesterday,
          ...groupedChats.lastWeek,
          ...groupedChats.lastMonth,
          ...groupedChats.older,
        ]}
        currentChatId={currentChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onDashboardClick={() => router.push('/dashboard')}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-black overflow-hidden h-full">

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-black overflow-hidden h-full">
          {/* Welcome Screen with centered input (shown when no messages) */}
          {showExamples && messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center w-full px-4">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-white mb-3">
                  How can we help you today?
                </h2>
              </div>
              
              {/* Centered Input - Narrower width */}
              <div className="w-full max-w-3xl">
                <VercelV0Chat
                  value={input}
                  onChange={setInput}
                  onSubmit={handleSendMessage}
                  placeholder="Ask me anything... (e.g., 'schedule a meeting and create a document')"
                  disabled={isLoading}
                  showExamples={true}
                  examples={[
                    {
                      icon: <Calendar className="w-4 h-4" />,
                      label: "Schedule Meeting",
                      onClick: () => handleExampleClick("Schedule a meeting tomorrow at 2pm"),
                    },
                    {
                      icon: <FileText className="w-4 h-4" />,
                      label: "Create Document",
                      onClick: () => handleExampleClick("Create a new document"),
                    },
                    {
                      icon: <ClipboardList className="w-4 h-4" />,
                      label: "Create Form",
                      onClick: () => handleExampleClick("Create a feedback form"),
                    },
                    {
                      icon: <Github className="w-4 h-4" />,
                      label: "GitHub Repos",
                      onClick: () => handleExampleClick("Show my GitHub repositories"),
                    },
                    {
                      icon: <Video className="w-4 h-4" />,
                      label: "Schedule Meet",
                      onClick: () => handleExampleClick("Schedule a video call"),
                    },
                  ]}
                />
                <p className="text-xs text-gray-600 mt-3 text-center">
                  {isLoading ? 'Processing your request...' : 'The Main Agent can coordinate multiple services in a single query'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Messages - Scrollable Area */}
              <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
                <style>{scrollbarStyles}</style>
                <div className="max-w-4xl mx-auto space-y-6 w-full">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                {message.role === 'user' ? (
                  // User message - styled box
                  <div className="max-w-3xl rounded-2xl px-6 py-2 bg-neutral-900 border border-neutral-800">
                    <div 
                      className="whitespace-pre-wrap"
                      style={{ 
                        fontFamily: 'Inter, "Inter Fallback"',
                        fontSize: '16px',
                        lineHeight: '26px',
                        fontWeight: 400,
                        letterSpacing: 'normal',
                        color: '#F1F2F5'
                      }}
                    >
                      {message.content}
                    </div>
                  </div>
                ) : message.isError ? (
                  // Error message - styled box
                  <div className="max-w-3xl rounded-2xl px-6 py-2 bg-red-500/10 border border-red-500/30 text-red-400">
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                ) : (
                  // AI message - no box, just content
                  <div className="max-w-3xl">
                    {/* Check if message contains event info and render EventCard */}
                    {(() => {
                      const eventInfo = extractEventInfo(message.content);
                      return eventInfo ? (
                        <EventCard
                          title={eventInfo.title || 'Event'}
                          date={eventInfo.date || ''}
                          time={eventInfo.time || ''}
                          duration={eventInfo.duration}
                          location={eventInfo.location}
                          meetLink={eventInfo.meetLink}
                          attendees={eventInfo.attendees}
                        />
                      ) : null;
                    })()}
                    
                    <div 
                      style={{ 
                        fontFamily: 'Inter, "Inter Fallback"',
                        fontSize: '16px',
                        lineHeight: '26px',
                        fontWeight: 400,
                        letterSpacing: 'normal',
                        color: '#F1F2F5'
                      }}
                    >
                      {formatMessageContent(message.content)}
                    </div>
                    
                    {/* Metadata */}
                    <div className="mt-3 pt-3 border-t border-neutral-800/30 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        {message.agentsUsed && message.agentsUsed.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">Agents:</span>
                            {message.agentsUsed.map((agent: string) => (
                              <span
                                key={agent}
                                className="px-2 py-1 rounded-full bg-neutral-800 text-gray-400"
                              >
                                {getAgentIcon(agent)} {formatAgentName(agent)}
                              </span>
                            ))}
                          </div>
                        )}
                        {message.processingTime && (
                          <span className="text-gray-500">
                            ⚡ {message.processingTime}
                          </span>
                        )}
                      </div>
                      <span className="text-gray-500">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Thinking Indicator - Sleek OpenAI-style */}
            {isThinking && (
              <div className="flex justify-start max-w-3xl mb-4">
                <ThinkingIndicator message={thinkingMessage} />
              </div>
            )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
          
              {/* Input Area (Fixed at bottom when messages exist) */}
              <div className="bg-black p-6">
                <div className="max-w-3xl mx-auto">
                  <VercelV0Chat
                    value={input}
                    onChange={setInput}
                    onSubmit={handleSendMessage}
                    placeholder="Ask me anything... (e.g., 'schedule a meeting and create a document')"
                    disabled={isLoading}
                    showExamples={false}
                  />
                  <p className="text-xs text-gray-600 mt-3 text-center">
                    {isLoading ? 'Processing your request...' : 'The Main Agent can coordinate multiple services in a single query'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MainAgentPage() {
  return (
    <CallbackWrapper>
      <MainAgentPageContent />
    </CallbackWrapper>
  );
}

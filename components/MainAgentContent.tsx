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

import { isAuthenticated } from '../lib/auth';
import {
  processQueryStreaming,
  StreamChunk,
  getAgentExamples,
  checkAgentHealth,
  formatAgentName,
  getAgentIcon,
  ConversationMessage,
} from '../lib/mainAgent';
import {
  ChatMessage,
  createNewChatSession,
  getChatSession,
  updateChatSession,
  deleteChatSession,
  getGroupedChatSessions,
  migrateOldConversation,
  GroupedChats,
} from '../lib/chatHistory';
import { VercelV0Chat } from '@/components/ui/v0-ai-chat';
import { ThinkingIndicator } from '@/components/ui/thinking-indicator';
import { Calendar, FileText, ClipboardList, Github, Video } from 'lucide-react';
import { EventCard } from '@/components/ui/event-card';

// Helper function to format markdown-style text
const formatMessageContent = (content: string) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inListItem = false;
  
  lines.forEach((line, lineIndex) => {
    if (line.trim() === '') {
      elements.push(<div key={`br-${lineIndex}`} className="h-3" />);
      inListItem = false;
      return;
    }
    
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
    
    const bulletMatch = line.match(/^(\s*)[\-•]\s+(.+)$/);
    if (bulletMatch) {
      const [, , restOfLine] = bulletMatch;
      
      elements.push(
        <div key={lineIndex} className="flex gap-2 ml-8 mb-1">
          <span className="text-gray-500 flex-shrink-0 mt-0.5">•</span>
          <div className="flex-1 text-gray-300 text-[15px]">{parseInlineFormatting(restOfLine)}</div>
        </div>
      );
      return;
    }
    
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
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const [fullMatch, linkText, url] = linkMatch;
      const index = remaining.indexOf(fullMatch);
      
      if (index > 0) {
        const beforeText = remaining.slice(0, index);
        parts.push(...parseBoldText(beforeText, key++));
      }
      
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
      
      if (index > 0) {
        parts.push(remaining.slice(0, index));
      }
      
      parts.push(
        <strong key={`${baseKey}-bold-${key++}`} className="font-semibold text-white">
          {boldText}
        </strong>
      );
      
      remaining = remaining.slice(index + fullMatch.length);
      continue;
    }
    
    if (remaining) {
      parts.push(remaining);
    }
    break;
  }
  
  return parts;
};

// Helper function to extract event information from message
const extractEventInfo = (content: string) => {
  const hasEventKeywords = /created|scheduled|event|meeting|google meet/i.test(content);
  const isFormRelated = /form|survey|questionnaire|google forms/i.test(content);
  
  if (!hasEventKeywords || isFormRelated) return null;

  const eventInfo: any = {};

  const titleMatch = content.match(/Event Title[:\s]+\*\*([^*\n]+)\*\*/i) ||
                     content.match(/Event Title[:\s]+([^\n]+)/i) || 
                     content.match(/(?:created|scheduled)\s+(?:event|meeting)[:\s]+["']?([^"'\n]+)["']?/i) ||
                     content.match(/^\*\*([^*]+)\*\*/m);
  if (titleMatch) {
    eventInfo.title = titleMatch[1].trim().replace(/\*\*/g, '');
  }

  const dateMatch = content.match(/(?:Date & Time|Date)[:\s]+([A-Za-z]+,\s+[A-Za-z]+\s+\d{1,2},\s+\d{4})/i) ||
                    content.match(/((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,\s+\w+\s+\d{1,2},\s+\d{4})/i) ||
                    content.match(/(\w+,\s+\w+\s+\d{1,2},\s+\d{4})/i) ||
                    content.match(/(\w+\s+\d{1,2},\s+\d{4})/);
  if (dateMatch) {
    eventInfo.date = dateMatch[1].trim().replace(/\*\*/g, '');
  }

  const timeMatch = content.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)\s*(?:GMT[+\-]\d+:\d+)?\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM)\s*(?:GMT[+\-]\d+:\d+)?)/i);
  if (timeMatch) {
    eventInfo.time = timeMatch[1].trim().replace(/\*\*/g, '');
  }

  const durationMatch = content.match(/Duration[:\s]+([^\n]+)/i) ||
                        content.match(/\*\*\s*(\d+\s*(?:hour|hr|minute|min)s?)\s*\*\*/i);
  if (durationMatch) {
    let duration = durationMatch[1].trim().replace(/\*\*/g, '');
    duration = duration.replace(/\bhr\b/gi, 'hour').replace(/\bmin\b/gi, 'minute');
    if (!duration.match(/hours?|minutes?/i)) {
      duration = duration.replace(/(\d+)\s*(hour|minute)/gi, (match, num, unit) => {
        return parseInt(num) > 1 ? `${num} ${unit}s` : `${num} ${unit}`;
      });
    }
    eventInfo.duration = `Duration: ${duration}`;
  }

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

  const attendeesMatch = content.match(/Attendees[:\s]+\((\d+)\)[:\s]*\n?([^\n]+(?:\n(?!Location|Date|Event)[^\n]+)*)/i);
  if (attendeesMatch) {
    const attendeesText = attendeesMatch[2];
    const attendeesList = attendeesText
      .split(/[,\n]/)
      .map(a => a.trim())
      .filter(a => a && a.includes('@'));
    eventInfo.attendees = attendeesList;
  }

  if (eventInfo.title || (eventInfo.date && eventInfo.time)) {
    return eventInfo;
  }

  return null;
};

interface MainAgentContentProps {
  chatId?: string | null;
  onChatIdChange?: (chatId: string) => void;
}

export function MainAgentContent({ chatId, onChatIdChange }: MainAgentContentProps) {
  const router = useRouter();
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId || null);
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
  const shouldSaveRef = useRef<boolean>(false);
  const isSavingRef = useRef<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/signin');
      return;
    }

    const initializeChat = async () => {
      await migrateOldConversation();
      loadExamplesAndHealth();

      if (chatId) {
        await loadChatSession(chatId);
      } else {
        const newSession = await createNewChatSession();
        if (newSession) {
          setCurrentChatId(newSession.id);
          setMessages([]);
          setShowExamples(true);
          onChatIdChange?.(newSession.id);
        }
      }

      await loadChatHistory();
    };

    initializeChat();
  }, [router]);

  // Handle chatId changes from parent (dashboard sidebar)
  useEffect(() => {
    if (chatId && chatId !== currentChatId) {
      loadChatSession(chatId);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  useEffect(() => {
    if (streamingMessageId) {
      scrollToBottom();
    }
  }, [streamingMessageId, messages]);

  useEffect(() => {
    const updateChat = async () => {
      if (currentChatId && messages.length > 0 && !streamingMessageId && shouldSaveRef.current) {
        shouldSaveRef.current = false;
        await saveMessagesToDB(messages);
      }
    };
    
    updateChat();
  }, [messages, currentChatId, streamingMessageId]);

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

  const saveMessagesToDB = async (messagesToSave: ChatMessage[]) => {
    if (isSavingRef.current) {
      return;
    }

    if (!currentChatId || messagesToSave.length === 0) {
      return;
    }

    const validMessages = messagesToSave.filter(m => m.content && m.content.trim() !== '');
    if (validMessages.length === 0) {
      return;
    }

    try {
      isSavingRef.current = true;
      const result = await updateChatSession(currentChatId, validMessages);
      if (result) {
        await loadChatHistory();
      }
    } catch (error) {
      console.error('Error saving messages:', error);
    } finally {
      isSavingRef.current = false;
    }
  };

  const loadChatSession = async (chatIdToLoad: string) => {
    const session = await getChatSession(chatIdToLoad);
    if (session) {
      setCurrentChatId(session.id);
      setMessages(session.messages);
      setShowExamples(session.messages.length === 0);
    } else {
      const newSession = await createNewChatSession();
      if (newSession) {
        setCurrentChatId(newSession.id);
        setMessages([]);
        setShowExamples(true);
        onChatIdChange?.(newSession.id);
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
      const conversationHistory: ConversationMessage[] = [
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        {
          role: 'user',
          content: query,
        }
      ];

      await processQueryStreaming(query, conversationHistory, (chunk: StreamChunk) => {
        switch (chunk.type) {
          case 'thinking':
            setIsThinking(chunk.status === 'start');
            break;
            
          case 'status':
            setThinkingMessage(chunk.message || 'Processing...');
            break;
            
          case 'analysis':
            if (chunk.agents) {
              metadataRef.current.agentsUsed = chunk.agents;
            }
            break;
            
          case 'content':
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
            metadataRef.current = {
              agentsUsed: chunk.agentsUsed,
              processingTime: chunk.processingTime,
            };
            break;
            
          case 'error':
            throw new Error(chunk.error || chunk.message || 'Unknown error');
            
          case 'done':
            const finalContent = streamingContentRef.current;
            const finalMetadata = { ...metadataRef.current };
            
            setMessages((prev) => {
              const updatedMessages = prev.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: finalContent,
                      agentsUsed: finalMetadata.agentsUsed,
                      processingTime: finalMetadata.processingTime,
                    }
                  : m
              );
              
              if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
              }
              
              saveTimeoutRef.current = setTimeout(() => {
                saveMessagesToDB(updatedMessages);
                saveTimeoutRef.current = null;
              }, 200);
              
              return updatedMessages;
            });
            break;
        }
      });

    } catch (error: any) {
      if (error.message && (error.message.includes('Session expired') || error.message.includes('Authentication required'))) {
        router.push('/auth/signin');
        return;
      }
      
      setMessages((prev) => {
        const updatedMessages = prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: `Error: ${error.message || 'Failed to process your request. Please try again.'}`,
                isError: true,
              }
            : m
        );
        
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(() => {
          saveMessagesToDB(updatedMessages);
          saveTimeoutRef.current = null;
        }, 200);
        
        return updatedMessages;
      });
    } finally {
      setIsLoading(false);
      setIsThinking(false);
      setStreamingMessageId(null);
      streamingContentRef.current = '';
      metadataRef.current = {};
      shouldSaveRef.current = false;
      inputRef.current?.focus();
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    inputRef.current?.focus();
  };

  const handleNewChat = async () => {
    // If the current chat has no messages, don't create a new session
    // This prevents creating duplicate empty chat sessions like professional chat systems
    if (messages.length === 0) {
      // Just reset the state without creating a new session
      setInput('');
      setShowExamples(true);
      inputRef.current?.focus();
      return;
    }
    
    const newSession = await createNewChatSession();
    if (newSession) {
      setCurrentChatId(newSession.id);
      setMessages([]);
      setShowExamples(true);
      setInput('');
      await loadChatHistory();
      onChatIdChange?.(newSession.id);
    }
  };

  const handleChatSelect = async (chatIdToSelect: string) => {
    if (chatIdToSelect === currentChatId) return;
    await loadChatSession(chatIdToSelect);
    await loadChatHistory();
    onChatIdChange?.(chatIdToSelect);
  };

  const handleDeleteChat = async (chatIdToDelete: string) => {
    if (confirm('Delete this chat?')) {
      const success = await deleteChatSession(chatIdToDelete);
      if (success) {
        await loadChatHistory();
        
        // If deleting current chat, create new one
        if (chatIdToDelete === currentChatId) {
          await handleNewChat();
        }
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-black overflow-hidden h-full">
      {showExamples && messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center w-full px-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-3">
              How can we help you today?
            </h2>
          </div>
          
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
          <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
            <style>{scrollbarStyles}</style>
            <div className="max-w-4xl mx-auto space-y-6 w-full">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'user' ? (
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
                    <div className="max-w-3xl rounded-2xl px-6 py-2 bg-red-500/10 border border-red-500/30 text-red-400">
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  ) : (
                    <div className="max-w-3xl">
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

              {isThinking && (
                <div className="flex justify-start max-w-3xl mb-4">
                  <ThinkingIndicator message={thinkingMessage} />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
      
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
  );
}

export default MainAgentContent;

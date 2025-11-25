'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, Send, User, Sparkles, Loader2, Clock, MapPin, Users, Video, ExternalLink } from 'lucide-react';
import { getCurrentUser, getStoredUser } from '@/lib/auth';
import { ChatMessage } from '@/lib/types';
import { formatDate, scrollToBottom } from '@/lib/utils';
import { checkCalendarStatus } from '@/lib/calendar';

// Helper function to extract event data from list responses
interface EventData {
  title: string;
  eventId?: string;
  start?: string;
  end?: string;
  location?: string;
  link?: string;
}

const parseEventsList = (text: string): EventData[] => {
  const events: EventData[] = [];
  
  // Strategy 1: Match numbered list format "1. **Title** - Date/Time"
  const pattern1 = /(\d+)\.\s*\*\*([^*]+)\*\*\s*(?:-\s*([^\n]+))?/gi;
  let match;
  while ((match = pattern1.exec(text)) !== null) {
    const title = match[2]?.trim();
    const details = match[3]?.trim();
    
    if (title) {
      events.push({ 
        title, 
        start: details 
      });
    }
  }
  
  return events.filter(e => e.title);
};

// Helper function to extract single event ID from text
const extractEventId = (text: string): string | null => {
  const eventIdRegex = /(?:Event ID:|eventId:)\s*([a-zA-Z0-9_-]{16,})/i;
  const match = text.match(eventIdRegex);
  return match ? match[1] : null;
};

// Helper function to extract calendar link from text
const extractCalendarLink = (text: string): string | null => {
  const linkRegex = /https:\/\/calendar\.google\.com\/calendar\/[^\s)]+/i;
  const match = text.match(linkRegex);
  return match ? match[0] : null;
};

// Component to render formatted agent response with buttons
const FormattedAgentResponse = ({ content }: { content: string }) => {
  // Check if this is an events list response
  const eventsList = parseEventsList(content);
  const singleEventId = eventsList.length === 0 ? extractEventId(content) : null;
  const calendarLink = extractCalendarLink(content);
  
  // If we found multiple events, render as a nice list
  if (eventsList.length > 1) {
    // Extract intro text (everything before "1.")
    const introMatch = content.match(/^([\s\S]*?)(?=1\.)/);
    const introText = introMatch ? introMatch[1].trim() : '📅 Here are your calendar events:';
    
    return (
      <div className="space-y-4">
        <div className="text-sm leading-relaxed mb-4">
          {introText}
        </div>
        
        <div className="space-y-3">
          {eventsList.map((event, index) => (
            <div
              key={index}
              className="flex items-start justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 font-semibold mt-0.5">{index + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white mb-2 text-base">
                      {event.title}
                    </h3>
                    {event.start && (
                      <p className="text-xs text-gray-400 flex items-center gap-2 mb-1">
                        <Clock className="w-3 h-3" />
                        {event.start}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-xs text-gray-400 flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {event.link && (
                <a
                  href={event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl ml-4 flex-shrink-0"
                >
                  View
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
        
        <div className="text-sm text-gray-400 mt-4">
          💬 What would you like to do next?
        </div>
      </div>
    );
  }
  
  // Single event or general response - clean up the text
  let cleanedContent = content
    .replace(/https:\/\/calendar\.google\.com\/calendar\/[^\s)]+/gi, '')
    .replace(/\[View Event\]\([^)]+\)/g, '')
    .replace(/Event ID:\s*[a-zA-Z0-9_-]{16,}/gi, '')
    .trim();
  
  return (
    <div className="space-y-3">
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {cleanedContent}
      </div>
      
      {(singleEventId || calendarLink) && (
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-700">
          {calendarLink && (
            <a
              href={calendarLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <CalendarIcon className="w-4 h-4" />
              View in Calendar
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default function CalendarPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your intelligent Google Calendar assistant powered by AI. I can help you with various Calendar operations:\n\n📅 **View Events**: 'Show me my events for today' or 'What's on my calendar this week?'\n➕ **Create Events**: 'Schedule a meeting tomorrow at 2pm' or 'Create an appointment next Monday'\n✏️ **Update Events**: 'Reschedule my meeting to 3pm' or 'Add john@example.com to the team meeting'\n🗑️ **Delete Events**: 'Cancel tomorrow's meeting' or 'Delete the appointment'\n📋 **Manage Calendars**: 'Show me all my calendars' or 'Create a new calendar called Work'\n✅ **Respond to Events**: 'Accept the meeting invitation' or 'Decline the event'\n\n💡 **Pro tip**: I understand natural language and can:\n- Parse dates like 'tomorrow', 'next Friday', 'in 3 days'\n- Handle times like '2pm', '14:00', 'at noon'\n- Create recurring events\n- Add Google Meet links automatically\n- Manage multiple calendars\n\nJust tell me what you want to do - I'll understand your intent and work with Google Calendar for you!",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check Calendar connection status on component mount
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        const user = getStoredUser();
        if (!user?.id) {
          const errorMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: "⚠️ **Authentication Required**\n\nPlease sign in to use the Calendar Assistant. You need to be authenticated to access your Google Calendar.",
            timestamp: new Date(),
            error: true,
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }

        const status = await checkCalendarStatus();
        
        if (!status.connected) {
          const connectionMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: "🔗 **Google Calendar Connection Required**\n\nTo use the Calendar Assistant, you need to connect your Google Calendar account first. Please go to the Apps section in the dashboard and connect your Google Calendar account.\n\nOnce connected, I'll be able to help you manage your events and schedule!",
            timestamp: new Date(),
            error: true,
          };
          setMessages(prev => [...prev, connectionMessage]);
        } else {
          const welcomeMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: `🎉 **Connected Successfully!**\n\nYour Google Calendar account (${status.email}) is connected and ready to use. I can now help you with all your Calendar needs!\n\nWhat would you like to do first?`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, welcomeMessage]);
        }
      } catch (error) {
        console.error('Error checking Calendar connection:', error);
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: "❌ **Connection Error**\n\nThere was an error checking your Google Calendar connection. Please try refreshing the page or check your connection in the dashboard.",
          timestamp: new Date(),
          error: true,
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeConnection();
  }, []);

  useEffect(() => {
    scrollToBottom(messagesEndRef);
  }, [messages]);

  const handleUserInput = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userInput = inputValue.trim();

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userInput,
      timestamp: new Date(),
    };

    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '🔍 Processing your Calendar request...',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get current user ID
      let userId = getStoredUser()?.id;
      if (!userId) {
        const currentUser = await getCurrentUser();
        userId = currentUser?.id;
      }

      if (!userId) {
        throw new Error('Authentication required. Please sign in to use the Calendar Assistant.');
      }

      // Get auth token
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Access token required. Please sign in again.');
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      // Prepare conversation history (last 10 messages to keep context)
      const conversationHistory = messages
        .filter(m => !m.isLoading) // Exclude loading messages
        .slice(-10) // Keep last 10 messages for context
        .map(m => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.content
        }));
      
      // Call the Calendar AI Agent endpoint
      const response = await fetch(`${API_URL}/api/calendar/agent/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: userInput,
          conversationHistory: conversationHistory
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to process request');
      }

      const data = await response.json();

      // Remove loading message
      setMessages(prev => prev.filter(m => !m.isLoading));

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: data.response || 'No response from assistant',
        timestamp: new Date(),
        metadata: {
          toolsUsed: data.tools_used,
          rawResults: data.function_results
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Error processing Calendar request:', error);
      
      // Remove loading message
      setMessages(prev => prev.filter(m => !m.isLoading));

      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `❌ **Error**: ${error.message || 'Failed to process your request. Please try again.'}`,
        timestamp: new Date(),
        error: true,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserInput();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#0d0d0d] p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Google Calendar Assistant</h1>
              <p className="text-sm text-gray-400">AI-powered calendar management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isInitializing && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-400">AI Active</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                  {message.isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </div>
              )}

              <div
                className={`flex flex-col max-w-[80%] ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none'
                    : message.error
                    ? 'bg-red-500/10 border border-red-500/20 rounded-2xl rounded-tl-none'
                    : 'bg-[#171717] rounded-2xl rounded-tl-none'
                } p-4`}
              >
                <div className="prose prose-invert max-w-none">
                  {message.isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">{message.content}</span>
                    </div>
                  ) : message.type === 'assistant' ? (
                    <FormattedAgentResponse content={message.content} />
                  ) : (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                  )}
                </div>

                {message.metadata?.toolsUsed && message.metadata.toolsUsed.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-2">🛠️ Tools used:</p>
                    <div className="flex flex-wrap gap-2">
                      {message.metadata.toolsUsed.map((tool: any, index: number) => (
                        <span
                          key={index}
                          className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded"
                        >
                          {tool.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <span className="text-xs text-gray-500 mt-2 block">
                  {formatDate(message.timestamp.toISOString())}
                </span>
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800 bg-[#0d0d0d] p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4 items-end">
            <div className="flex-1 bg-[#171717] rounded-2xl border border-gray-800 focus-within:border-blue-500 transition-colors">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me to schedule a meeting, show your events, create a calendar, or anything else..."
                className="w-full bg-transparent px-4 py-3 outline-none resize-none text-sm"
                rows={3}
                disabled={isLoading || isInitializing}
              />
            </div>

            <button
              onClick={handleUserInput}
              disabled={!inputValue.trim() || isLoading || isInitializing}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setInputValue("Show me my events for today")}
              disabled={isLoading}
              className="text-xs bg-[#171717] hover:bg-[#252525] px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              📅 Today's events
            </button>
            <button
              onClick={() => setInputValue("Schedule a meeting tomorrow at 2pm for 1 hour")}
              disabled={isLoading}
              className="text-xs bg-[#171717] hover:bg-[#252525] px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              ➕ Schedule meeting
            </button>
            <button
              onClick={() => setInputValue("What's on my calendar this week?")}
              disabled={isLoading}
              className="text-xs bg-[#171717] hover:bg-[#252525] px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              📆 This week
            </button>
            <button
              onClick={() => setInputValue("Show me all my calendars")}
              disabled={isLoading}
              className="text-xs bg-[#171717] hover:bg-[#252525] px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              📋 My calendars
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

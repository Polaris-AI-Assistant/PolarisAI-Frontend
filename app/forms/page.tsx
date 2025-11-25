'use client';

import { useState, useRef, useEffect } from 'react';
import { FileText, Send, User, Sparkles, MessageSquare, AlertCircle, Loader2, Plus, Edit, Trash2, ExternalLink, Eye } from 'lucide-react';
import { getCurrentUser, getStoredUser } from '@/lib/auth';
import { ChatMessage } from '@/lib/types';
import { formatDate, scrollToBottom } from '@/lib/utils';
import { checkFormsStatus } from '@/lib/forms';

// Helper function to extract form data from list responses
interface FormData {
  title: string;
  formId: string;
  created?: string;
}

const parseFormsList = (text: string): FormData[] => {
  const forms: FormData[] = [];
  
  // Try multiple parsing strategies
  
  // Strategy 1: Match "1. **Title** Created: Date" or "1. **Title** Form ID: id"
  const pattern1 = /(\d+)\.\s*\*\*([^*]+)\*\*\s*(?:Created:\s*([^1-9\n]+))?(?:Form ID:\s*([a-zA-Z0-9_-]{44,}))?/gi;
  let match;
  while ((match = pattern1.exec(text)) !== null) {
    const title = match[2]?.trim();
    const created = match[3]?.trim();
    const formId = match[4];
    
    if (title && formId) {
      forms.push({ title, formId, created });
    }
  }
  
  // Strategy 2: If no matches, try extracting from the messy format
  // "1. **Bhumik's Feedback Form** Created: Oct 27, 2025 2. **Untitled form**..."
  if (forms.length === 0) {
    const messyPattern = /(\d+)\.\s*\*\*([^*]+)\*\*\s*Created:\s*([^1-9]+?)(?=\s*\d+\.|$)/gi;
    while ((match = messyPattern.exec(text)) !== null) {
      const title = match[2]?.trim();
      const created = match[3]?.trim();
      
      if (title) {
        forms.push({ title, formId: '', created });
      }
    }
  }
  
  // Strategy 3: Extract all form IDs separately and match them
  if (forms.some(f => !f.formId)) {
    const formIdMatches = text.match(/[a-zA-Z0-9_-]{44,}/g) || [];
    forms.forEach((form, index) => {
      if (!form.formId && formIdMatches[index]) {
        form.formId = formIdMatches[index];
      }
    });
  }
  
  return forms.filter(f => f.title && f.formId);
};

// Helper function to extract single form ID from text
const extractFormId = (text: string): string | null => {
  const formIdRegex = /(?:Form ID:|formId:)\s*([a-zA-Z0-9_-]{44,})/i;
  const match = text.match(formIdRegex);
  return match ? match[1] : null;
};

// Component to render formatted agent response with buttons
const FormattedAgentResponse = ({ content }: { content: string }) => {
  // Check if this is a forms list response
  const formsList = parseFormsList(content);
  const singleFormId = formsList.length === 0 ? extractFormId(content) : null;
  
  // If we found multiple forms, render as a nice list
  if (formsList.length > 1) {
    // Extract intro text (everything before "1.")
    const introMatch = content.match(/^(.*?)(?=1\.)/s);
    const introText = introMatch ? introMatch[1].trim() : '📋 Here are your Google Forms:';
    
    return (
      <div className="space-y-4">
        <div className="text-sm leading-relaxed mb-4">
          {introText}
        </div>
        
        <div className="space-y-3">
          {formsList.map((form, index) => (
            <div
              key={index}
              className="flex items-start justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 font-semibold mt-0.5">{index + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white mb-2 text-base">
                      {form.title}
                    </h3>
                    {form.created && (
                      <p className="text-xs text-gray-400 mb-1">
                        📅 Created: {form.created}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 font-mono break-all">
                      ID: {form.formId}
                    </p>
                  </div>
                </div>
              </div>
              
              <a
                href={`https://docs.google.com/forms/d/${form.formId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl ml-4 flex-shrink-0"
              >
                <Eye className="w-4 h-4" />
                View
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
        
        <div className="text-sm text-gray-400 mt-4">
          💬 Which form would you like to work with?
        </div>
      </div>
    );
  }
  
  // Single form or general response - clean up the text
  let cleanedContent = content
    .replace(/https:\/\/docs\.google\.com\/forms\/d\/[a-zA-Z0-9_-]+\/edit/g, '')
    .replace(/\[View Form\]\([^)]+\)/g, '')
    .replace(/Form ID:\s*[a-zA-Z0-9_-]{44,}/gi, '')
    .trim();
  
  return (
    <div className="space-y-3">
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {cleanedContent}
      </div>
      
      {(singleFormId || formsList.length === 1) && (
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-700">
          <a
            href={`https://docs.google.com/forms/d/${singleFormId || formsList[0]?.formId}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Eye className="w-4 h-4" />
            View Form
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
};

export default function FormsPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your intelligent Google Forms assistant powered by AI. I can help you with various Forms operations:\n\n📋 **List Forms**: 'Show me all my forms' or 'List my Google Forms'\n➕ **Create Forms**: 'Create a feedback form' or 'Make a customer satisfaction survey'\n📊 **Get Responses**: 'Show me responses for form [FORM_ID]' or 'How many responses does my form have?'\n📝 **Form Details**: 'Show me details of form [FORM_ID]' or 'What questions are in my form?'\n✏️ **Update Forms**: 'Add questions to form [FORM_ID]' or 'Change the title of my form'\n🚀 **Publish Forms**: 'Publish form [FORM_ID]' or 'Stop accepting responses'\n\n💡 **Pro tip**: I can create forms with multiple question types:\n- Short answer (text)\n- Long answer (paragraph)\n- Multiple choice (choose one)\n- Checkboxes (choose multiple)\n- Dropdown (select from list)\n\nJust tell me what you want to do in natural language - I'll understand your intent and work with Google Forms for you!",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check Forms connection status on component mount
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        const user = getStoredUser();
        if (!user?.id) {
          const errorMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: "⚠️ **Authentication Required**\n\nPlease sign in to use the Forms Assistant. You need to be authenticated to access your Google Forms.",
            timestamp: new Date(),
            error: true,
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }

        const status = await checkFormsStatus();
        
        if (!status.connected) {
          const connectionMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: "🔗 **Google Forms Connection Required**\n\nTo use the Forms Assistant, you need to connect your Google Forms account first. Please go to the Apps section in the dashboard and connect your Google Forms account.\n\nOnce connected, I'll be able to help you create, manage, and analyze your forms!",
            timestamp: new Date(),
            error: true,
          };
          setMessages(prev => [...prev, connectionMessage]);
        } else {
          const welcomeMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: `🎉 **Connected Successfully!**\n\nYour Google Forms account (${status.email}) is connected and ready to use. I can now help you with all your Forms needs!\n\nWhat would you like to do first?`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, welcomeMessage]);
        }
      } catch (error) {
        console.error('Error checking Forms connection:', error);
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: "❌ **Connection Error**\n\nThere was an error checking your Google Forms connection. Please try refreshing the page or check your connection in the dashboard.",
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
      content: '🔍 Processing your Forms request...',
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
        throw new Error('Authentication required. Please sign in to use the Forms Assistant.');
      }

      // Get auth token (correct key is 'auth_token')
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
      
      // Call the Forms AI Agent endpoint
      const response = await fetch(`${API_URL}/api/forms/agent/query`, {
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
          rawResults: data.raw_results
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Error processing Forms request:', error);
      
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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Google Forms Assistant</h1>
              <p className="text-sm text-gray-400">AI-powered forms management</p>
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
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
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
                          className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded"
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
            <div className="flex-1 bg-[#171717] rounded-2xl border border-gray-800 focus-within:border-purple-500 transition-colors">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me to create a form, list your forms, get responses, or anything else..."
                className="w-full bg-transparent px-4 py-3 outline-none resize-none text-sm"
                rows={3}
                disabled={isLoading || isInitializing}
              />
            </div>

            <button
              onClick={handleUserInput}
              disabled={!inputValue.trim() || isLoading || isInitializing}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95"
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
              onClick={() => setInputValue("Show me all my forms")}
              disabled={isLoading}
              className="text-xs bg-[#171717] hover:bg-[#252525] px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              📋 List my forms
            </button>
            <button
              onClick={() => setInputValue("Create a feedback form")}
              disabled={isLoading}
              className="text-xs bg-[#171717] hover:bg-[#252525] px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              ➕ Create feedback form
            </button>
            <button
              onClick={() => setInputValue("Create a customer satisfaction survey")}
              disabled={isLoading}
              className="text-xs bg-[#171717] hover:bg-[#252525] px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              📊 Create survey
            </button>
            <button
              onClick={() => setInputValue("Create an event registration form")}
              disabled={isLoading}
              className="text-xs bg-[#171717] hover:bg-[#252525] px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              🎫 Event registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

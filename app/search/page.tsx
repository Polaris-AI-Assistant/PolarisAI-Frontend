'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Send, Mail, Clock, User, Sparkles, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { getCurrentUser, getStoredUser } from '@/lib/auth';
import { ChatMessage } from '@/lib/types';
import { analyzeUserIntent } from '@/lib/intentRecognition';
import { 
  handleEmailSending, 
  handleEmailSearch, 
  createEmailSendMessage, 
  createEmailSearchMessage, 
  createErrorMessage 
} from '@/lib/emailService';
import { formatDate, getSimilarityColor, getSimilarityLabel, scrollToBottom } from '@/lib/utils';
import { checkGmailConnection } from '@/lib/gmailConnection';

export default function SearchPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your intelligent Gmail assistant. I can help you with two things:\n\n🔍 **Search emails**: 'Show me job opportunities' or 'Find emails about meetings'\n✉️ **Send emails**: 'Send a thank you email to john@example.com' or 'Email sarah@company.com about project update'\n\nJust tell me what you want to do in natural language!",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check Gmail connection status on component mount
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        const connectionMessages = await checkGmailConnection();
        if (connectionMessages.length > 0) {
          setMessages(prev => [...prev, ...connectionMessages]);
        }
      } catch (error) {
        console.error('Error checking Gmail connection:', error);
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
    const intent = analyzeUserIntent(userInput);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userInput,
      timestamp: new Date(),
      intent: intent,
    };

    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: intent.type === 'send' 
        ? '📧 I detected you want to send an email. Let me compose and send it for you...'
        : '🔍 Searching through your emails...',
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

      // Fallback to a known user ID for testing
      if (!userId) {
        userId = '984f83c8-2adc-40a2-9288-195e25af139d';
        console.warn('Using fallback user ID. Please implement proper user authentication.');
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      if (intent.type === 'send') {
        const data = await handleEmailSending(intent, userId, API_URL);
        const assistantMessage = createEmailSendMessage(data, intent.extractedInfo?.recipientEmail || '');
        
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = assistantMessage;
          return newMessages;
        });
      } else {
        const data = await handleEmailSearch(intent, userId, API_URL);
        const assistantMessage = createEmailSearchMessage(data);
        
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = assistantMessage;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Processing error:', error);
      const errorMessage = createErrorMessage(error instanceof Error ? error.message : 'Unknown error');

      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = errorMessage;
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserInput();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-blue-600">
              <MessageSquare className="w-6 h-6" />
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Intelligent Gmail Assistant</h1>
              <p className="text-sm text-gray-600">Search emails or send emails with natural language</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Messages Area */}
          <div className="h-[600px] overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  {/* Message Header */}
                  <div className={`flex items-center gap-2 mb-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-sm text-gray-600">
                      {message.type === 'user' ? 'You' : 'Assistant'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Message Content */}
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white ml-10'
                      : 'bg-gray-50 text-gray-900 mr-10'
                  }`}>
                    <div className="flex items-center gap-2">
                      {message.isLoading && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                    </div>
                    
                    {/* Intent indicator for user messages */}
                    {message.type === 'user' && message.intent && (
                      <div className="mt-2 flex items-center gap-2 opacity-80">
                        {message.intent.type === 'send' ? (
                          <Mail className="w-3 h-3" />
                        ) : (
                          <Search className="w-3 h-3" />
                        )}
                        <span className="text-xs">
                          {message.intent.type === 'send' ? 'Send Email' : 'Search Emails'} 
                          ({Math.round(message.intent.confidence * 100)}% confidence)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Search Results */}
                  {message.results && message.results.length > 0 && (
                    <div className="mt-4 space-y-3 mr-10">
                      {message.results.map((result, index) => (
                        <div key={result.message_id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                          {/* Result Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate pr-2">
                                {result.subject || 'No Subject'}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {result.sender}
                                </span>
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(result.date)}
                                </span>
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSimilarityColor(result.similarity)}`}>
                              {getSimilarityLabel(result.similarity)}
                            </div>
                          </div>

                          {/* Result Content */}
                          <div className="space-y-2">
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {result.snippet}
                            </p>
                            
                            {/* Expandable Body */}
                            <details className="group">
                              <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
                                View full content
                              </summary>
                              <div className="mt-2 p-3 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
                                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                                  {result.body.length > 1000 
                                    ? result.body.substring(0, 1000) + '...' 
                                    : result.body}
                                </pre>
                              </div>
                            </details>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Email Sending Results */}
                  {message.emailSent && message.emailSent.success && (
                    <div className="mt-4 mr-10">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Mail className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-green-900">Email Sent Successfully!</h3>
                            <p className="text-sm text-green-700">
                              Sent to: <span className="font-medium">{message.emailSent.recipient}</span>
                            </p>
                          </div>
                        </div>
                        
                        {message.emailSent.generatedContent && (
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-sm font-medium text-green-900 mb-1">Subject:</h4>
                              <p className="text-sm text-green-800 bg-green-100 px-3 py-2 rounded-lg">
                                {message.emailSent.generatedContent.subject}
                              </p>
                            </div>
                            
                            <details className="group">
                              <summary className="cursor-pointer text-sm text-green-700 hover:text-green-900 font-medium">
                                View generated email content
                              </summary>
                              <div className="mt-2 p-3 bg-green-100 rounded-lg max-h-48 overflow-y-auto">
                                <pre className="text-xs text-green-800 whitespace-pre-wrap">
                                  {message.emailSent.generatedContent.body}
                                </pre>
                              </div>
                            </details>
                            
                            <div className="text-xs text-green-600 flex items-center gap-4">
                              <span>Message ID: {message.emailSent.messageId}</span>
                              <span>Thread ID: {message.emailSent.threadId}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search emails or send emails... (e.g., 'Find job opportunities', 'Send thank you to john@example.com')"
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 pr-12 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                  }}
                />
                <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              </div>
              <button
                onClick={handleUserInput}
                disabled={!inputValue.trim() || isLoading}
                className="flex items-center justify-center w-11 h-11 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Usage Tips</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-2">🔍 Search Emails:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• "Show me emails about job opportunities"</li>
                    <li>• "Find emails about meetings this week"</li>
                    <li>• "Search for project updates"</li>
                    <li>• "Get emails from my manager"</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-2">📧 Send Emails:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• "Send thank you to john@example.com"</li>
                    <li>• "Email sarah@company.com about project update"</li>
                    <li>• "Tell manager@company.com I'll be late"</li>
                    <li>• "Write to team@company.com about meeting"</li>
                  </ul>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-3">The AI automatically detects your intent and routes to the appropriate action!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
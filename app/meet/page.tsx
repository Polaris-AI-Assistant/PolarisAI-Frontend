'use client';

import { useState, useRef, useEffect } from 'react';
import { Video, Send, User, Sparkles, MessageSquare, AlertCircle, Loader2, Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { getCurrentUser, getStoredUser } from '@/lib/auth';
import { ChatMessage } from '@/lib/types';
import { formatDate, scrollToBottom } from '@/lib/utils';
import { checkMeetStatus, getMeetAuthUrl, sendMeetAgentQuery } from '@/lib/meet';

// Helper function to extract meeting link from response
const extractMeetingLink = (text: string): string | null => {
  const linkRegex = /https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i;
  const match = text.match(linkRegex);
  return match ? match[0] : null;
};

// Component to render formatted agent response with meeting link
const FormattedAgentResponse = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);
  const meetingLink = extractMeetingLink(content);
  
  // Clean up the text - remove the link if present
  let cleanedContent = content;
  if (meetingLink) {
    cleanedContent = content.replace(meetingLink, '').trim();
  }

  const handleCopy = async () => {
    if (meetingLink) {
      await navigator.clipboard.writeText(meetingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {cleanedContent}
      </div>
      
      {meetingLink && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-500/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-2 font-semibold">📹 Meeting Link</p>
              <a
                href={meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 break-all text-sm font-mono"
              >
                {meetingLink}
              </a>
            </div>
            
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-all duration-200"
                title="Copy link"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
              
              <a
                href={meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Join Meeting
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function MeetPage() {
  const [user, setUser] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load user and check connection on mount
  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await checkConnection();
      } else {
        const storedUser = getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          await checkConnection();
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  // Check connection status
  const checkConnection = async () => {
    const status = await checkMeetStatus();
    setIsConnected(status.connected);
    setConnectionStatus(status);
  };

  // Handle OAuth connection
  const handleConnect = async () => {
    try {
      const authUrl = await getMeetAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting to Google Meet:', error);
      alert('Failed to connect to Google Meet. Please try again.');
    }
  };

  // Send message to agent
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);

    // Scroll to bottom after adding user message
    setTimeout(() => scrollToBottom(chatContainerRef), 100);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.type,
        content: msg.content
      }));

      const result = await sendMeetAgentQuery(userMessage.content, conversationHistory);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.success ? result.response! : result.error || 'Failed to process query',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Scroll to bottom after adding assistant message
      setTimeout(() => scrollToBottom(chatContainerRef), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Authentication Required</h1>
          <p className="text-gray-300 mb-4">Please sign in to access Google Meet</p>
          <a
            href="/auth"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-700">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Video className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-3">
              Connect Google Meet
            </h1>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              Connect your Google Meet account to create meetings, access meeting history, view recordings, and manage participants with AI assistance.
            </p>

            <div className="bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Features:</h3>
              <ul className="text-left text-sm text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Create instant meeting links</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Access meeting history and details</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>View and manage recordings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Track meeting participants</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>AI-powered meeting assistance</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleConnect}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <Video className="w-5 h-5" />
              Connect Google Meet
            </button>

            <p className="text-xs text-gray-500 mt-4">
              You'll be redirected to Google to authorize access
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700 p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Google Meet Assistant</h1>
              <p className="text-sm text-gray-400">
                {connectionStatus?.email && `Connected as ${connectionStatus.email}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
              Connected
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col p-4">
          
          {/* Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Google Meet AI Assistant
                </h2>
                <p className="text-gray-400 mb-6 max-w-md">
                  Ask me to create meetings, check meeting history, view recordings, or manage participants. 
                  I'm here to help with all your Google Meet needs!
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                  {[
                    "Create a new meeting",
                    "Show me my meeting history",
                    "List recent recordings",
                    "Create a meeting link for tomorrow"
                  ].map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(example)}
                      className="p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-blue-500/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all text-left"
                    >
                      💬 {example}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-2xl p-4 shadow-lg ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-800/70 backdrop-blur-sm text-gray-100 border border-gray-700'
                  }`}
                >
                  {message.type === 'assistant' ? (
                    <FormattedAgentResponse content={message.content} />
                  ) : (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </div>
                  )}
                  <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatDate(message.timestamp.toISOString())}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {isSending && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 border border-gray-700">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-4 shadow-xl">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about Google Meet..."
                  className="w-full bg-gray-900/50 text-white placeholder-gray-500 rounded-xl p-3 border border-gray-700 focus:border-blue-500 focus:outline-none resize-none transition-all"
                  rows={2}
                  disabled={isSending}
                />
              </div>
              
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isSending}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              💡 Try: "Create a meeting", "Show recordings", "List participants"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

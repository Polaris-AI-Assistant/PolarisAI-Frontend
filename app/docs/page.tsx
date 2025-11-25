'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  checkDocsStatus,
  getDocsAuthUrl,
  queryDocsAgent,
  disconnectDocs,
  DocsConnectionStatus,
} from '@/lib/docs';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: any[];
}

export default function DocsPage() {
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState<DocsConnectionStatus>({
    connected: false,
    email: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function checkConnection() {
    setIsLoading(true);
    try {
      const status = await checkDocsStatus();
      setConnectionStatus(status);

      if (status.connected) {
        setMessages([
          {
            id: '1',
            type: 'assistant',
            content: `Hello! I'm your Google Docs AI assistant connected to ${status.email}. I can help you create, edit, read, and organize documents using natural language.

**What I can do:**
• Create new documents with specific titles
• Write, insert, or append text to documents
• Format text (bold, italic, colors)
• Read and summarize document content
• Search for text within documents
• List, share, and manage your documents
• Store memories and notes for cross-app context

Try asking me to "Create a new document" or "List my documents"!`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConnect() {
    try {
      const { authUrl } = await getDocsAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting:', error);
      alert('Failed to initiate connection. Please try again.');
    }
  }

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect Google Docs?')) {
      return;
    }

    try {
      await disconnectDocs();
      setConnectionStatus({ connected: false, email: null });
      setMessages([]);
      alert('Successfully disconnected from Google Docs');
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Failed to disconnect. Please try again.');
    }
  }

  async function handleSendMessage() {
    if (!inputValue.trim() || isSending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

      const response = await queryDocsAgent(inputValue, conversationHistory);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.response,
        timestamp: new Date(),
        toolCalls: response.toolCalls,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error querying agent:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Format agent response with proper rendering
  function FormattedAgentResponse({ content }: { content: string }) {
    // Parse document list items - handles multiple formats
    const lines = content.split('\n');
    const documents: Array<{ number: string; title: string; url: string; details: string }> = [];
    let introText = '';
    let foundFirstDoc = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Format 1: "1. [Title](URL) - Details"
      let docMatch = line.match(/^(\d+)\.\s*\[([^\]]+)\]\s*\((https:\/\/[^)]+)\)\s*-\s*(.+)/);
      
      if (docMatch) {
        foundFirstDoc = true;
        documents.push({
          number: docMatch[1],
          title: docMatch[2],
          url: docMatch[3],
          details: docMatch[4].trim()
        });
        continue;
      }
      
      // Format 2: "1. [Title] (URL)" with details in next lines
      docMatch = line.match(/^(\d+)\.\s*\[([^\]]+)\]\s*\((https:\/\/[^)]+)\)/);
      if (docMatch) {
        foundFirstDoc = true;
        const details: string[] = [];
        
        // Collect detail lines (bullet points)
        for (let j = i + 1; j < lines.length && lines[j].trim().startsWith('-'); j++) {
          details.push(lines[j].trim().substring(1).trim());
          i = j; // Skip processed lines
        }
        
        documents.push({
          number: docMatch[1],
          title: docMatch[2],
          url: docMatch[3],
          details: details.length > 0 ? details.join(' • ') : 'No additional details'
        });
        continue;
      }
      
      // Collect intro text before documents
      if (!foundFirstDoc && line.trim()) {
        introText += line + '\n';
      }
    }
    
    // If we found documents, render them in card format
    if (documents.length > 0) {
      return (
        <div className="space-y-4">
          {introText.trim() && (
            <p className="text-gray-800 mb-4">{introText.trim()}</p>
          )}
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-blue-600 font-bold text-sm">{doc.number}.</span>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {doc.title}
                      </h3>
                    </div>
                    <div className="ml-6 space-y-2">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        View Document
                      </a>
                      <div className="text-gray-600 text-sm">
                        {doc.details.split('•').map((detail, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 mt-1">
                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{detail.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Format regular text with proper markdown-like rendering
    return (
      <div className="space-y-3">
        {lines.map((line, lineIndex) => {
          if (!line.trim()) return <div key={lineIndex} className="h-2" />;
          
          // Handle bullet points
          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            const text = line.replace(/^[•-]\s*/, '');
            return (
              <div key={lineIndex} className="flex items-start gap-2 ml-4">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-800 flex-1">{formatInlineText(text)}</span>
              </div>
            );
          }
          
          // Handle numbered lists (without URLs)
          const numberedMatch = line.match(/^(\d+)\.\s*(.+)/);
          if (numberedMatch && !line.includes('http')) {
            return (
              <div key={lineIndex} className="flex items-start gap-2 ml-4">
                <span className="text-blue-600 font-semibold">{numberedMatch[1]}.</span>
                <span className="text-gray-800 flex-1">{formatInlineText(numberedMatch[2])}</span>
              </div>
            );
          }
          
          // Handle headers (lines with **)
          if (line.includes('**')) {
            return (
              <div key={lineIndex} className="text-gray-800">
                {formatInlineText(line)}
              </div>
            );
          }
          
          // Regular paragraph
          return (
            <p key={lineIndex} className="text-gray-800 leading-relaxed">
              {formatInlineText(line)}
            </p>
          );
        })}
      </div>
    );
  }
  
  // Helper function to format inline text (bold, code, links)
  function formatInlineText(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s]+)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      } else if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-sm font-mono"
          >
            {part.slice(1, -1)}
          </code>
        );
      } else if (part.startsWith('http')) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            {part}
          </a>
        );
      } else {
        return <span key={index}>{part}</span>;
      }
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!connectionStatus.connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Connect Google Docs
          </h1>
          <p className="text-gray-600 mb-8">
            Connect your Google account to start creating, editing, and managing documents with AI assistance.
          </p>
          <button
            onClick={handleConnect}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Connect Google Account</span>
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-gray-600 hover:text-gray-800 text-sm"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Docs Assistant</h1>
              <p className="text-sm text-gray-500">AI-powered document management</p>
            </div>
          </div>

          {connectionStatus.email && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">Connected</span>
              </div>
              <p className="text-xs text-green-600 mt-1">{connectionStatus.email}</p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            💡 What I Can Do
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Create new documents</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Write and edit content</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Format text (bold, italic, color)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Read and summarize docs</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Search within documents</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Share and manage documents</span>
            </li>
          </ul>

          <h3 className="text-sm font-semibold text-gray-700 mt-6 mb-3">
            📝 Example Queries
          </h3>
          <div className="space-y-2">
            {[
              'Create a document called "Project Plan"',
              'List all my documents',
              'Add "Meeting notes: ..." to document [ID]',
              'Search for "deadline" in my docs',
            ].map((example, idx) => (
              <button
                key={idx}
                onClick={() => setInputValue(example)}
                className="w-full text-left text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 space-y-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-3xl ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                } rounded-2xl p-4 shadow-sm`}
              >
                {message.type === 'assistant' ? (
                  <FormattedAgentResponse content={message.content} />
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
                <p
                  className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-blue-200' : 'text-gray-400'
                  }`}
                >
                  {formatDate(message.timestamp.toISOString())}
                </p>
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about your Google Docs..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isSending}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

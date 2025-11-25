'use client';

import { useState, useRef, useEffect } from 'react';
import { Table, Send, User, Sparkles, MessageSquare, AlertCircle, Loader2, ExternalLink, Eye } from 'lucide-react';
import { getCurrentUser, getStoredUser } from '@/lib/auth';
import { ChatMessage } from '@/lib/types';
import { formatDate, scrollToBottom } from '@/lib/utils';
import { checkSheetsStatus, getSheetsAuthUrl, querySheetsAgent, disconnectSheets } from '@/lib/sheets';

// Helper function to extract spreadsheet data from list responses
interface SpreadsheetData {
  title: string;
  spreadsheetId: string;
  created?: string;
}

const parseSpreadsheetsList = (text: string): SpreadsheetData[] => {
  const spreadsheets: SpreadsheetData[] = [];
  
  // Strategy 1: Match "1. **Title** Created: Date" or "1. **Title** Spreadsheet ID: id"
  const pattern1 = /(\d+)\.\s*\*\*([^*]+)\*\*\s*(?:Created:\s*([^1-9\n]+))?(?:Spreadsheet ID:\s*([a-zA-Z0-9_-]{44,}))?/gi;
  let match;
  while ((match = pattern1.exec(text)) !== null) {
    const title = match[2]?.trim();
    const created = match[3]?.trim();
    const spreadsheetId = match[4];
    
    if (title && spreadsheetId) {
      spreadsheets.push({ title, spreadsheetId, created });
    }
  }
  
  // Strategy 2: Extract all spreadsheet IDs separately and match them
  if (spreadsheets.some(s => !s.spreadsheetId)) {
    const idMatches = text.match(/[a-zA-Z0-9_-]{44,}/g) || [];
    spreadsheets.forEach((sheet, index) => {
      if (!sheet.spreadsheetId && idMatches[index]) {
        sheet.spreadsheetId = idMatches[index];
      }
    });
  }
  
  return spreadsheets.filter(s => s.title && s.spreadsheetId);
};

// Helper function to extract single spreadsheet ID from text
const extractSpreadsheetId = (text: string): string | null => {
  const idRegex = /(?:Spreadsheet ID:|spreadsheetId:)\s*([a-zA-Z0-9_-]{44,})/i;
  const match = text.match(idRegex);
  return match ? match[1] : null;
};

// Component to render formatted agent response
const FormattedAgentResponse = ({ content }: { content: string }) => {
  const spreadsheetsList = parseSpreadsheetsList(content);
  const singleSpreadsheetId = spreadsheetsList.length === 0 ? extractSpreadsheetId(content) : null;
  
  // If we found multiple spreadsheets, render as a nice list
  if (spreadsheetsList.length > 1) {
    const introMatch = content.match(/^([\s\S]*?)(?=1\.)/);
    const introText = introMatch ? introMatch[1].trim() : '📊 Here are your Google Sheets:';
    
    return (
      <div className="space-y-4">
        <div className="text-sm leading-relaxed mb-4">
          {introText}
        </div>
        
        <div className="space-y-3">
          {spreadsheetsList.map((sheet, index) => (
            <div
              key={index}
              className="flex items-start justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-green-500/50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 font-semibold mt-0.5">{index + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white mb-2 text-base">
                      {sheet.title}
                    </h3>
                    {sheet.created && (
                      <p className="text-xs text-gray-400 mb-1">
                        📅 Created: {sheet.created}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 font-mono break-all">
                      ID: {sheet.spreadsheetId}
                    </p>
                  </div>
                </div>
              </div>
              
              <a
                href={`https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl ml-4 flex-shrink-0"
              >
                <Eye className="w-4 h-4" />
                View
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
        
        <div className="text-sm text-gray-400 mt-4">
          💬 Which spreadsheet would you like to work with?
        </div>
      </div>
    );
  }
  
  // Single spreadsheet or general response
  let cleanedContent = content
    .replace(/https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+\/edit/g, '')
    .replace(/\[View Spreadsheet\]\([^)]+\)/g, '')
    .replace(/Spreadsheet ID:\s*[a-zA-Z0-9_-]{44,}/gi, '')
    .trim();
  
  return (
    <div className="space-y-3">
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {cleanedContent}
      </div>
      
      {(singleSpreadsheetId || spreadsheetsList.length === 1) && (
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-700">
          <a
            href={`https://docs.google.com/spreadsheets/d/${singleSpreadsheetId || spreadsheetsList[0]?.spreadsheetId}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Eye className="w-4 h-4" />
            View Spreadsheet
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
};

export default function SheetsPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionEmail, setConnectionEmail] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    scrollToBottom(messagesEndRef);
  }, [messages]);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const status = await checkSheetsStatus();
      setIsConnected(status.connected);
      if (status.connected && status.email) {
        setConnectionEmail(status.email);
      }
    } catch (error) {
      console.error('Error checking Sheets connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const authUrl = await getSheetsAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error getting Sheets auth URL:', error);
      alert('Failed to connect to Google Sheets. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Sheets?')) {
      return;
    }

    try {
      const result = await disconnectSheets();
      if (result.success) {
        setIsConnected(false);
        setConnectionEmail(null);
        setMessages([]);
        alert('Google Sheets disconnected successfully');
      } else {
        alert('Failed to disconnect: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error disconnecting Sheets:', error);
      alert('Failed to disconnect Google Sheets. Please try again.');
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);

    try {
      // Build conversation history
      const conversationHistory = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const response = await querySheetsAgent(userMessage.content, conversationHistory);

      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        type: 'assistant',
        content: response.success 
          ? (response.response || 'I processed your request successfully.')
          : `Error: ${response.error || response.message || 'Failed to process query'}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-error',
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading Google Sheets...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#171717] rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Table className="w-10 h-10 text-green-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            Connect Google Sheets
          </h1>
          
          <p className="text-gray-400 mb-8">
            Connect your Google account to start managing your spreadsheets with AI assistance.
            Create, edit, and analyze spreadsheets using natural language.
          </p>
          
          <button
            onClick={handleConnect}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
          >
            <Table className="w-5 h-5" />
            Connect Google Sheets
          </button>
          
          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-400 text-left">
              <strong className="text-green-400">What you can do:</strong>
              <br />
              • List and search your spreadsheets
              <br />
              • Create new spreadsheets and sheets
              <br />
              • Read and update cell data
              <br />
              • Format cells with colors and styles
              <br />
              • Share spreadsheets with others
              <br />
              • Manage rows and columns
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#0A0A0A] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Table className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Google Sheets AI</h1>
                <p className="text-xs text-gray-400">
                  Connected as {connectionEmail}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-88px)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Ask me anything about your spreadsheets
              </h2>
              <p className="text-gray-400 mb-6">
                I can help you create, manage, and analyze your Google Sheets
              </p>
              
              <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Show me all my spreadsheets",
                  "Create a budget tracker",
                  "Read data from Sheet1",
                  "Add a new sheet called Q1 Data"
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(example)}
                    className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-sm text-gray-300 text-left transition-colors border border-gray-700 hover:border-green-500/50"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-4 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.type === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                    : 'bg-[#171717] text-gray-100 border border-gray-800'
                }`}
              >
                {message.type === 'assistant' ? (
                  <FormattedAgentResponse content={message.content} />
                ) : (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                )}
                
                <p className="text-xs opacity-60 mt-2">
                  {formatDate(message.timestamp.toISOString())}
                </p>
              </div>
              
              {message.type === 'user' && (
                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </div>
          ))}
          
          {isSending && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="bg-[#171717] rounded-2xl px-5 py-4 border border-gray-800">
                <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-[#171717] rounded-2xl border border-gray-800 p-2 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your spreadsheets..."
            disabled={isSending}
            className="flex-1 bg-transparent text-white placeholder-gray-500 px-4 py-3 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isSending}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-700 disabled:to-gray-700 text-white p-3 rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

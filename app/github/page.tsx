'use client';

import { useState, useRef, useEffect } from 'react';
import { Github, Send, User, Sparkles, MessageSquare, AlertCircle, Loader2, GitBranch, Star, Users, Code } from 'lucide-react';
import { getCurrentUser, getStoredUser } from '@/lib/auth';
import { ChatMessage } from '@/lib/types';
import { formatDate, scrollToBottom } from '@/lib/utils';
import { checkGitHubStatus } from '@/lib/github';

export default function GitHubPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your intelligent GitHub assistant powered by AI. I can help you with various GitHub operations:\n\n🔍 **Repository management**: 'Show me my repositories', 'Show recent 10 repos', or 'Find repos with JavaScript'\n📊 **Statistics**: 'Get my GitHub stats' or 'Show repository analytics'\n👥 **User information**: 'Show my profile info' or 'Get user details for username'\n🌟 **Stars and forks**: 'List my starred repos' or 'Show popular repositories'\n📝 **Issues and PRs**: 'Show issues in my repo' or 'List pull requests'\n🔍 **Search**: 'Search for React repositories' or 'Find trending projects'\n\n💡 **Pro tip**: When asking for repositories, you can specify how many you want to see (e.g., 'show 15 repos', 'recent 20 repositories'). By default, I'll show 10 repositories.\n\nJust tell me what you want to do in natural language - I'll understand your intent and fetch the information from GitHub!",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check GitHub connection status on component mount
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        const user = getStoredUser();
        if (!user?.id) {
          const errorMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: "⚠️ **Authentication Required**\n\nPlease sign in to use the GitHub Assistant. You need to be authenticated to access your GitHub data.",
            timestamp: new Date(),
            error: true,
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }

        const status = await checkGitHubStatus();
        
        if (!status.connected) {
          const connectionMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: "🔗 **GitHub Connection Required**\n\nTo use the GitHub Assistant, you need to connect your GitHub account first. Please go to the Apps section in the dashboard and connect your GitHub account.\n\nOnce connected, I'll be able to help you with all your GitHub needs!",
            timestamp: new Date(),
            error: true,
          };
          setMessages(prev => [...prev, connectionMessage]);
        } else {
          const welcomeMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: `🎉 **Connected Successfully!**\n\nYour GitHub account (@${status.username}) is connected and ready to use. I can now help you with all your GitHub needs!\n\nWhat would you like to do first?`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, welcomeMessage]);
        }
      } catch (error) {
        console.error('Error checking GitHub connection:', error);
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: "❌ **Connection Error**\n\nThere was an error checking your GitHub connection. Please try refreshing the page or check your connection in the dashboard.",
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
      content: '🔍 Processing your GitHub request...',
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
        throw new Error('Authentication required. Please sign in to use the GitHub Assistant.');
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      // Enhanced query processing for repository requests
      let processedQuery = userInput;
      let repoCount = 10; // Default to 10 repos as requested
      
      // Check if user specified a number of repos to show
      const numberMatch = userInput.match(/(\d+)\s*repos?/i) || 
                         userInput.match(/show\s*(\d+)/i) ||
                         userInput.match(/recent\s*(\d+)/i);
      if (numberMatch) {
        repoCount = parseInt(numberMatch[1]);
        // Ensure reasonable limits (1-50)
        repoCount = Math.min(Math.max(repoCount, 1), 50);
      }

      // Call the GitHub AI Agent endpoint
      const response = await fetch(`${API_URL}/api/github/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          query: processedQuery,
          repoCount: repoCount
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let assistantContent = '';
      
      if (data.success) {
        if (data.response) {
          assistantContent = data.response;
        } else if (data.result) {
          // Handle different types of GitHub data
          assistantContent = formatGitHubResponse(data.result, userInput, repoCount);
        } else {
          assistantContent = '✅ Request completed successfully!';
        }
      } else {
        assistantContent = `❌ **Error**: ${data.error || 'Unknown error occurred'}`;
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
        githubData: data.result,
      };

      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = assistantMessage;
        return newMessages;
      });

    } catch (error) {
      console.error('GitHub Assistant error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: `❌ **Error**: ${error instanceof Error ? error.message : 'Unknown error occurred'}\n\nPlease make sure your GitHub account is connected and try again.`,
        timestamp: new Date(),
        error: true,
      };

      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = errorMessage;
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatGitHubResponse = (data: any, query: string, repoCount: number = 10): string => {
    if (!data) return 'No data received from GitHub.';

    // Handle different types of responses
    if (Array.isArray(data)) {
      // Handle repository lists
      if (data.length > 0 && data[0].name && data[0].html_url) {
        return formatRepositoryList(data, repoCount);
      }
      // Handle other array responses
      return `Found ${data.length} results:\n\n${data.map((item, index) => 
        `${index + 1}. ${JSON.stringify(item, null, 2)}`
      ).join('\n\n')}`;
    }

    // Handle single repository
    if (data.name && data.html_url) {
      return formatSingleRepository(data);
    }

    // Handle user profile
    if (data.login && data.type === 'User') {
      return formatUserProfile(data);
    }

    // Handle statistics
    if (typeof data === 'object') {
      return formatObjectResponse(data);
    }

    return `Response: ${JSON.stringify(data, null, 2)}`;
  };

  const formatRepositoryList = (repos: any[], maxCount = 10): string => {
    const displayCount = Math.min(maxCount, repos.length);
    const repoList = repos.slice(0, displayCount).map((repo, index) => {
      const stars = repo.stargazers_count ? `⭐ ${repo.stargazers_count}` : '';
      const forks = repo.forks_count ? `🍴 ${repo.forks_count}` : '';
      const language = repo.language ? `📝 ${repo.language}` : '';
      const isPrivate = repo.private ? '🔒 Private' : '🌍 Public';
      const updatedAt = repo.updated_at ? `📅 Last updated on ${new Date(repo.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` : '';
      const description = repo.description ? `\n   ${repo.description}` : '';
      
      return `${index + 1}. [**${repo.name}**](${repo.html_url}) ${isPrivate}\n   ${stars} ${forks} ${language}\n   ${updatedAt}${description}`;
    }).join('\n\n');

    const total = repos.length;
    
    let header = '';
    if (total > displayCount) {
      header = `📚 **You have a total of ${total} repositories. Here are the first ${displayCount}:**\n\n`;
    } else {
      header = `📚 **Found ${total} repositories:**\n\n`;
    }
    
    let footer = '';
    if (total > displayCount) {
      footer = `\n\n💡 **Note**: This is not the complete list. If you need information about other repositories, let me know or specify a number like "show 20 repos".`;
    }
    
    return `${header}${repoList}${footer}`;
  };

  const formatSingleRepository = (repo: any): string => {
    const stars = repo.stargazers_count ? `⭐ ${repo.stargazers_count}` : '';
    const forks = repo.forks_count ? `🍴 ${repo.forks_count}` : '';
    const language = repo.language ? `📝 ${repo.language}` : '';
    const isPrivate = repo.private ? '🔒 Private' : '🌍 Public';
    const description = repo.description ? `\n\n**Description**: ${repo.description}` : '';
    const topics = repo.topics && repo.topics.length > 0 ? `\n\n**Topics**: ${repo.topics.join(', ')}` : '';
    
    return `📂 **${repo.name}** ${isPrivate}\n\n${stars} ${forks} ${language}${description}${topics}\n\n🔗 [View Repository](${repo.html_url})`;
  };

  const formatUserProfile = (user: any): string => {
    const followers = user.followers ? `👥 ${user.followers} followers` : '';
    const following = user.following ? `👥 ${user.following} following` : '';
    const repos = user.public_repos ? `📚 ${user.public_repos} public repos` : '';
    const company = user.company ? `🏢 ${user.company}` : '';
    const location = user.location ? `📍 ${user.location}` : '';
    const bio = user.bio ? `\n\n**Bio**: ${user.bio}` : '';
    
    return `👤 **${user.name || user.login}** (@${user.login})\n\n${followers} ${following} ${repos}\n${company} ${location}${bio}\n\n🔗 [View Profile](${user.html_url})`;
  };

  const formatObjectResponse = (data: any): string => {
    const entries = Object.entries(data);
    return entries.map(([key, value]) => {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `**${formattedKey}**: ${value}`;
    }).join('\n');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserInput();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-white">
              <MessageSquare className="w-6 h-6" />
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Intelligent GitHub Assistant</h1>
              <p className="text-sm text-gray-400">Manage repositories, users, and statistics with natural language</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
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
                        : message.error
                          ? 'bg-red-600 text-white'
                          : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : message.error ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <Github className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-sm text-gray-400">
                      {message.type === 'user' ? 'You' : 'GitHub Assistant'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Message Content */}
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white ml-10'
                      : message.error
                        ? 'bg-red-900/30 text-red-200 border border-red-800 mr-10'
                        : 'bg-gray-700 text-gray-100 mr-10'
                  }`}>
                    <div className="flex items-start gap-2">
                      {message.isLoading && (
                        <Loader2 className="w-4 h-4 animate-spin mt-0.5 flex-shrink-0" />
                      )}
                      <div className="text-sm leading-relaxed whitespace-pre-line">
                        {message.content}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about your GitHub repositories, stats, or any GitHub-related query..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 min-h-[44px] max-h-32"
                  rows={1}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleUserInput}
                disabled={isLoading || !inputValue.trim()}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Code className="w-3 h-3" />
                <span>Repositories</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                <span>Statistics</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>User Info</span>
              </div>
              <div className="flex items-center gap-1">
                <GitBranch className="w-3 h-3" />
                <span>Issues & PRs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
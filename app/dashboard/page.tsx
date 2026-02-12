'use client'

import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getStoredUser, signOut, User, isAuthenticated } from '../../lib/auth'
import { connectGmail, checkGmailStatus, GmailConnectionStatus, fetchAndEmbedGmailMessages, getGmailStats, disconnectGmail } from '../../lib/gmail'
import { connectGitHub, checkGitHubStatus, GitHubConnectionStatus, getGitHubStats, disconnectGitHub } from '../../lib/github'
import { connectForms, checkFormsStatus, FormsConnectionStatus, disconnectForms } from '../../lib/forms'
import { connectSheets, checkSheetsStatus, SheetsConnectionStatus, disconnectSheets } from '../../lib/sheets'
import { connectDocs, checkDocsStatus, DocsConnectionStatus, disconnectDocs } from '../../lib/docs'
import { connectCalendar, checkCalendarStatus, CalendarConnectionStatus, disconnectCalendar } from '../../lib/calendar'
import { connectMeet, checkMeetStatus, MeetConnectionStatus, disconnectMeet } from '../../lib/meet'
import { checkMicrosoftStatus, connectMicrosoftApp, disconnectMicrosoftApp, MicrosoftConnectionStatus } from '../../lib/microsoft'
import { MainAgentContent } from '../../components/MainAgentContent'
import ProfileDropdown from '../../components/kokonutui/profile-dropdown'
import AppsIntegrations from '../../components/apps-integrations'
import {
  createNewChatSession,
  deleteChatSession,
  getGroupedChatSessions,
  GroupedChats,
  invalidateChatCache,
  ChatSession,
} from '../../lib/chatHistory'
import { useRealtimeChat } from '../../lib/useRealtimeChat'
import { useSocket } from '@/contexts/SocketContext'
import {
  getAllConnectionStatusesCached,
  invalidateConnectionCache,
  updateConnectionStatusCache,
} from '../../lib/cachedConnections'
import { useCacheStore } from '../../lib/stores/cacheStore'

// Small floating badge showing WebSocket connection status (for debugging)
function SocketStatusBadge() {
  const { connectionState, onlineUsers } = useSocket();
  const [show, setShow] = useState(true);

  if (!show) return null;

  const stateConfig: Record<string, { color: string; label: string }> = {
    connected: { color: 'bg-green-500', label: 'WS Connected' },
    connecting: { color: 'bg-yellow-500', label: 'WS Connecting...' },
    reconnecting: { color: 'bg-yellow-500', label: 'WS Reconnecting...' },
    disconnected: { color: 'bg-red-500', label: 'WS Disconnected' },
  };
  const { color, label } = stateConfig[connectionState] || stateConfig.disconnected;

  return (
    <div
      className="fixed bottom-4 left-4 z-[9999] flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white bg-black/80 border border-white/10 backdrop-blur-sm shadow-lg cursor-pointer select-none"
      onClick={() => setShow(false)}
      title="Click to dismiss. Check browser console for [Socket] logs."
    >
      <span className={`inline-block w-2 h-2 rounded-full ${color} animate-pulse`} />
      <span>{label}</span>
      {connectionState === 'connected' && (
        <span className="text-white/50">• {onlineUsers.length} online</span>
      )}
    </div>
  );
}

function Dashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('Apps')
  const [user, setUser] = useState<User | null>(null)
  const [chatSearchQuery, setChatSearchQuery] = useState('')
  const [gmailStatus, setGmailStatus] = useState<GmailConnectionStatus>({ connected: false })
  const [githubStatus, setGithubStatus] = useState<GitHubConnectionStatus>({ connected: false })
  const [formsStatus, setFormsStatus] = useState<FormsConnectionStatus>({ connected: false })
  const [sheetsStatus, setSheetsStatus] = useState<SheetsConnectionStatus>({ connected: false })
  const [docsStatus, setDocsStatus] = useState<DocsConnectionStatus>({ connected: false, email: null })
  const [calendarStatus, setCalendarStatus] = useState<CalendarConnectionStatus>({ connected: false })
  const [meetStatus, setMeetStatus] = useState<MeetConnectionStatus>({ connected: false })
  const [microsoftStatus, setMicrosoftStatus] = useState<MicrosoftConnectionStatus>({ 
    connected: false, 
    apps: { outlook: false, calendar: false, onedrive: false, excel: false, teams: false, word: false } 
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [isGithubConnecting, setIsGithubConnecting] = useState(false)
  const [gmailStats, setGmailStats] = useState<any>(null)
  const [githubStats, setGithubStats] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string>('')
  
  // Chat history state - initialize from cache for instant display
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [groupedChats, setGroupedChats] = useState<GroupedChats>(() => {
    // Try to load from cache synchronously on initial render
    if (typeof window !== 'undefined') {
      const cached = useCacheStore.getState().getChatSessions()
      if (cached) {
        // Convert cached data to proper format
        return {
          today: cached.today.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt), messages: [] })),
          yesterday: cached.yesterday.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt), messages: [] })),
          lastWeek: cached.lastWeek.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt), messages: [] })),
          lastMonth: cached.lastMonth.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt), messages: [] })),
          older: cached.older.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt), messages: [] })),
        }
      }
    }
    return {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    }
  })

  // Load chat history
  const loadChatHistory = useCallback(async (forceRefresh: boolean = false) => {
    const grouped = await getGroupedChatSessions(forceRefresh)
    setGroupedChats(grouped)
  }, [])

  // Handle new chat - creates a new chat session and resets MainAgentContent
  const handleNewChat = useCallback(async () => {
    // First, always switch to MainAgent tab
    setActiveTab('MainAgent')
    
    // Check if the current chat is empty (has no messages) based on groupedChats
    // This helps avoid creating multiple empty sessions
    if (currentChatId) {
      const allChats = [
        ...groupedChats.today,
        ...groupedChats.yesterday,
        ...groupedChats.lastWeek,
        ...groupedChats.lastMonth,
        ...groupedChats.older,
      ]
      const currentChat = allChats.find(chat => chat.id === currentChatId)
      if (currentChat && currentChat.messageCount === 0) {
        // Current chat is already empty, no need to create new session
        // Just ensure we're on MainAgent tab (done above)
        return
      }
    }
    
    // Create a new chat session
    try {
      const newSession = await createNewChatSession()
      if (newSession) {
        // Set the new chat ID - this will trigger MainAgentContent to load the new session
        setCurrentChatId(newSession.id)
        // Invalidate cache and refresh chat history
        invalidateChatCache()
        await loadChatHistory(true)
      }
    } catch (error) {
      console.error('Error creating new chat:', error)
    }
  }, [loadChatHistory, currentChatId, groupedChats])

  // Handle chat selection
  const handleChatSelect = useCallback((chatId: string) => {
    setCurrentChatId(chatId)
  }, [])

  // Handle chat deletion
  const handleDeleteChat = useCallback(async (chatIdToDelete: string) => {
    if (confirm('Delete this chat?')) {
      const success = await deleteChatSession(chatIdToDelete)
      if (success) {
        // Invalidate cache and refresh
        invalidateChatCache()
        await loadChatHistory(true)
        if (chatIdToDelete === currentChatId) {
          await handleNewChat()
        }
      }
    }
  }, [currentChatId, loadChatHistory, handleNewChat])

  // Handle chat ID change from MainAgentContent
  const handleChatIdChange = useCallback((chatId: string) => {
    setCurrentChatId(chatId)
    loadChatHistory(true)
  }, [loadChatHistory])

  // Setup realtime subscription for chat session updates (sidebar)
  useRealtimeChat({
    currentChatId,
    enabled: true,
    onSessionUpdate: useCallback((session: { id: string; title: string; messageCount: number }) => {
      // Update the session in groupedChats when it changes
      setGroupedChats((prev) => {
        const updateInGroup = (groups: ChatSession[]) =>
          groups.map((s) =>
            s.id === session.id
              ? { ...s, title: session.title, messageCount: session.messageCount }
              : s
          );
        return {
          today: updateInGroup(prev.today),
          yesterday: updateInGroup(prev.yesterday),
          lastWeek: updateInGroup(prev.lastWeek),
          lastMonth: updateInGroup(prev.lastMonth),
          older: updateInGroup(prev.older),
        };
      });
    }, []),
    onSessionInsert: useCallback((session: { id: string; title: string; messageCount: number }) => {
      // Add new session to today's group
      setGroupedChats((prev) => ({
        ...prev,
        today: [
          {
            id: session.id,
            title: session.title,
            createdAt: new Date(),
            updatedAt: new Date(),
            messages: [],
            messageCount: session.messageCount,
          },
          ...prev.today,
        ],
      }));
    }, []),
    onSessionDelete: useCallback((sessionId: string) => {
      // Remove session from all groups
      setGroupedChats((prev) => {
        const removeFromGroup = (groups: ChatSession[]) =>
          groups.filter((s) => s.id !== sessionId);
        return {
          today: removeFromGroup(prev.today),
          yesterday: removeFromGroup(prev.yesterday),
          lastWeek: removeFromGroup(prev.lastWeek),
          lastMonth: removeFromGroup(prev.lastMonth),
          older: removeFromGroup(prev.older),
        };
      });
    }, []),
  });

  // Handle tab from URL params
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (tabFromUrl === 'MainAgent') {
      setActiveTab('MainAgent')
    }
  }, [searchParams])

  // Track if initial chat setup is done
  const initialChatSetupDone = useRef(false)

  // Load chat history on mount and create initial session if needed
  useEffect(() => {
    // Only run once
    if (initialChatSetupDone.current) return
    initialChatSetupDone.current = true

    const initializeChatHistory = async () => {
      // First, try to set currentChatId from already loaded state (from cache)
      const cachedChats = [
        ...groupedChats.today,
        ...groupedChats.yesterday,
        ...groupedChats.lastWeek,
        ...groupedChats.lastMonth,
        ...groupedChats.older,
      ]
      
      // If we have cached chats, set the current chat ID immediately
      if (cachedChats.length > 0 && !currentChatId) {
        const chatWithMessages = cachedChats.find(chat => chat.messageCount > 0)
        const emptyChat = cachedChats.find(chat => chat.messageCount === 0)
        
        if (chatWithMessages) {
          setCurrentChatId(chatWithMessages.id)
        } else if (emptyChat) {
          setCurrentChatId(emptyChat.id)
        }
      }
      
      // Then fetch fresh data from API (always force refresh on mount)
      const grouped = await getGroupedChatSessions(true)
      setGroupedChats(grouped)
      
      // Check if there are any existing chats with messages
      const allChats = [
        ...grouped.today,
        ...grouped.yesterday,
        ...grouped.lastWeek,
        ...grouped.lastMonth,
        ...grouped.older,
      ]
      
      // Only update currentChatId if it's not set or invalid
      if (!currentChatId || !allChats.find(c => c.id === currentChatId)) {
        const chatWithMessages = allChats.find(chat => chat.messageCount > 0)
        const emptyChat = allChats.find(chat => chat.messageCount === 0)
        
        if (chatWithMessages) {
          setCurrentChatId(chatWithMessages.id)
        } else if (emptyChat) {
          setCurrentChatId(emptyChat.id)
        } else {
          // No chats exist, create a new one
          try {
            const newSession = await createNewChatSession()
            if (newSession) {
              setCurrentChatId(newSession.id)
              invalidateChatCache()
              const updatedGrouped = await getGroupedChatSessions(true)
              setGroupedChats(updatedGrouped)
            }
          } catch (error) {
            console.error('Error creating initial chat session:', error)
          }
        }
      }
    }
    
    initializeChatHistory()
  }, [])

  useEffect(() => {
    // Check authentication first
    if (!isAuthenticated()) {
      router.push('/auth/signin')
      return
    }

    setUser(getStoredUser())
    
    // Check connection statuses using cache
    const checkConnections = async () => {
      try {
        // First, try to load from cache for instant display
        const cachedStatuses = useCacheStore.getState().getAllConnectionStatuses()
        
        if (cachedStatuses) {
          // Apply cached statuses immediately for instant UI
          if (cachedStatuses.gmail) setGmailStatus(cachedStatuses.gmail)
          if (cachedStatuses.github) setGithubStatus(cachedStatuses.github)
          if (cachedStatuses.forms) setFormsStatus(cachedStatuses.forms)
          if (cachedStatuses.sheets) setSheetsStatus(cachedStatuses.sheets)
          if (cachedStatuses.docs) setDocsStatus(cachedStatuses.docs)
          if (cachedStatuses.calendar) setCalendarStatus(cachedStatuses.calendar)
          if (cachedStatuses.meet) setMeetStatus(cachedStatuses.meet)
          if (cachedStatuses.microsoft) setMicrosoftStatus(cachedStatuses.microsoft)
          console.log('[Cache] Applied cached connection statuses')
        }
        
        // Then fetch fresh data (will use cache if not stale)
        const statuses = await getAllConnectionStatusesCached()
        
        // Update state with fresh/validated data
        if (statuses.gmail) {
          setGmailStatus(statuses.gmail)
          // If Gmail connected, also get stats
          if (statuses.gmail.connected) {
            const gmailStatsResult = await getGmailStats()
            setGmailStats(gmailStatsResult)
          }
        }
        
        if (statuses.github) {
          setGithubStatus(statuses.github)
          // If GitHub connected, also get stats
          if (statuses.github.connected) {
            const githubStatsResult = await getGitHubStats()
            setGithubStats(githubStatsResult)
          }
        }
        
        if (statuses.forms) setFormsStatus(statuses.forms)
        if (statuses.sheets) setSheetsStatus(statuses.sheets)
        if (statuses.docs) setDocsStatus(statuses.docs)
        if (statuses.calendar) setCalendarStatus(statuses.calendar)
        if (statuses.meet) setMeetStatus(statuses.meet)
        if (statuses.microsoft) setMicrosoftStatus(statuses.microsoft)
        
        console.log('[Cache] Connection statuses loaded')
      } catch (error) {
        console.error('Error checking connection status:', error)
      }
    }
    
    // Check if we just came back from Docs OAuth
    const docsConnected = localStorage.getItem('docs_connected')
    // Check if we just came back from Microsoft OAuth
    const microsoftConnected = localStorage.getItem('microsoft_connected')
    
    if (docsConnected === 'true') {
      console.log('Detected Docs connection, refreshing status...')
      localStorage.removeItem('docs_connected')
      // Add a small delay to ensure DB write is complete
      setTimeout(() => {
        checkConnections()
      }, 500)
    } else if (microsoftConnected === 'true') {
      console.log('Detected Microsoft connection, refreshing status...')
      localStorage.removeItem('microsoft_connected')
      setTimeout(() => {
        checkConnections()
      }, 500)
    } else {
      checkConnections()
    }
    
    // Refresh connection status when page regains focus (after OAuth redirect)
    const handleFocus = () => {
      console.log('Page focused, refreshing connection status...')
      checkConnections()
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Handle Gmail connection
  const handleGmailConnect = async () => {
    if (gmailStatus.connected) {
      // Already connected, could show disconnect option
      return
    }

    setIsConnecting(true)
    try {
      await connectGmail()
    } catch (error) {
      console.error('Error connecting Gmail:', error)
      alert('Failed to connect Gmail. Please try again.')
      setIsConnecting(false)
    }
  }

  // Handle Gmail disconnect
  const handleGmailDisconnect = async () => {
    if (!gmailStatus.connected) {
      return
    }

    if (confirm('Are you sure you want to disconnect Gmail?')) {
      try {
        const result = await disconnectGmail()
        if (result.success) {
          setGmailStatus({ connected: false })
          setGmailStats(null)
          // Update cache
          updateConnectionStatusCache('gmail', { connected: false })
          alert('Gmail disconnected successfully')
        } else {
          alert(result.error || 'Failed to disconnect Gmail')
        }
      } catch (error) {
        console.error('Error disconnecting Gmail:', error)
        alert('Failed to disconnect Gmail. Please try again.')
      }
    }
  }

  // Handle GitHub connection
  const handleGithubConnect = async () => {
    if (githubStatus.connected) {
      // Already connected, could show disconnect option
      return
    }

    setIsGithubConnecting(true)
    try {
      await connectGitHub()
      // Note: setIsGithubConnecting(false) will be handled after redirect back
    } catch (error) {
      console.error('Error connecting GitHub:', error)
      alert('Failed to connect GitHub. Please try again.')
      setIsGithubConnecting(false)
    }
  }

  // Handle GitHub disconnect
  const handleGithubDisconnect = async () => {
    if (!githubStatus.connected) {
      return
    }

    if (confirm('Are you sure you want to disconnect GitHub?')) {
      try {
        const result = await disconnectGitHub()
        if (result.success) {
          setGithubStatus({ connected: false })
          setGithubStats(null)
          // Update cache
          updateConnectionStatusCache('github', { connected: false })
          alert('GitHub disconnected successfully')
        } else {
          alert(result.error || 'Failed to disconnect GitHub')
        }
      } catch (error) {
        console.error('Error disconnecting GitHub:', error)
        alert('Failed to disconnect GitHub. Please try again.')
      }
    }
  }

  // Handle Forms connection
  const handleFormsConnect = async () => {
    if (formsStatus.connected) {
      return
    }

    try {
      await connectForms()
    } catch (error) {
      console.error('Error connecting Forms:', error)
      alert('Failed to connect Google Forms. Please try again.')
    }
  }

  // Handle Forms disconnect
  const handleFormsDisconnect = async () => {
    if (!formsStatus.connected) {
      return
    }

    if (confirm('Are you sure you want to disconnect Google Forms?')) {
      try {
        const result = await disconnectForms()
        if (result.success) {
          setFormsStatus({ connected: false })
          // Update cache
          updateConnectionStatusCache('forms', { connected: false })
          alert('Google Forms disconnected successfully')
        } else {
          alert(result.error || 'Failed to disconnect Google Forms')
        }
      } catch (error) {
        console.error('Error disconnecting Forms:', error)
        alert('Failed to disconnect Google Forms. Please try again.')
      }
    }
  }

  // Handle Sheets connection
  const handleSheetsConnect = async () => {
    if (sheetsStatus.connected) {
      return
    }

    try {
      await connectSheets()
    } catch (error) {
      console.error('Error connecting Sheets:', error)
      alert('Failed to connect Google Sheets. Please try again.')
    }
  }

  // Handle Sheets disconnect
  const handleSheetsDisconnect = async () => {
    if (!sheetsStatus.connected) {
      return
    }

    if (confirm('Are you sure you want to disconnect Google Sheets?')) {
      try {
        const result = await disconnectSheets()
        if (result.success) {
          setSheetsStatus({ connected: false })
          alert('Google Sheets disconnected successfully')
        } else {
          alert(result.error || 'Failed to disconnect Google Sheets')
        }
      } catch (error) {
        console.error('Error disconnecting Sheets:', error)
        alert('Failed to disconnect Google Sheets. Please try again.')
      }
    }
    await refreshConnectionStatus()
  }

  // Handle Docs connection
  const handleDocsConnect = async () => {
    if (docsStatus.connected) {
      return
    }

    try {
      await connectDocs()
    } catch (error) {
      console.error('Error connecting Docs:', error)
      alert('Failed to connect Google Docs. Please try again.')
    }
  }

  // Handle Docs disconnect
  const handleDocsDisconnect = async () => {
    if (!docsStatus.connected) {
      return
    }

    if (confirm('Are you sure you want to disconnect Google Docs?')) {
      try {
        const result = await disconnectDocs()
        if (result.success) {
          setDocsStatus({ connected: false, email: null })
          alert('Google Docs disconnected successfully')
        } else {
          alert('Failed to disconnect Google Docs')
        }
      } catch (error) {
        console.error('Error disconnecting Docs:', error)
        alert('Failed to disconnect Google Docs. Please try again.')
      }
    }
  }

  // Handle Calendar connection
  const handleCalendarConnect = async () => {
    if (calendarStatus.connected) {
      // Already connected, navigate to chat page
      router.push('/calendar')
      return
    }

    // Not connected, initiate OAuth flow
    try {
      await connectCalendar()
    } catch (error) {
      console.error('Error connecting Calendar:', error)
      alert('Failed to connect Calendar. Please try again.')
    }
  }

  // Handle Calendar disconnect
  const handleCalendarDisconnect = async () => {
    if (!calendarStatus.connected) {
      return
    }

    if (confirm('Are you sure you want to disconnect Google Calendar?')) {
      try {
        const result = await disconnectCalendar()
        if (result.success) {
          setCalendarStatus({ connected: false })
          alert('Google Calendar disconnected successfully')
        } else {
          alert(result.error || 'Failed to disconnect Google Calendar')
        }
      } catch (error) {
        console.error('Error disconnecting Calendar:', error)
        alert('Failed to disconnect Google Calendar. Please try again.')
      }
    }
  }

  // Handle Meet connection
  const handleMeetConnect = async () => {
    if (meetStatus.connected) {
      return
    }

    try {
      await connectMeet()
    } catch (error) {
      console.error('Error connecting Meet:', error)
      alert('Failed to connect Google Meet. Please try again.')
    }
  }

  // Handle Meet disconnect
  const handleMeetDisconnect = async () => {
    if (!meetStatus.connected) {
      return
    }

    if (confirm('Are you sure you want to disconnect Google Meet?')) {
      try {
        const result = await disconnectMeet()
        if (result.success) {
          setMeetStatus({ connected: false })
          alert('Google Meet disconnected successfully')
        } else {
          alert(result.error || 'Failed to disconnect Google Meet')
        }
      } catch (error) {
        console.error('Error disconnecting Meet:', error)
        alert('Failed to disconnect Google Meet. Please try again.')
      }
    }
  }

  // Handle Microsoft Outlook connection
  const handleOutlookConnect = async () => {
    if (microsoftStatus.apps?.outlook) {
      return
    }
    try {
      await connectMicrosoftApp('outlook')
    } catch (error) {
      console.error('Error connecting Outlook:', error)
      alert('Failed to connect Outlook. Please try again.')
    }
  }

  // Handle Microsoft Outlook disconnect
  const handleOutlookDisconnect = async () => {
    if (!microsoftStatus.apps?.outlook) {
      return
    }
    if (confirm('Are you sure you want to disconnect Outlook?')) {
      try {
        const result = await disconnectMicrosoftApp('outlook')
        if (result.success) {
          setMicrosoftStatus(prev => ({
            ...prev,
            apps: { ...prev.apps, outlook: false }
          }))
          alert('Outlook disconnected successfully')
        } else {
          alert(result.error || 'Failed to disconnect Outlook')
        }
      } catch (error) {
        console.error('Error disconnecting Outlook:', error)
        alert('Failed to disconnect Outlook. Please try again.')
      }
    }
  }

  // Handle Microsoft Calendar connection
  const handleMsCalendarConnect = async () => {
    if (microsoftStatus.apps?.calendar) {
      return
    }
    try {
      await connectMicrosoftApp('calendar')
    } catch (error) {
      console.error('Error connecting Microsoft Calendar:', error)
      alert('Failed to connect Microsoft Calendar. Please try again.')
    }
  }

  // Handle Microsoft Calendar disconnect
  const handleMsCalendarDisconnect = async () => {
    if (!microsoftStatus.apps?.calendar) {
      return
    }
    if (confirm('Are you sure you want to disconnect Microsoft Calendar?')) {
      try {
        const result = await disconnectMicrosoftApp('calendar')
        if (result.success) {
          setMicrosoftStatus(prev => ({
            ...prev,
            apps: { ...prev.apps, calendar: false }
          }))
          alert('Microsoft Calendar disconnected successfully')
        } else {
          alert(result.error || 'Failed to disconnect Microsoft Calendar')
        }
      } catch (error) {
        console.error('Error disconnecting Microsoft Calendar:', error)
        alert('Failed to disconnect Microsoft Calendar. Please try again.')
      }
    }
  }

  // Handle OneDrive connection
  const handleOneDriveConnect = async () => {
    if (microsoftStatus.apps?.onedrive) {
      return
    }
    try {
      await connectMicrosoftApp('onedrive')
    } catch (error) {
      console.error('Error connecting OneDrive:', error)
      alert('Failed to connect OneDrive. Please try again.')
    }
  }

  // Handle OneDrive disconnect
  const handleOneDriveDisconnect = async () => {
    if (!microsoftStatus.apps?.onedrive) {
      return
    }
    if (confirm('Are you sure you want to disconnect OneDrive?')) {
      try {
        const result = await disconnectMicrosoftApp('onedrive')
        if (result.success) {
          setMicrosoftStatus(prev => ({
            ...prev,
            apps: { ...prev.apps, onedrive: false }
          }))
          alert('OneDrive disconnected successfully')
        } else {
          alert(result.error || 'Failed to disconnect OneDrive')
        }
      } catch (error) {
        console.error('Error disconnecting OneDrive:', error)
        alert('Failed to disconnect OneDrive. Please try again.')
      }
    }
  }

  // Handle Excel connection
  const handleExcelConnect = async () => {
    if (microsoftStatus.apps?.excel) {
      return
    }
    try {
      await connectMicrosoftApp('excel')
    } catch (error) {
      console.error('Error connecting Excel:', error)
      alert('Failed to connect Excel. Please try again.')
    }
  }

  // Handle Excel disconnect
  const handleExcelDisconnect = async () => {
    if (!microsoftStatus.apps?.excel) {
      return
    }
    if (confirm('Are you sure you want to disconnect Excel?')) {
      try {
        const result = await disconnectMicrosoftApp('excel')
        if (result.success) {
          setMicrosoftStatus(prev => ({
            ...prev,
            apps: { ...prev.apps, excel: false }
          }))
          alert('Excel disconnected successfully')
        } else {
          alert(result.error || 'Failed to disconnect Excel')
        }
      } catch (error) {
        console.error('Error disconnecting Excel:', error)
        alert('Failed to disconnect Excel. Please try again.')
      }
    }
  }

  // Handle Teams connection
  const handleTeamsConnect = async () => {
    if (microsoftStatus.apps?.teams) {
      return
    }
    try {
      await connectMicrosoftApp('teams')
    } catch (error) {
      console.error('Error connecting Teams:', error)
      alert('Failed to connect Teams. Please try again.')
    }
  }

  // Handle Teams disconnect
  const handleTeamsDisconnect = async () => {
    if (!microsoftStatus.apps?.teams) {
      return
    }
    if (confirm('Are you sure you want to disconnect Microsoft Teams?')) {
      try {
        const result = await disconnectMicrosoftApp('teams')
        if (result.success) {
          setMicrosoftStatus(prev => ({
            ...prev,
            apps: { ...prev.apps, teams: false }
          }))
          alert('Microsoft Teams disconnected successfully')
        } else {
          alert(result.error || 'Failed to disconnect Teams')
        }
      } catch (error) {
        console.error('Error disconnecting Teams:', error)
        alert('Failed to disconnect Teams. Please try again.')
      }
    }
  }

  // Handle Word connection
  const handleWordConnect = async () => {
    if (microsoftStatus.apps?.word) {
      return
    }
    try {
      await connectMicrosoftApp('word')
    } catch (error) {
      console.error('Error connecting Word:', error)
      alert('Failed to connect Word. Please try again.')
    }
  }

  // Handle Word disconnect
  const handleWordDisconnect = async () => {
    if (!microsoftStatus.apps?.word) {
      return
    }
    if (confirm('Are you sure you want to disconnect Microsoft Word?')) {
      try {
        const result = await disconnectMicrosoftApp('word')
        if (result.success) {
          setMicrosoftStatus(prev => ({
            ...prev,
            apps: { ...prev.apps, word: false }
          }))
          alert('Microsoft Word disconnected successfully')
        } else {
          alert(result.error || 'Failed to disconnect Word')
        }
      } catch (error) {
        console.error('Error disconnecting Word:', error)
        alert('Failed to disconnect Word. Please try again.')
      }
    }
  }

  // Refresh connection status
  const refreshConnectionStatus = async () => {
    try {
      console.log('Manually refreshing connection status...')
      
      // Refresh Gmail status
      const gmailStatusResult = await checkGmailStatus()
      setGmailStatus(gmailStatusResult)
      console.log('Updated Gmail status:', gmailStatusResult)
      
      // If Gmail connected, also refresh stats
      if (gmailStatusResult.connected) {
        const gmailStatsResult = await getGmailStats()
        setGmailStats(gmailStatsResult)
        console.log('Updated Gmail stats:', gmailStatsResult)
      }

      // Refresh GitHub status
      const githubStatusResult = await checkGitHubStatus()
      setGithubStatus(githubStatusResult)
      console.log('Updated GitHub status:', githubStatusResult)
      
      // If GitHub connected, also refresh stats
      if (githubStatusResult.connected) {
        const githubStatsResult = await getGitHubStats()
        setGithubStats(githubStatsResult)
        console.log('Updated GitHub stats:', githubStatsResult)
      }

      // Refresh Forms status
      const formsStatusResult = await checkFormsStatus()
      setFormsStatus(formsStatusResult)
      console.log('Updated Forms status:', formsStatusResult)

      // Refresh Calendar status
      const calendarStatusResult = await checkCalendarStatus()
      setCalendarStatus(calendarStatusResult)
      console.log('Updated Calendar status:', calendarStatusResult)

      // Refresh Meet status
      const meetStatusResult = await checkMeetStatus()
      setMeetStatus(meetStatusResult)
      console.log('Updated Meet status:', meetStatusResult)

      // Refresh Microsoft 365 status
      const microsoftStatusResult = await checkMicrosoftStatus()
      setMicrosoftStatus(microsoftStatusResult)
      console.log('Updated Microsoft status:', microsoftStatusResult)
    } catch (error) {
      console.error('Error refreshing connection status:', error)
    }
  }

  // Manual fetch and embed for Gmail
  const handleFetchAndEmbed = async () => {
    setIsProcessing(true)
    setProcessingStatus('Fetching Gmail messages...')
    
    try {
      const result = await fetchAndEmbedGmailMessages()
      
      if (result.success) {
        setProcessingStatus(`Successfully processed ${result.messages_fetched} messages and embedded ${result.messages_embedded} emails`)
        
        // Refresh stats after successful processing
        setTimeout(async () => {
          const stats = await getGmailStats()
          setGmailStats(stats)
        }, 1000)
      } else {
        setProcessingStatus(`Error: ${result.error}`)
      }
    } catch (error) {
      setProcessingStatus(`Error: ${error}`)
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProcessingStatus(''), 5000) // Clear status after 5 seconds
    }
  }

  // Dark scrollbar styles
  const scrollbarStyles = `
    .dark-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .dark-scrollbar::-webkit-scrollbar-track {
      background: #171717;
    }
    .dark-scrollbar::-webkit-scrollbar-thumb {
      background: #404040;
      border-radius: 3px;
    }
    .dark-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #525252;
    }
  `;

  return (
  <div className="flex h-screen bg-black">
      <style>{scrollbarStyles}</style>

      {/* WebSocket Debug Badge - bottom-left corner */}
      <SocketStatusBadge />

      {/* Sidebar */}
  <div className="w-72 bg-[#171717] text-white flex flex-col h-screen">
        {/* Logo/Brand Section */}
  <div className="p-4 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <img src="/polaris.png" alt="Polaris AI" className="w-11 h-11 object-contain" />
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-white">Polaris AI</p>
            </div>
          </div>
          {/* Search Bar */}
          {/* <div className="mt-4 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full h-10 pl-10 pr-4 bg-[#111111] border border-[#333333] rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#444444] transition-colors"
            />
          </div> */}
        </div>

        {/* Scrollable Content Area */}
  <div className="flex-1 overflow-y-auto dark-scrollbar p-4">
        {/* Navigation */}
  <nav className="flex flex-col">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveTab('Apps')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'Apps' 
                    ? 'bg-[#404040] text-white' 
                    : 'text-[#404040] hover:bg-[#404040] hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Apps</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('MainAgent')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'MainAgent'
                    ? 'bg-[#404040] text-white'
                    : 'text-white hover:bg-[#404040] hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Main Agent</span>
              </button>
            </li>
            {/* <li>
              <a
                href="/search"
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-white hover:bg-[#404040] hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Gmail Assistant</span>
              </a>
            </li> */}
            {/* <li>
              <a
                href="/github"
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-[#404040] hover:bg-[#404040] hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1.1-.4-2.1-1.1-2.8 1.9-.3 3.8-1.7 3.8-3.8 0-1.1-.4-2.1-1.1-2.8.3-1.5.3-3.1-.3-4.3-1-.3-3.2.7-4.4 1.4-1.3-.3-2.7-.3-4 0-1.2-.7-3.4-1.7-4.4-1.4-.6 1.2-.6 2.8-.3 4.3-.7.7-1.1 1.7-1.1 2.8 0 2.1 1.9 3.5 3.8 3.8-.7.7-1.1 1.7-1.1 2.8V19" />
                </svg>
                <span>GitHub Assistant</span>
              </a>
            </li> */}
            {/* <li>
              <a
                href="/forms"
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-[#404040] hover:bg-[#404040] hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Google Forms</span>
              </a>
            </li> */}
            {/* <li>
              <a
                href="/sheets"
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-[#404040] hover:bg-[#404040] hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Google Sheets</span>
              </a>
            </li>
            <li>
              <a
                href="/docs"
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-[#404040] hover:bg-[#404040] hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Google Docs</span>
              </a>
            </li>
            <li>
              <a
                href="/meet"
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-[#404040] hover:bg-[#404040] hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Google Meet</span>
              </a>
            </li> */}
          </ul>

          {/* Chat History Section */}
          <div className="mt-6 pt-4 border-t border-[#404040]">
            {/* Search Bar */}
            <div className="relative mb-3">
              <div className="bg-black h-10 relative rounded-lg flex items-center w-full">
                <div className="flex items-center justify-center shrink-0 px-2">
                  <svg className="w-4 h-4 text-[#A0A0A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-[#606060] pr-2"
                />
                <div className="absolute inset-0 rounded-lg border border-[#404040] pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-[#A0A0A0]">Recent Chats</h3>
              <button
                onClick={handleNewChat}
                className="flex items-center justify-center w-6 h-6 rounded hover:bg-[#404040] transition-colors"
                title="New Chat"
              >
                <svg className="w-4 h-4 text-[#A0A0A0] hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-1">
              {(() => {
                const allChats = [
                  ...groupedChats.today,
                  ...groupedChats.yesterday,
                  ...groupedChats.lastWeek,
                  ...groupedChats.lastMonth,
                  ...groupedChats.older,
                ];
                // Only show chats that have at least 1 message (like professional chat systems)
                const chatsWithMessages = allChats.filter(chat => chat.messageCount >= 1);
                const filteredChats = chatSearchQuery.trim()
                  ? chatsWithMessages.filter(chat => 
                      (chat.title || 'New conversation').toLowerCase().includes(chatSearchQuery.toLowerCase())
                    )
                  : chatsWithMessages;
                
                return filteredChats.slice(0, 10).map((chat) => (
                <div
                  key={chat.id}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    currentChatId === chat.id
                      ? 'bg-[#404040] text-white'
                      : 'text-[#A0A0A0] hover:bg-[#404040] hover:text-white'
                  }`}
                  onClick={() => {
                    handleChatSelect(chat.id)
                    setActiveTab('MainAgent')
                  }}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm truncate">{chat.title || 'New conversation'}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteChat(chat.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
                    title="Delete chat"
                  >
                    <svg className="w-4 h-4 text-[#A0A0A0] hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))})()}
              
              {(() => {
                const allChats = [
                  ...groupedChats.today,
                  ...groupedChats.yesterday,
                  ...groupedChats.lastWeek,
                  ...groupedChats.lastMonth,
                  ...groupedChats.older,
                ];
                // Only show chats with at least 1 message
                const chatsWithMessages = allChats.filter(chat => chat.messageCount >= 1);
                return chatsWithMessages.length === 0;
              })() && (
                <div className="text-[#606060] text-sm px-3 py-2">
                  No chats yet
                </div>
              )}
            </div>
          </div>

        </nav>
      </div>

          {/* Profile Dropdown at bottom - fixed */}
          <div className="p-4 pt-4 border-t border-[#404040] flex-shrink-0 bg-[#171717]">
            <ProfileDropdown 
              data={{
                name: user ? (user.first_name ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}` : user.email.split('@')[0]) : 'User',
                email: user?.email || 'user@example.com',
                avatar: user?.email ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}` : '',
                subscription: 'Free',
                model: 'Main Agent'
              }}
            />
          </div>
      </div>

      {/* Main Content */}
  <div className="flex-1 flex flex-col bg-black">
        {activeTab === 'MainAgent' ? (
          /* Main Agent Chat Content */
          <MainAgentContent 
            chatId={currentChatId}
            onChatIdChange={handleChatIdChange}
          />
        ) : (
          <AppsIntegrations
            gmailStatus={gmailStatus}
            githubStatus={githubStatus}
            formsStatus={formsStatus}
            sheetsStatus={sheetsStatus}
            docsStatus={docsStatus}
            calendarStatus={calendarStatus}
            meetStatus={meetStatus}
            microsoftStatus={microsoftStatus}
            isConnecting={isConnecting}
            isGithubConnecting={isGithubConnecting}
            onGmailConnect={handleGmailConnect}
            onGmailDisconnect={handleGmailDisconnect}
            onGithubConnect={handleGithubConnect}
            onGithubDisconnect={handleGithubDisconnect}
            onFormsConnect={handleFormsConnect}
            onFormsDisconnect={handleFormsDisconnect}
            onSheetsConnect={handleSheetsConnect}
            onSheetsDisconnect={handleSheetsDisconnect}
            onDocsConnect={handleDocsConnect}
            onDocsDisconnect={handleDocsDisconnect}
            onCalendarConnect={handleCalendarConnect}
            onCalendarDisconnect={handleCalendarDisconnect}
            onMeetConnect={handleMeetConnect}
            onMeetDisconnect={handleMeetDisconnect}
            onOutlookConnect={handleOutlookConnect}
            onOutlookDisconnect={handleOutlookDisconnect}
            onMsCalendarConnect={handleMsCalendarConnect}
            onMsCalendarDisconnect={handleMsCalendarDisconnect}
            onOneDriveConnect={handleOneDriveConnect}
            onOneDriveDisconnect={handleOneDriveDisconnect}
            onExcelConnect={handleExcelConnect}
            onExcelDisconnect={handleExcelDisconnect}
            onTeamsConnect={handleTeamsConnect}
            onTeamsDisconnect={handleTeamsDisconnect}
            onWordConnect={handleWordConnect}
            onWordDisconnect={handleWordDisconnect}
          />
        )}
      </div>
    </div>
  )
}

function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex h-screen bg-black items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <Dashboard />
    </Suspense>
  )
}

export default DashboardPage
'use client'

import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getStoredUser, signOut, User, isAuthenticated } from '../../lib/auth'
import { connectGmail, checkGmailStatus, GmailConnectionStatus, fetchAndEmbedGmailMessages, getGmailStats, disconnectGmail } from '../../lib/gmail'
import { connectGitHub, checkGitHubStatus, GitHubConnectionStatus, getGitHubStats, disconnectGitHub } from '../../lib/github'
import { checkFormsStatus, FormsConnectionStatus, disconnectForms } from '../../lib/forms'
import { checkSheetsStatus, SheetsConnectionStatus, disconnectSheets } from '../../lib/sheets'
import { checkDocsStatus, DocsConnectionStatus, disconnectDocs } from '../../lib/docs'
import { connectCalendar, checkCalendarStatus, CalendarConnectionStatus, disconnectCalendar } from '../../lib/calendar'
import { checkMeetStatus, MeetConnectionStatus, disconnectMeet } from '../../lib/meet'
import { MainAgentContent } from '../../components/MainAgentContent'
import ProfileDropdown from '../../components/kokonutui/profile-dropdown'
import AppsIntegrations from '../../components/apps-integrations'
import {
  createNewChatSession,
  deleteChatSession,
  getGroupedChatSessions,
  GroupedChats,
} from '../../lib/chatHistory'

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
  const [isConnecting, setIsConnecting] = useState(false)
  const [isGithubConnecting, setIsGithubConnecting] = useState(false)
  const [gmailStats, setGmailStats] = useState<any>(null)
  const [githubStats, setGithubStats] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string>('')
  
  // Chat history state
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [groupedChats, setGroupedChats] = useState<GroupedChats>({
    today: [],
    yesterday: [],
    lastWeek: [],
    lastMonth: [],
    older: [],
  })

  // Load chat history
  const loadChatHistory = useCallback(async () => {
    const grouped = await getGroupedChatSessions()
    setGroupedChats(grouped)
  }, [])

  // Handle new chat - MainAgentContent handles the logic internally
  // This is called from the sidebar but MainAgentContent will check if current chat is empty
  const handleNewChat = useCallback(async () => {
    // Check if the current chat is empty (has no messages)
    // If so, don't create a new session - just keep the current empty one
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
        // Current chat is empty, just switch to MainAgent tab without creating new session
        setActiveTab('MainAgent')
        return
      }
    }
    
    // The actual logic is handled in MainAgentContent.handleNewChat
    // This just triggers the component to handle new chat creation
    const newSession = await createNewChatSession()
    if (newSession) {
      setCurrentChatId(newSession.id)
      setActiveTab('MainAgent') // Switch to MainAgent tab after creating new chat
      await loadChatHistory()
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
        await loadChatHistory()
        if (chatIdToDelete === currentChatId) {
          await handleNewChat()
        }
      }
    }
  }, [currentChatId, loadChatHistory, handleNewChat])

  // Handle chat ID change from MainAgentContent
  const handleChatIdChange = useCallback((chatId: string) => {
    setCurrentChatId(chatId)
    loadChatHistory()
  }, [loadChatHistory])

  // Handle tab from URL params
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (tabFromUrl === 'MainAgent') {
      setActiveTab('MainAgent')
    }
  }, [searchParams])

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory()
  }, [loadChatHistory])

  useEffect(() => {
    // Check authentication first
    if (!isAuthenticated()) {
      router.push('/auth/signin')
      return
    }

    setUser(getStoredUser())
    
    // Check Gmail and GitHub connection status on load
    const checkConnections = async () => {
      try {
        // Gmail status
        const gmailStatusResult = await checkGmailStatus()
        setGmailStatus(gmailStatusResult)
        console.log('Gmail status:', gmailStatusResult)
        
        // If Gmail connected, also get stats
        if (gmailStatusResult.connected) {
          const gmailStatsResult = await getGmailStats()
          setGmailStats(gmailStatsResult)
          console.log('Gmail stats:', gmailStatsResult)
        }

        // GitHub status
        const githubStatusResult = await checkGitHubStatus()
        setGithubStatus(githubStatusResult)
        console.log('GitHub status:', githubStatusResult)
        
        // If GitHub connected, also get stats
        if (githubStatusResult.connected) {
          const githubStatsResult = await getGitHubStats()
          setGithubStats(githubStatsResult)
          console.log('GitHub stats:', githubStatsResult)
        }

        // Forms status
        const formsStatusResult = await checkFormsStatus()
        setFormsStatus(formsStatusResult)
        console.log('Forms status:', formsStatusResult)

        // Sheets status
        const sheetsStatusResult = await checkSheetsStatus()
        setSheetsStatus(sheetsStatusResult)
        console.log('Sheets status:', sheetsStatusResult)

        // Docs status
        const docsStatusResult = await checkDocsStatus()
        setDocsStatus(docsStatusResult)
        console.log('Docs status:', docsStatusResult)

        // Calendar status
        const calendarStatusResult = await checkCalendarStatus()
        setCalendarStatus(calendarStatusResult)
        console.log('Calendar status:', calendarStatusResult)

        // Meet status
        const meetStatusResult = await checkMeetStatus()
        setMeetStatus(meetStatusResult)
        console.log('Meet status:', meetStatusResult)
      } catch (error) {
        console.error('Error checking connection status:', error)
      }
    }
    
    // Check if we just came back from Docs OAuth
    const docsConnected = localStorage.getItem('docs_connected')
    if (docsConnected === 'true') {
      console.log('Detected Docs connection, refreshing status...')
      localStorage.removeItem('docs_connected')
      // Add a small delay to ensure DB write is complete
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
            <li>
              <a
                href="/search"
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-white hover:bg-[#404040] hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Gmail Assistant</span>
              </a>
            </li>
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
            isConnecting={isConnecting}
            isGithubConnecting={isGithubConnecting}
            onGmailConnect={handleGmailConnect}
            onGmailDisconnect={handleGmailDisconnect}
            onGithubConnect={handleGithubConnect}
            onGithubDisconnect={handleGithubDisconnect}
            onFormsConnect={() => window.location.href = '/forms'}
            onFormsDisconnect={handleFormsDisconnect}
            onSheetsConnect={() => window.location.href = '/sheets'}
            onSheetsDisconnect={handleSheetsDisconnect}
            onDocsConnect={() => window.location.href = '/docs'}
            onDocsDisconnect={handleDocsDisconnect}
            onCalendarConnect={handleCalendarConnect}
            onCalendarDisconnect={handleCalendarDisconnect}
            onMeetConnect={() => window.location.href = '/meet'}
            onMeetDisconnect={handleMeetDisconnect}
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
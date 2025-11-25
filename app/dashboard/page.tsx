'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getStoredUser, signOut, User, isAuthenticated } from '../../lib/auth'
import { connectGmail, checkGmailStatus, GmailConnectionStatus, fetchAndEmbedGmailMessages, getGmailStats, disconnectGmail } from '../../lib/gmail'
import { connectGitHub, checkGitHubStatus, GitHubConnectionStatus, getGitHubStats, disconnectGitHub } from '../../lib/github'
import { checkFormsStatus, FormsConnectionStatus, disconnectForms } from '../../lib/forms'
import { checkSheetsStatus, SheetsConnectionStatus, disconnectSheets } from '../../lib/sheets'
import { checkDocsStatus, DocsConnectionStatus, disconnectDocs } from '../../lib/docs'
import { connectCalendar, checkCalendarStatus, CalendarConnectionStatus, disconnectCalendar } from '../../lib/calendar'
import { checkMeetStatus, MeetConnectionStatus, disconnectMeet } from '../../lib/meet'

function Dashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('Apps')
  const [user, setUser] = useState<User | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
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
  const dropdownRef = useRef(null)

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
    
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !(dropdownRef.current as any).contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])
  
  type App = {
    id: string
    name: string
    icon: string
    publisher: string
    description: string
    pricing: string
    contact: {
      website: string
      email: string
    }
  }
  
  const [selectedApp, setSelectedApp] = useState<App | null>(null)

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

  const apps: App[] = [
    {
      id: 'gmail',
      name: 'Gmail',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg',
      publisher: 'Published by Google',
      description: 'Gmail is a free email service developed by Google. Users can access Gmail on the web and using third-party programs that synchronize email content through POP or IMAP protocols.',
      pricing: 'Free',
      contact: {
        website: 'gmail.com',
        email: 'support@gmail.com'
      }
    },
    {
      id: 'google-forms',
      name: 'Google Forms',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Google_Forms_2020_Logo.svg',
      publisher: 'Published by Google',
      description: 'Google Forms is a survey administration software included as part of the free, web-based Google Docs Editors suite offered by Google. Create forms, surveys, quizzes, and collect responses easily.',
      pricing: 'Free',
      contact: {
        website: 'forms.google.com',
        email: 'support@google.com'
      }
    },
    {
      id: 'google-sheets',
      name: 'Google Sheets',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg',
      publisher: 'Published by Google',
      description: 'Google Sheets is a spreadsheet program included as part of the free, web-based Google Docs Editors suite offered by Google. Create, edit, and collaborate on spreadsheets with AI-powered assistance.',
      pricing: 'Free',
      contact: {
        website: 'sheets.google.com',
        email: 'support@google.com'
      }
    },
    {
      id: 'google-docs',
      name: 'Google Docs',
      icon: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico',
      publisher: 'Published by Google',
      description: 'Google Docs is a word processor included as part of the free, web-based Google Docs Editors suite offered by Google. Create, edit, and collaborate on documents with AI-powered assistance.',
      pricing: 'Free',
      contact: {
        website: 'docs.google.com',
        email: 'support@google.com'
      }
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg',
      publisher: 'Published by Google',
      description: 'Google Calendar is a time-management and scheduling calendar service developed by Google. Schedule meetings, manage events, set reminders, and coordinate with teams using AI-powered assistance.',
      pricing: 'Free',
      contact: {
        website: 'calendar.google.com',
        email: 'support@google.com'
      }
    },
    {
      id: 'google-meet',
      name: 'Google Meet',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_%282020%29.svg',
      publisher: 'Published by Google',
      description: 'Google Meet is a video-communication service developed by Google. Create instant meeting links, view meeting history, access recordings, and manage participants with AI-powered assistance.',
      pricing: 'Free',
      contact: {
        website: 'meet.google.com',
        email: 'support@google.com'
      }
    },
    {
      id: 'slack',
      name: 'Slack',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg',
      publisher: 'Published by Slack Technologies',
      description: 'Slack is a cloud-based instant messaging platform developed by Slack Technologies. Slack offers many IRC-style features, including persistent chat rooms organized by topic, private groups, and direct messaging.',
      pricing: 'Freemium',
      contact: {
        website: 'slack.com',
        email: 'support@slack.com'
      }
    },
    {
      id: 'notion',
      name: 'Notion',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
      publisher: 'Published by Notion Labs',
      description: 'Notion is a freemium productivity and note-taking web application developed by Notion Labs Inc. It offers organizational tools including task management, project tracking, to-do lists, bookmarking, and more.',
      pricing: 'Freemium',
      contact: {
        website: 'notion.so',
        email: 'team@makenotion.com'
      }
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg',
      publisher: 'Published by GitHub Inc.',
      description: 'GitHub is a provider of Internet hosting for software development and version control using Git. It offers the distributed version control and source code management functionality of Git, plus its own features.',
      pricing: 'Freemium',
      contact: {
        website: 'github.com',
        email: 'support@github.com'
      }
    }
  ]

  return (
  <div className="flex h-screen bg-black">
      {/* Sidebar */}
  <div className="w-64 bg-[#171717] text-white flex flex-col">
        {/* User Profile Section */}
  <div className="p-4">
          <div className="flex items-center space-x-3">
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center space-x-2 focus:outline-none"
                onClick={() => setDropdownOpen((open) => !open)}
              >
                <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center text-sm font-medium">
                  {user ? (user.first_name ? user.first_name[0] : user.email[0]) : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate max-w-[100px] text-left">
                    {user ? (user.first_name ? user.first_name + (user.last_name ? ' ' + user.last_name : '') : user.email) : 'User'}
                  </p>
                </div>
                <svg className="w-4 h-4 text-[#404040] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-black border border-[#404040] rounded-lg shadow-lg z-50 text-white" style={{minWidth:'200px'}}>
                  <ul className="py-2">
                    <li><a href="#" className="flex items-center px-4 py-2 hover:bg-[#404040] text-sm">
                      <svg className="w-4 h-4 mr-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My profile
                    </a></li>
                    <li><a href="#" className="flex items-center px-4 py-2 hover:bg-[#404040] text-sm">
                      <svg className="w-4 h-4 mr-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      My settings
                    </a></li>
                    <li><a href="#" className="flex items-center px-4 py-2 hover:bg-[#404040] text-sm">
                      <svg className="w-4 h-4 mr-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Help
                    </a></li>
                    <li><hr className="my-2 border-[#404040]" /></li>
                    <li><button onClick={signOut} className="flex items-center w-full px-4 py-2 hover:bg-[#404040] text-sm text-left">
                      <svg className="w-4 h-4 mr-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button></li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
  <nav className="flex-1 p-4">
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
              <a
                href="/agent"
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="font-semibold">🤖 Main Agent</span>
              </a>
            </li>
            <li>
              <a
                href="/search"
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-[#404040] hover:bg-[#404040] hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Gmail Assistant</span>
              </a>
            </li>
            <li>
              <a
                href="/github"
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-[#404040] hover:bg-[#404040] hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1.1-.4-2.1-1.1-2.8 1.9-.3 3.8-1.7 3.8-3.8 0-1.1-.4-2.1-1.1-2.8.3-1.5.3-3.1-.3-4.3-1-.3-3.2.7-4.4 1.4-1.3-.3-2.7-.3-4 0-1.2-.7-3.4-1.7-4.4-1.4-.6 1.2-.6 2.8-.3 4.3-.7.7-1.1 1.7-1.1 2.8 0 2.1 1.9 3.5 3.8 3.8-.7.7-1.1 1.7-1.1 2.8V19" />
                </svg>
                <span>GitHub Assistant</span>
              </a>
            </li>
            <li>
              <a
                href="/forms"
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-[#404040] hover:bg-[#404040] hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Google Forms</span>
              </a>
            </li>
            <li>
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
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
  <div className="flex-1 flex flex-col bg-[#0F0F0F]">
        {/* Header */}
  <div className="bg-black p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">Connect Apps</h1>
              <p className="text-gray-300 mt-1">Manage your connected apps or change settings</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
  <div className="flex-1 p-6 bg-black">
          <div className="grid grid-cols-4 gap-6 h-full">
            {/* Left Panel - Categories */}
            <div className="bg-black rounded-lg p-4">
              <h3 className="font-semibold text-white mb-4">Apps</h3>
              <p className="text-gray-400 text-sm mb-4">Browse and manage your installed applications</p>
              
              <nav className="space-y-1">
                {apps.map((app) => (
                  <div 
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      selectedApp?.id === app.id 
                        ? 'bg-[#404040] text-white' 
                        : 'text-[#D4D4D4] hover:bg-[#404040] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {app.id === 'github' ? (
                        <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
                          <img src={app.icon} alt={app.name} className="w-6.5 h-6.5" />
                        </div>
                      ) : (
                        <img src={app.icon} alt={app.name} className="w-5 h-5" />
                      )}
                      <span className="text-sm">{app.name}</span>
                    </div>
                    {app.id === 'gmail' && gmailStatus.connected && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                    {app.id === 'google-forms' && formsStatus.connected && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                    {app.id === 'google-sheets' && sheetsStatus.connected && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                    {app.id === 'google-docs' && docsStatus.connected && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                    {app.id === 'google-calendar' && calendarStatus.connected && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                    {app.id === 'google-meet' && meetStatus.connected && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                    {app.id === 'github' && githubStatus.connected && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="col-span-3">
              {selectedApp ? (
                <div className="bg-black p-6">
                  {/* App Header */}
                  <div className="flex items-start space-x-4 mb-6">
                    {selectedApp.id === 'github' ? (
                      <div className="w-16 h-16 bg-white rounded flex items-center justify-center">
                        <img src={selectedApp.icon} alt={selectedApp.name} className="w-14 h-14" />
                      </div>
                    ) : (
                      <img src={selectedApp.icon} alt={selectedApp.name} className="w-16 h-16" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-3xl font-bold text-white">{selectedApp.name}</h2>
                      </div>
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="text-[#D4D4D4]">{selectedApp.name}</span>
                        <span className="text-[#D4D4D4]">•</span>
                        <span className="text-[#D4D4D4]">{selectedApp.publisher}</span>
                      </div>
                      {selectedApp.id === 'gmail' ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={handleGmailConnect}
                              disabled={isConnecting}
                              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                                gmailStatus.connected 
                                  ? 'bg-green-500 text-white cursor-default'
                                  : isConnecting
                                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                    : 'bg-white text-black hover:bg-gray-200'
                              }`}
                            >
                              {isConnecting ? 'Connecting...' : gmailStatus.connected ? '✓ Connected' : 'Connect Gmail'}
                            </button>
                            
                            {gmailStatus.connected && (
                              <>
                                <button
                                  onClick={handleFetchAndEmbed}
                                  disabled={isProcessing}
                                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    isProcessing
                                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                      : 'bg-blue-500 text-white hover:bg-blue-600'
                                  }`}
                                >
                                  {isProcessing ? 'Processing...' : 'Fetch & Embed Emails'}
                                </button>
                                
                                <button
                                  onClick={handleGmailDisconnect}
                                  className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                                >
                                  Disconnect
                                </button>
                              </>
                            )}
                            
                            <button
                              onClick={refreshConnectionStatus}
                              className="p-2 border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 rounded-lg transition-colors"
                              title="Refresh connection status"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          </div>
                          
                          {gmailStatus.connected && gmailStatus.email && (
                            <div className="text-sm text-green-400">
                              Connected as: {gmailStatus.email}
                            </div>
                          )}
                          
                          {processingStatus && (
                            <div className="text-sm text-blue-400 bg-blue-900/20 p-2 rounded">
                              {processingStatus}
                            </div>
                          )}
                          
                          {gmailStats && gmailStatus.connected && (
                            <div className="text-sm text-gray-400 space-y-1">
                              <div>Total Messages: {gmailStats.total_messages || 0}</div>
                              <div>Embedded Messages: {gmailStats.embedded_messages || 0}</div>
                              {gmailStats.missing_embeddings > 0 && (
                                <div className="text-yellow-400">Missing Embeddings: {gmailStats.missing_embeddings}</div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : selectedApp.id === 'github' ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={handleGithubConnect}
                              disabled={isGithubConnecting}
                              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                                githubStatus.connected 
                                  ? 'bg-green-500 text-white cursor-default'
                                  : isGithubConnecting
                                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                    : 'bg-white text-black hover:bg-gray-200'
                              }`}
                            >
                              {isGithubConnecting ? 'Connecting...' : githubStatus.connected ? '✓ Connected' : 'Connect GitHub'}
                            </button>
                            
                            {githubStatus.connected && (
                              <button
                                onClick={handleGithubDisconnect}
                                className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                              >
                                Disconnect
                              </button>
                            )}
                            
                            <button
                              onClick={refreshConnectionStatus}
                              className="p-2 border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 rounded-lg transition-colors"
                              title="Refresh connection status"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          </div>
                          
                          {githubStatus.connected && githubStatus.username && (
                            <div className="text-sm text-green-400">
                              Connected as: {githubStatus.username}
                            </div>
                          )}
                          
                          {githubStats && githubStatus.connected && (
                            <div className="text-sm text-gray-400 space-y-1">
                              <div>Total Repositories: {githubStats.total_repos || 0}</div>
                              <div>Public Repos: {githubStats.public_repos || 0}</div>
                              {githubStats.private_repos && githubStats.private_repos > 0 && (
                                <div>Private Repos: {githubStats.private_repos}</div>
                              )}
                              {githubStats.followers !== undefined && (
                                <div>Followers: {githubStats.followers}</div>
                              )}
                              {githubStats.following !== undefined && (
                                <div>Following: {githubStats.following}</div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : selectedApp.id === 'google-forms' ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <a
                              href="/forms"
                              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                                formsStatus.connected 
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : 'bg-white text-black hover:bg-gray-200'
                              }`}
                            >
                              {formsStatus.connected ? '✓ Connected - Open Assistant' : 'Connect Google Forms'}
                            </a>
                            
                            {formsStatus.connected && (
                              <button
                                onClick={handleFormsDisconnect}
                                className="px-4 py-2 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors font-semibold"
                              >
                                Disconnect
                              </button>
                            )}
                            
                            <button
                              onClick={refreshConnectionStatus}
                              className="p-2 border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 rounded-lg transition-colors"
                              title="Refresh connection status"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          </div>
                          
                          {formsStatus.connected && formsStatus.email && (
                            <div className="text-sm text-green-400">
                              Connected as: {formsStatus.email}
                            </div>
                          )}
                          
                          {formsStatus.connected && (
                            <div className="text-sm text-gray-400 space-y-1">
                              <div>AI-powered assistant to create, manage, and analyze your Google Forms</div>
                              <div className="text-blue-400 mt-2">Click "Open Assistant" to chat with your Forms AI agent</div>
                            </div>
                          )}
                        </div>
                      ) : selectedApp.id === 'google-sheets' ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <a
                              href="/sheets"
                              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                                sheetsStatus.connected 
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : 'bg-white text-black hover:bg-gray-200'
                              }`}
                            >
                              {sheetsStatus.connected ? '✓ Connected - Open Assistant' : 'Connect Google Sheets'}
                            </a>
                            
                            {sheetsStatus.connected && (
                              <button
                                onClick={handleSheetsDisconnect}
                                className="px-4 py-2 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors font-semibold"
                              >
                                Disconnect
                              </button>
                            )}
                            
                            <button
                              onClick={refreshConnectionStatus}
                              className="p-2 border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 rounded-lg transition-colors"
                              title="Refresh connection status"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          </div>
                          
                          {sheetsStatus.connected && sheetsStatus.email && (
                            <div className="text-sm text-green-400">
                              Connected as: {sheetsStatus.email}
                            </div>
                          )}
                          
                          {sheetsStatus.connected && (
                            <div className="text-sm text-gray-400 space-y-1">
                              <div>AI-powered assistant to create, manage, and analyze your Google Sheets</div>
                              <div className="text-emerald-400 mt-2">Click "Open Assistant" to chat with your Sheets AI agent</div>
                            </div>
                          )}
                        </div>
                      ) : selectedApp.id === 'google-docs' ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <a
                              href="/docs"
                              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                                docsStatus.connected 
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : 'bg-white text-black hover:bg-gray-200'
                              }`}
                            >
                              {docsStatus.connected ? '✓ Connected - Open Assistant' : 'Connect Google Docs'}
                            </a>
                            
                            {docsStatus.connected && (
                              <button
                                onClick={handleDocsDisconnect}
                                className="px-4 py-2 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors font-semibold"
                              >
                                Disconnect
                              </button>
                            )}
                            
                            <button
                              onClick={refreshConnectionStatus}
                              className="p-2 border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 rounded-lg transition-colors"
                              title="Refresh connection status"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          </div>
                          
                          {docsStatus.connected && docsStatus.email && (
                            <div className="text-sm text-green-400">
                              Connected as: {docsStatus.email}
                            </div>
                          )}
                          
                          {docsStatus.connected && (
                            <div className="text-sm text-gray-400 space-y-1">
                              <div>AI-powered assistant to create, edit, and manage your Google Docs</div>
                              <div className="text-blue-400 mt-2">Click "Open Assistant" to chat with your Docs AI agent</div>
                            </div>
                          )}
                        </div>
                      ) : selectedApp.id === 'google-calendar' ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={handleCalendarConnect}
                              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                                calendarStatus.connected 
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : 'bg-white text-black hover:bg-gray-200'
                              }`}
                            >
                              {calendarStatus.connected ? '✓ Connected - Open Assistant' : 'Connect Google Calendar'}
                            </button>
                            
                            {calendarStatus.connected && (
                              <button
                                onClick={handleCalendarDisconnect}
                                className="px-4 py-2 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors font-semibold"
                              >
                                Disconnect
                              </button>
                            )}
                            
                            <button
                              onClick={refreshConnectionStatus}
                              className="p-2 border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 rounded-lg transition-colors"
                              title="Refresh connection status"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          </div>
                          
                          {calendarStatus.connected && calendarStatus.email && (
                            <div className="text-sm text-green-400">
                              Connected as: {calendarStatus.email}
                            </div>
                          )}
                          
                          {calendarStatus.connected && (
                            <div className="text-sm text-gray-400 space-y-1">
                              <div>AI-powered assistant to schedule, manage, and organize your calendar events</div>
                              <div className="text-blue-400 mt-2">Click "Open Assistant" to chat with your Calendar AI agent</div>
                            </div>
                          )}
                        </div>
                      ) : selectedApp.id === 'google-meet' ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <a
                              href="/meet"
                              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                                meetStatus.connected 
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : 'bg-white text-black hover:bg-gray-200'
                              }`}
                            >
                              {meetStatus.connected ? '✓ Connected - Open Assistant' : 'Connect Google Meet'}
                            </a>
                            
                            {meetStatus.connected && (
                              <button
                                onClick={handleMeetDisconnect}
                                className="px-4 py-2 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors font-semibold"
                              >
                                Disconnect
                              </button>
                            )}
                            
                            <button
                              onClick={refreshConnectionStatus}
                              className="p-2 border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 rounded-lg transition-colors"
                              title="Refresh connection status"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          </div>
                          
                          {meetStatus.connected && meetStatus.email && (
                            <div className="text-sm text-green-400">
                              Connected as: {meetStatus.email}
                            </div>
                          )}
                          
                          {meetStatus.connected && (
                            <div className="text-sm text-gray-400 space-y-1">
                              <div>AI-powered assistant to create meetings, view history, access recordings, and manage participants</div>
                              <div className="text-blue-400 mt-2">Click "Open Assistant" to chat with your Meet AI agent</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button className="bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors font-semibold ml-0">
                          Connect App
                        </button>
                      )}
                    </div>
                  </div>

                  {/* App Description */}
                  <div className="mb-8">
                    <p className="text-[#D4D4D4] leading-relaxed">
                      {selectedApp.description}
                    </p>
                  </div>

                  {/* App Details */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-white font-semibold mb-2">Pricing</h3>
                      <p className="text-[#D4D4D4]">{selectedApp.pricing}</p>
                    </div>

                    <div>
                      <h3 className="text-white font-semibold mb-3">Contact</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-[#D4D4D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m0 0l4-4a4 4 0 105.656-5.656L11.5 8.5m0 0l3 3" />
                          </svg>
                          <span className="text-blue-400">{selectedApp.contact.website}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[#D4D4D4]">{selectedApp.contact.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Notice */}
                  <div className="mt-8 pt-6">
                    <p className="text-[#D4D4D4] text-sm">
                      Every app published on the Cal.com App Store is open source and thoroughly tested via peer reviews. Nevertheless, Cal.com, Inc. does not endorse or certify these apps unless they are published by Cal.com. If you encounter inappropriate content or behaviour please report it.
                    </p>
                    <button className="text-red-400 hover:text-red-300 text-sm mt-2 flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.896-.833-2.664 0L4.154 18.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span>Report app</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-[#404040] rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-[#404040]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Select an app</h3>
                    <p className="text-[#404040] mb-6 max-w-md mx-auto">
                      Choose an app from the sidebar to view its details and installation options
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
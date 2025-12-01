'use client'

import { Button } from '@/components/ui/button'
import { Loader2, Search, Link } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'
import { useState } from 'react'

interface AppIntegrationProps {
  gmailStatus: { connected: boolean; email?: string }
  githubStatus: { connected: boolean; username?: string }
  formsStatus: { connected: boolean; email?: string }
  sheetsStatus: { connected: boolean; email?: string }
  docsStatus: { connected: boolean; email?: string | null }
  calendarStatus: { connected: boolean; email?: string }
  meetStatus: { connected: boolean; email?: string }
  isConnecting: boolean
  isGithubConnecting: boolean
  onGmailConnect: () => void
  onGmailDisconnect: () => void
  onGithubConnect: () => void
  onGithubDisconnect: () => void
  onFormsConnect: () => void
  onFormsDisconnect: () => void
  onSheetsConnect: () => void
  onSheetsDisconnect: () => void
  onDocsConnect: () => void
  onDocsDisconnect: () => void
  onCalendarConnect: () => void
  onCalendarDisconnect: () => void
  onMeetConnect: () => void
  onMeetDisconnect: () => void
}

export default function AppsIntegrations({
  gmailStatus,
  githubStatus,
  formsStatus,
  sheetsStatus,
  docsStatus,
  calendarStatus,
  meetStatus,
  isConnecting,
  isGithubConnecting,
  onGmailConnect,
  onGmailDisconnect,
  onGithubConnect,
  onGithubDisconnect,
  onFormsConnect,
  onFormsDisconnect,
  onSheetsConnect,
  onSheetsDisconnect,
  onDocsConnect,
  onDocsDisconnect,
  onCalendarConnect,
  onCalendarDisconnect,
  onMeetConnect,
  onMeetDisconnect,
}: AppIntegrationProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const apps = [
    {
      title: "Gmail",
      description: "Access and manage your emails with AI assistance.",
      iconSrc: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg",
      category: "Email",
      connected: gmailStatus.connected,
      connectedEmail: gmailStatus.email,
      isLoading: isConnecting,
      onConnect: onGmailConnect,
      onDisconnect: onGmailDisconnect,
    },
    {
      title: "GitHub",
      description: "Manage repositories and collaborate on code.",
      iconSrc: "/git3.png",
      category: "Developer",
      connected: githubStatus.connected,
      connectedEmail: githubStatus.username,
      isLoading: isGithubConnecting,
      onConnect: onGithubConnect,
      onDisconnect: onGithubDisconnect,
    },
    {
      title: "Google Forms",
      description: "Create and manage surveys and forms.",
      iconSrc: "/Google_Forms_2020_Logo.svg.png",
      category: "Productivity",
      connected: formsStatus.connected,
      connectedEmail: formsStatus.email,
      onConnect: onFormsConnect,
      onDisconnect: onFormsDisconnect,
    },
    {
      title: "Google Sheets",
      description: "Work with spreadsheets using AI analysis.",
      iconSrc: "/Google_Sheets_logo_(2014-2020).svg.png",
      category: "Productivity",
      connected: sheetsStatus.connected,
      connectedEmail: sheetsStatus.email,
      onConnect: onSheetsConnect,
      onDisconnect: onSheetsDisconnect,
    },
    {
      title: "Google Docs",
      description: "Create and edit documents intelligently.",
      iconSrc: "/Google_Docs_logo_(2014-2020).svg.png",
      category: "Productivity",
      connected: docsStatus.connected,
      connectedEmail: docsStatus.email || undefined,
      onConnect: onDocsConnect,
      onDisconnect: onDocsDisconnect,
    },
    {
      title: "Google Calendar",
      description: "Schedule and manage your events seamlessly.",
      iconSrc: "/Google_Calendar_icon_(2020).svg.png",
      category: "Scheduling",
      connected: calendarStatus.connected,
      connectedEmail: calendarStatus.email,
      onConnect: onCalendarConnect,
      onDisconnect: onCalendarDisconnect,
    },
    {
      title: "Google Meet",
      description: "Create meetings and access recordings.",
      iconSrc: "/meet_new.png",
      category: "Communication",
      connected: meetStatus.connected,
      connectedEmail: meetStatus.email,
      onConnect: onMeetConnect,
      onDisconnect: onMeetDisconnect,
    },
  ]

  const filteredApps = apps.filter(app =>
    app.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <section className="h-full overflow-auto bg-black">
      <div className="py-10 px-8">
        <div className="mx-auto max-w-5xl">
          {/* Header with title on left and search on right */}
          <div className="flex items-center justify-between mb-16 mt-5">
            <h2 className="text-3xl font-bold text-white">
              Connect Your Apps
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-72 h-10 pl-10 pr-4 bg-[#111111] border border-[#333333] rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#444444] transition-colors"
              />
            </div>
          </div>

          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredApps.map((app) => (
              <IntegrationCard
                key={app.title}
                title={app.title}
                description={app.description}
                iconSrc={app.iconSrc}
                category={app.category}
                connected={app.connected}
                connectedEmail={app.connectedEmail}
                isLoading={app.isLoading}
                onConnect={app.onConnect}
                onDisconnect={app.onDisconnect}
              />
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-600 text-xs">
              More integrations coming soon.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

const IntegrationCard = ({
  title,
  description,
  iconSrc,
  category,
  connected,
  connectedEmail,
  isLoading,
  onConnect,
  onDisconnect,
}: {
  title: string
  description: string
  iconSrc: string
  category: string
  connected: boolean
  connectedEmail?: string
  isLoading?: boolean
  onConnect: () => void
  onDisconnect: () => void
}) => {
  return (
    <div className="group relative bg-[#111111] border border-[#222222] rounded-xl p-5 hover:border-[#333333] hover:bg-[#141414] transition-all duration-300">
      {/* Status indicator */}
      {connected && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          <span className="text-[10px] text-green-500 font-medium uppercase tracking-wide">Connected</span>
        </div>
      )}

      {/* Icon and Title with badge in a row */}
      <div className="flex items-start gap-4 mb-3">
        <Image
          src={iconSrc}
          alt={title}
          width={44}
          height={44}
          className="object-contain mt-2"
        />
        <div className="flex flex-col">
          <h3 className="text-[17px] font-semibold text-white mt-1.5">{title}</h3>
          <span className="inline-block w-fit px-2 py-0.5 mt-2 bg-[#1a2a3a] text-blue-400 text-[12px] font-medium rounded-md  tracking-wide">
            {category}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-400 text-xs leading-relaxed mb-3">{description}</p>

      {/* Connected email info */}
      {connected && connectedEmail && (
        <p className="text-[11px] text-gray-400 mb-3 truncate">
          {title === 'GitHub' ? `@${connectedEmail}` : connectedEmail}
        </p>
      )}

      {/* Action Button */}
      <Button
        onClick={connected ? onDisconnect : onConnect}
        disabled={isLoading}
        size="sm"
        className={`w-auto h-9 text-xs font-medium rounded-lg transition-all duration-200 ${
          connected
            ? 'bg-gray-800 text-gray-200 hover:bg-red-600 hover:text-white'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            Connecting...
          </>
        ) : connected ? (
          'Disconnect'
        ) : (
          <>
            <Link className="mr-1.5 h-3.5 w-3.5" />
            Connect
          </>
        )}
      </Button>
    </div>
  )
}
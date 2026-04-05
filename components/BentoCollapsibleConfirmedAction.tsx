'use client';

import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';

// Get the app logo based on agent name or action type
const getAppLogo = (agentName?: string, actionType?: string): { src: string; alt: string } => {
  // Microsoft services
  if (agentName === 'microsoft') {
    if (actionType === 'send_email' || actionType?.includes('email')) {
      return { src: '/Microsoft_Outlook_Icon_(2025–present).svg.png', alt: 'Outlook' };
    }
    if (actionType === 'create_event' || actionType?.includes('calendar')) {
      return { src: '/microsoft-calendar-logo.png', alt: 'Microsoft Calendar' };
    }
    if (actionType === 'create_spreadsheet' || actionType?.includes('excel') || actionType?.includes('sheet') || actionType?.includes('workbook')) {
      return { src: '/Microsoft_Office_Excel_(2025–present).svg.png', alt: 'Microsoft Excel' };
    }
    if (actionType === 'create_document' || actionType?.includes('word') || actionType?.includes('doc')) {
      return { src: '/Microsoft_Office_Word_(2025–present).svg.png', alt: 'Microsoft Word' };
    }
    if (actionType?.includes('teams')) {
      return { src: '/Microsoft_Office_Teams_(2025–present).svg.png', alt: 'Microsoft Teams' };
    }
    if (actionType?.includes('onedrive') || actionType?.includes('file')) {
      return { src: '/Microsoft_OneDrive_Icon_(2025_-_present).svg.png', alt: 'OneDrive' };
    }
    // Default Microsoft
    return { src: '/Microsoft_Outlook_Icon_(2025–present).svg.png', alt: 'Microsoft' };
  }
  
  // Google services
  if (agentName === 'gmail' || actionType === 'send_email') {
    return { src: '/gmail.png', alt: 'Gmail' };
  }
  if (agentName === 'calendar' || actionType === 'create_event') {
    return { src: '/Google_Calendar_icon_(2020).svg.png', alt: 'Google Calendar' };
  }
  if (agentName === 'docs' || actionType === 'create_document') {
    return { src: '/Google_Docs_logo_(2014-2020).svg.png', alt: 'Google Docs' };
  }
  if (agentName === 'sheets') {
    return { src: '/Google_Sheets_logo_(2014-2020).svg.png', alt: 'Google Sheets' };
  }
  if (agentName === 'forms' || actionType === 'create_form') {
    return { src: '/Google_Forms_2020_Logo.svg.png', alt: 'Google Forms' };
  }
  if (agentName === 'meet' || actionType === 'create_meeting') {
    return { src: '/meet_new.png', alt: 'Google Meet' };
  }
  if (agentName === 'drive') {
    return { src: '/Google_Drive.png', alt: 'Google Drive' };
  }
  
  // GitHub
  if (agentName === 'github') {
    return { src: '/github.png', alt: 'GitHub' };
  }
  
  // Flights
  if (agentName === 'flights') {
    return { src: '/airIndia.png', alt: 'Flights' };
  }
  
  // Default
  return { src: '/polaris.png', alt: 'Polaris' };
};

// Custom Email Preview Renderer for Bento (only Subject and Body)
const BentoEmailPreviewRenderer = ({ content }: { content: string }) => {
  const lines = content.split('\n').filter(line => line.trim());
  
  // Parse fields
  let subject = '';
  let bodyContent = '';
  let inBody = false;
  
  for (const line of lines) {
    const cleanLine = line.replace(/\*\*/g, '').trim();
    
    // Match Subject field
    if (cleanLine.toLowerCase().startsWith('subject:')) {
      subject = cleanLine.replace(/^subject:\s*/i, '').trim();
      continue;
    }
    
    // Check for body/email content start
    if (cleanLine.toLowerCase().startsWith('email body:') || cleanLine.toLowerCase().startsWith('email content:')) {
      inBody = true;
      const valueAfterLabel = cleanLine.replace(/^email\s+(body|content):\s*/i, '').trim();
      if (valueAfterLabel) {
        bodyContent = valueAfterLabel;
      }
      continue;
    }
    
    // Collect body content
    if (inBody && cleanLine && !cleanLine.toLowerCase().startsWith('to:')) {
      bodyContent += (bodyContent ? '\n' : '') + cleanLine;
    }
  }

  return (
    <div className="space-y-0">
      {/* Subject */}
      <div className="pt-1 pb-4 border-b border-white/[0.06]">
        <p className="text-white/40 text-xs mb-1.5">Subject</p>
        <p className="text-white font-medium text-[15px]">{subject || 'No subject'}</p>
      </div>
      
      {/* Email Body */}
      {bodyContent && (
        <div className="pt-4">
          <p className="text-white/40 text-xs mb-2">Email Content</p>
          <div className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed bg-white/[0.02] rounded-xl p-4 border border-white/[0.06]">
            {bodyContent}
          </div>
        </div>
      )}
    </div>
  );
};

interface BentoCollapsibleConfirmedActionProps {
  content: string;
  actionType?: string;
  agentName?: string;
  description?: string;
  recipientEmail?: string;
  autoToggle?: boolean;
  autoToggleInterval?: number;
}

// EXACT duplicate of CollapsibleConfirmedAction from MainAgentContent
// Can be customized independently for bentogrid without affecting main chat
export const BentoCollapsibleConfirmedAction = ({ 
  content, 
  actionType, 
  agentName, 
  description,
  recipientEmail,
  autoToggle = false,
  autoToggleInterval = 4000
}: BentoCollapsibleConfirmedActionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-toggle effect
  useEffect(() => {
    if (!autoToggle) return;

    const timer = setInterval(() => {
      setIsExpanded(prev => !prev);
    }, autoToggleInterval);

    return () => clearInterval(timer);
  }, [autoToggle, autoToggleInterval]);
  
  // Get the app logo
  const appLogo = getAppLogo(agentName, actionType);
  
  // Use provided recipientEmail or extract from content (for backward compatibility)
  const displayRecipient = recipientEmail || (() => {
    if (actionType === 'send_email') {
      const toMatch = content.match(/\*\*To\*\*:\s*([^\n]+)/);
      if (toMatch) {
        return toMatch[1].trim();
      }
    }
    return null;
  })();
  
  const previewContent = content;
  
  // Get action badge text
  const getActionBadge = () => {
    if (actionType === 'send_email') return 'sendEmail';
    if (actionType === 'create_event') return 'createEvent';
    if (actionType === 'create_document') return 'createDoc';
    if (actionType === 'create_form') return 'createForm';
    if (actionType === 'create_meeting') return 'createMeet';
    return 'confirmed';
  };
  
  return (
    <div className="max-w-3xl w-full">
      {/* Collapsible Bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full rounded-xl bg-[#1a1a1a]/80 border border-white/[0.06] px-4 py-2.5 hover:bg-[#1f1f1f]/80 hover:border-white/[0.08] transition-all duration-300"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* App Logo */}
            <div className="flex-shrink-0">
              <Image 
                src={appLogo.src} 
                alt={appLogo.alt} 
                width={22} 
                height={22} 
                className="object-contain"
              />
            </div>
            
            {/* Main info */}
            <div className="text-left flex-1 min-w-0">
              <span className="text-sm font-medium text-white/90 truncate block">{description || 'Action Confirmed'}</span>
              {actionType === 'send_email' && displayRecipient && (
                <span className="text-xs truncate block mt-0.5">
                  <span className="text-white/40">To:</span> <span className="font-bold text-emerald-400">{displayRecipient}</span>
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Action badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/20">
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">{getActionBadge()}</span>
            </div>
            
            {/* Dropdown arrow */}
            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-white/40">
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-1.5 rounded-xl bg-[#1a1a1a]/90 border border-white/[0.06] overflow-hidden">
          <div className="p-5">
            <div 
              className="space-y-3"
              style={{ 
                fontFamily: 'Inter, "Inter Fallback"',
                fontSize: '14px',
                lineHeight: '22px',
              }}
            >
              {actionType === 'send_email' ? (
                <BentoEmailPreviewRenderer content={previewContent} />
              ) : previewContent ? (
                <span className="text-white/40">Preview content</span>
              ) : (
                <span className="text-white/40">No preview content available</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

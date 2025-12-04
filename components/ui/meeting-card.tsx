'use client';

import React from 'react';
import { Copy, ExternalLink, User, Video, Calendar } from 'lucide-react';

interface MeetingCardProps {
  title?: string;
  date?: string;
  time?: string;
  meetingCode?: string;
  meetingLink?: string;
  host?: string;
  hostEmail?: string;
}

export function MeetingCard({
  title = 'Google Meet',
  date,
  time,
  meetingCode,
  meetingLink,
  host,
  hostEmail
}: MeetingCardProps) {
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    await navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleJoin = () => {
    if (meetingLink) {
      window.open(meetingLink, '_blank', 'noopener,noreferrer');
    }
  };

  // Format date and time for display
  const formatDateTime = () => {
    if (date && time) {
      return `${date} · ${time}`;
    }
    if (date) return date;
    if (time) return time;
    return null;
  };

  return (
    <div className="w-full max-w-md my-4">
      <div className="w-full bg-[#1a1a1a] rounded-2xl shadow-lg p-5 border border-neutral-800">
        {/* Header */}
        <div className="mb-5">
          <div className="text-green-500 text-sm font-medium mb-1">Google Meet</div>
          <h1 className="text-xl font-normal text-white mb-2">{title}</h1>
          {formatDateTime() && (
            <div className="text-gray-400 text-sm">{formatDateTime()}</div>
          )}
        </div>

        {/* Meeting Details */}
        <div className="space-y-3 mb-5">
          {/* Meeting Code */}
          {meetingCode && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Meeting code</div>
                  <div className="text-sm font-medium text-white">{meetingCode}</div>
                </div>
              </div>
              <button 
                onClick={() => copyToClipboard(meetingCode, 'code')}
                className="px-3 py-1 text-xs font-medium text-gray-300 bg-neutral-800 rounded-full hover:bg-neutral-700 border border-neutral-700"
              >
                {copiedCode ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}

          {/* Link */}
          {meetingLink && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Link</div>
                  <div className="text-sm font-medium text-white truncate max-w-[160px]">
                    {meetingLink.replace('https://', '')}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => copyToClipboard(meetingLink, 'link')}
                className="px-3 py-1 text-xs font-medium text-gray-300 bg-neutral-800 rounded-full hover:bg-neutral-700 border border-neutral-700"
              >
                {copiedLink ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          )}

          {/* Host - Always show if we have any host info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Host</div>
              <div className="text-sm font-medium text-white">{host || hostEmail || 'You'}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={handleJoin}
            className="flex-1 bg-neutral-800 text-white font-medium py-2.5 px-4 rounded-full hover:bg-neutral-700 flex items-center justify-center gap-2 border border-neutral-700"
          >
            <Video className="w-4 h-4" />
            Join
          </button>
          <button className="flex-1 bg-transparent text-gray-300 font-medium py-2.5 px-4 rounded-full hover:bg-neutral-800 border border-neutral-700 flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Add to calendar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

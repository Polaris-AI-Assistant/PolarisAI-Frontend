'use client';

import React from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

interface EventCardProps {
  title: string;
  date: string;
  time: string;
  duration?: string;
  location?: string;
  meetLink?: string;
  attendees?: string[];
  description?: string;
}

export function EventCard({
  title,
  date,
  time,
  duration,
  location,
  meetLink,
  attendees = [],
  description
}: EventCardProps) {
  return (
    <div className="w-full max-w-2xl mx-auto my-6">
      <div className="relative backdrop-blur-xl bg-gradient-to-br from-gray-800/50 via-gray-900/40 to-black/50 rounded-2xl border border-white/[0.15] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {/* Google Calendar Logo */}
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" 
            alt="Google Calendar"
            className="w-6 h-6"
          />
          <h3 className="text-white/90 text-sm font-medium">Google Calendar</h3>
          <div className="ml-auto w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
        </div>

        {/* Event Title Section - Inner Card */}
        <div className="mb-4 bg-white/[0.03] backdrop-blur-sm rounded-xl border border-white/[0.08] p-4 hover:bg-white/[0.05] transition-colors">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-white/40 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white/50 text-xs mb-1">Event Title</p>
              <p className="text-white text-base font-medium">{title}</p>
            </div>
          </div>
        </div>

        {/* Date & Time Section - Inner Card */}
        <div className="mb-4 bg-white/[0.03] backdrop-blur-sm rounded-xl border border-white/[0.08] p-4 hover:bg-white/[0.05] transition-colors">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-white/40 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white/50 text-xs mb-2">Date & Time</p>
              {date && <p className="text-white text-sm font-normal mb-1">{date}</p>}
              {time && <p className="text-white text-sm font-normal mb-1">{time}</p>}
              {duration && (
                <p className="text-white/50 text-xs mt-1">{duration}</p>
              )}
            </div>
          </div>
        </div>

        {/* Location Section - Inner Card */}
        {(location || meetLink) && (
          <div className="mb-4 bg-white/[0.03] backdrop-blur-sm rounded-xl border border-white/[0.08] p-4 hover:bg-white/[0.05] transition-colors">
            <p className="text-white/50 text-xs mb-2">Location</p>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
              <a 
                href={meetLink || location}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 text-sm hover:text-white transition-colors break-all"
              >
                {meetLink || location}
              </a>
            </div>
          </div>
        )}

        {/* Attendees Section - Inner Card */}
        {attendees.length > 0 && (
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl border border-white/[0.08] p-4 hover:bg-white/[0.05] transition-colors">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-white/40 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-white/50 text-xs mb-2">Attendees ({attendees.length})</p>
                <div className="space-y-2">
                  {attendees.map((attendee, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <p className="text-white text-sm">{attendee}</p>
                      <span className="text-white/60 text-xs">Will be Invited</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

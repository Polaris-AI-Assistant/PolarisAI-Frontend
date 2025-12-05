'use client';

import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: black;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #262626;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #404040;
  }
`;

import { isAuthenticated } from '../lib/auth';
import {
  processQueryStreaming,
  StreamChunk,
  getAgentExamples,
  checkAgentHealth,
  formatAgentName,
  getAgentIcon,
  getActionTypeIcon,
  ConversationMessage,
  ConfirmationRequest,
  confirmActionStreaming,
  cancelAction,
  UserLocation,
} from '../lib/mainAgent';
import {
  ChatMessage,
  createNewChatSession,
  getChatSession,
  updateChatSession,
  deleteChatSession,
  getGroupedChatSessions,
  migrateOldConversation,
  GroupedChats,
} from '../lib/chatHistory';
import { addMemory } from '../lib/memory';
import { getUserLocation, requiresLocation } from '../lib/geolocation';
import { useLocationStore } from '../lib/stores/locationStore';
import { VercelV0Chat } from '@/components/ui/v0-ai-chat';
import { ThinkingIndicator } from '@/components/ui/thinking-indicator';
import { Calendar, FileText, ClipboardList, Github, Video, Check, X, Mail, AlertCircle, Brain } from 'lucide-react';
import { MeetingCard } from '@/components/ui/meeting-card';
import { FlightResultsInline, FlightData } from '@/components/ui/flight-results-card';

// Helper function to format markdown-style text
const formatMessageContent = (content: string) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inListItem = false;
  
  lines.forEach((line, lineIndex) => {
    if (line.trim() === '') {
      elements.push(<div key={`br-${lineIndex}`} className="h-3" />);
      inListItem = false;
      return;
    }
    
    const numberedListMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberedListMatch) {
      const [, number, restOfLine] = numberedListMatch;
      inListItem = true;
      elements.push(
        <div key={lineIndex} className="flex gap-3 mb-2 mt-3">
          <span className="text-gray-400 font-medium min-w-[24px] flex-shrink-0">{number}.</span>
          <div className="flex-1 text-white">{parseInlineFormatting(restOfLine)}</div>
        </div>
      );
      return;
    }
    
    const bulletMatch = line.match(/^(\s*)[\-•]\s+(.+)$/);
    if (bulletMatch) {
      const [, , restOfLine] = bulletMatch;
      
      elements.push(
        <div key={lineIndex} className="flex gap-2 ml-8 mb-1">
          <span className="text-gray-500 flex-shrink-0 mt-0.5">•</span>
          <div className="flex-1 text-gray-300 text-[15px]">{parseInlineFormatting(restOfLine)}</div>
        </div>
      );
      return;
    }
    
    inListItem = false;
    elements.push(
      <div key={lineIndex} className="mb-2 text-gray-200">
        {parseInlineFormatting(line)}
      </div>
    );
  });
  
  return elements;
};

// Helper function to parse inline formatting (bold, links)
const parseInlineFormatting = (text: string) => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  
  while (remaining.length > 0) {
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const [fullMatch, linkText, url] = linkMatch;
      const index = remaining.indexOf(fullMatch);
      
      if (index > 0) {
        const beforeText = remaining.slice(0, index);
        parts.push(...parseBoldText(beforeText, key++));
      }
      
      parts.push(
        <a
          key={`link-${key++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
        >
          {linkText}
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      );
      
      remaining = remaining.slice(index + fullMatch.length);
      continue;
    }
    
    parts.push(...parseBoldText(remaining, key++));
    break;
  }
  
  return parts;
};

// Helper function to parse bold text
const parseBoldText = (text: string, baseKey: number | string) => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    if (boldMatch) {
      const [fullMatch, boldText] = boldMatch;
      const index = remaining.indexOf(fullMatch);
      
      if (index > 0) {
        parts.push(remaining.slice(0, index));
      }
      
      parts.push(
        <strong key={`${baseKey}-bold-${key++}`} className="font-semibold text-white">
          {boldText}
        </strong>
      );
      
      remaining = remaining.slice(index + fullMatch.length);
      continue;
    }
    
    if (remaining) {
      parts.push(remaining);
    }
    break;
  }
  
  return parts;
};

// Helper function to extract Google Meet meeting info from message
const extractMeetingInfo = (content: string) => {
  // Check if there's a Google Meet link in the content
  const hasMeetLink = /https:\/\/meet\.google\.com\/[a-z0-9\-]+/i.test(content);
  
  if (!hasMeetLink) return null;
  
  // Check if this mentions creating a meeting/event with Google Meet
  const isMeetCreation = /(?:google meet|meeting|video call).*(?:created|ready|has been created|scheduled)/i.test(content) ||
                        /your.*(?:meet|meeting|event).*created/i.test(content) ||
                        /created.*(?:meet|meeting|event)/i.test(content) ||
                        /successfully created/i.test(content) ||
                        /google meet link:/i.test(content) ||
                        /join.*meeting/i.test(content);
  
  if (!isMeetCreation) return null;
  
  const meetingInfo: {
    title?: string;
    date?: string;
    time?: string;
    meetingCode?: string;
    meetingLink?: string;
    host?: string;
    hostEmail?: string;
  } = {};

  // Extract meeting link and code
  const meetLinkMatch = content.match(/https:\/\/meet\.google\.com\/([a-z0-9\-]+)/i);
  if (meetLinkMatch) {
    meetingInfo.meetingLink = meetLinkMatch[0];
    meetingInfo.meetingCode = meetLinkMatch[1]; // Extract the code part (abc-defg-hij)
  }

  // Extract title - look for various patterns
  // Pattern 1: "Event Title:" or "**Event Title:**"
  const eventTitleMatch = content.match(/\*?\*?Event Title:?\*?\*?\s*([^\n*]+)/i);
  if (eventTitleMatch) {
    const title = eventTitleMatch[1].trim().replace(/\*\*/g, '');
    // Validate title isn't just date/time info
    const isJustDateTime = /^(\d|at|on|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|\s|st|nd|rd|th|am|pm|:|-|,|\.)+$/i.test(title);
    if (title && !isJustDateTime && title.toLowerCase() !== 'new event' && title.toLowerCase() !== 'event') {
      meetingInfo.title = title;
    }
  }
  
  // Pattern 2: Bold title or meeting name
  if (!meetingInfo.title) {
    const titleMatch = content.match(/(?:created|scheduled).*?["']([^"']+)["']/i) ||
                       content.match(/event.*?["']([^"']+)["']/i);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      const isJustDateTime = /^(\d|at|on|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|\s|st|nd|rd|th|am|pm|:|-|,|\.)+$/i.test(title);
      if (!isJustDateTime && !/successfully|created|your/i.test(title)) {
        meetingInfo.title = title;
      }
    }
  }

  // Extract date
  const dateMatch = content.match(/\*?\*?Date:?\*?\*?\s*([A-Za-z]+,?\s+[A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
                    content.match(/((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s+\w+\s+\d{1,2},?\s+\d{4})/i) ||
                    content.match(/(\w+day,\s+\w+\s+\d{1,2},\s+\d{4})/i);
  if (dateMatch) {
    meetingInfo.date = dateMatch[1].trim().replace(/\*\*/g, '');
  }

  // Extract time
  const timeMatch = content.match(/\*?\*?Time:?\*?\*?\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?(?:\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)?)/i) ||
                    content.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM))/i);
  if (timeMatch) {
    meetingInfo.time = timeMatch[1].trim().replace(/\*\*/g, '');
  }

  // Extract host/email from the response
  const hostMatch = content.match(/(?:host|organizer|created by|your account)[:\s]+([^\n]+)/i);
  if (hostMatch) {
    const hostValue = hostMatch[1].trim().replace(/[*"']/g, '');
    if (hostValue.includes('@')) {
      meetingInfo.hostEmail = hostValue;
    } else {
      meetingInfo.host = hostValue;
    }
  }

  // Only return if we have a meeting link (essential for a meeting card)
  if (meetingInfo.meetingLink) {
    return meetingInfo;
  }

  return null;
};

// Helper function to extract flight info from message content
const extractFlightInfo = (content: string): FlightData | null => {
  // Check if this is a flight search response
  const isFlightResponse = 
    /(?:found|here are|showing|available).*flights?/i.test(content) ||
    /flights?.*(?:from|between|to)/i.test(content) ||
    /₹[\d,]+/i.test(content) ||
    /(?:indigo|air india|spicejet|vistara|akasa|goair|airindia|emirates|lufthansa|british airways|qatar|singapore|etihad)/i.test(content) ||
    /(?:best flight|flight option|other flight)/i.test(content);
    
  if (!isFlightResponse) return null;

  // Extract route info - look for "Pune to Indore" or "from Pune to Indore" or "Pune (PNQ) to Indore (IDR)"
  // Be careful to not capture trailing words like "for", "on", etc.
  const routeMatch = content.match(/(?:from\s+)?([A-Z][a-z]+)\s*(?:\([A-Z]{3}\))?\s+to\s+([A-Z][a-z]+)(?:\s*\([A-Z]{3}\))?/i) ||
                     content.match(/([A-Z]{3})\s*[-→]\s*([A-Z]{3})/i) ||
                     content.match(/(?:flights?\s+from\s+)([A-Z][a-z]+)\s+to\s+([A-Z][a-z]+)/i);
  
  // Extract date - look for "December 16, 2025" format
  const dateMatch = content.match(/((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/i) ||
                    content.match(/(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*,?\s*\d{4})/i) ||
                    content.match(/(\d{4}-\d{2}-\d{2})/i);

  // Parse individual flight entries using the structured format from AI
  const flights: Array<{
    airline: string;
    flightNumber?: string;
    price: number;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    stops: number;
  }> = [];

  // Extract using structured patterns matching AI response format:
  // - **Airline:** IndiGo
  // - **Flight Number:** 6E 284  
  // - **Price:** ₹6,048
  // - **Departure:** 05:15 AM from Pune International Airport (PNQ)
  // - **Arrival:** 06:40 AM at Devi Ahilyabai Holkar International Airport (IDR)
  
  // Airline code to name mapping
  const airlineCodeMap: Record<string, string> = {
    '6E': 'IndiGo',
    'AI': 'Air India',
    'SG': 'SpiceJet',
    'UK': 'Vistara',
    'QP': 'Akasa Air',
    'G8': 'Go First',
    'I5': 'AirAsia India',
    'IX': 'Air India Express',
    '9I': 'Alliance Air',
    'EK': 'Emirates',
    'QR': 'Qatar Airways',
    'SQ': 'Singapore Airlines',
    'LH': 'Lufthansa',
    'BA': 'British Airways',
    'EY': 'Etihad'
  };

  // Find flight numbers first - match "Flight Number: 6E 284" or standalone "6E284", "AI1804"
  const flightNumbers: string[] = [];
  const fnMatches = content.matchAll(/(?:\*\*)?(?:flight\s*(?:number|no\.?)?)(?:\*\*)?[:\s]+\*?\*?([A-Z]{1,2}\s*\d{2,4})(?:\*\*)?/gi);
  for (const m of fnMatches) {
    flightNumbers.push(m[1].replace(/\s+/g, ''));
  }

  // Find all airlines - multiple patterns
  const airlines: string[] = [];
  
  // Pattern 1: Numbered list with bold airline name "1. **IndiGo**" or "1. IndiGo"
  const numberedAirlineMatches = content.matchAll(/\d+\.\s*\*?\*?(IndiGo|Air India|SpiceJet|Vistara|Akasa Air|Go First|AirAsia|Emirates|Qatar Airways|Singapore Airlines|Lufthansa|British Airways|Etihad)\*?\*?/gi);
  for (const m of numberedAirlineMatches) {
    airlines.push(m[1].trim());
  }
  
  // Pattern 2: "Airline: IndiGo" or "**Airline:** IndiGo"
  if (airlines.length === 0) {
    const airlineMatches = content.matchAll(/(?:\*\*)?(?:airline|carrier)(?:\*\*)?[:\s*]+\*?\*?(IndiGo|Air India|SpiceJet|Vistara|Akasa Air|Go First|AirAsia|Emirates|Qatar Airways|Singapore Airlines|Lufthansa|British Airways|Etihad)\*?\*?/gi);
    for (const m of airlineMatches) {
      airlines.push(m[1].trim());
    }
  }

  // Pattern 3: If still no airlines, derive from flight numbers
  if (airlines.length === 0 && flightNumbers.length > 0) {
    for (const fn of flightNumbers) {
      const code = fn.match(/^([A-Z]{1,2})/i)?.[1]?.toUpperCase() || '';
      const airlineName = airlineCodeMap[code] || 'Airline';
      airlines.push(airlineName);
    }
  }
  
  // Pattern 4: Match bold standalone airline names "**IndiGo**" followed by flight details
  if (airlines.length === 0) {
    const boldAirlineMatches = content.matchAll(/\*\*(IndiGo|Air India|SpiceJet|Vistara|Akasa Air|Go First|AirAsia)\*\*/gi);
    for (const m of boldAirlineMatches) {
      airlines.push(m[1].trim());
    }
  }

  // Find prices - match "Price: ₹6,048" or "₹6048" - MUST have 3+ digits
  const prices: number[] = [];
  const priceMatches = content.matchAll(/(?:\*\*)?(?:price|fare|cost)(?:\*\*)?[:\s]+\*?\*?₹?\s?([\d,]+)(?:\*\*)?/gi);
  for (const m of priceMatches) {
    const priceVal = parseInt(m[1].replace(/,/g, ''));
    if (priceVal >= 100) { // Only accept reasonable prices (at least ₹100)
      prices.push(priceVal);
    }
  }
  
  // Fallback: Find standalone prices like "₹6,048" with at least 3 digits
  if (prices.length === 0) {
    const standalonePriceMatches = content.matchAll(/₹\s?([\d,]{3,})/g);
    for (const m of standalonePriceMatches) {
      const priceVal = parseInt(m[1].replace(/,/g, ''));
      if (priceVal >= 100) {
        prices.push(priceVal);
      }
    }
  }

  // Find durations - match "Duration: 1h 25m" or "1 hr 25 min"
  const durations: string[] = [];
  const durMatches = content.matchAll(/(?:\*\*)?(?:duration|total\s*duration)(?:\*\*)?[:\s]+\*?\*?(\d+\s*h(?:r|ours?)?\s*\d*\s*m(?:in)?)/gi);
  for (const m of durMatches) {
    durations.push(m[1]);
  }

  // Find departures - match "Departure: 05:15 AM from Pune..."
  const departures: { time: string }[] = [];
  const depMatches = content.matchAll(/(?:\*\*)?(?:departure|depart)(?:\*\*)?[:\s]+\*?\*?(\d{1,2}:\d{2}\s*(?:AM|PM))/gi);
  for (const m of depMatches) {
    departures.push({ time: m[1] });
  }

  // Find arrivals - match "Arrival: 06:40 AM at Indore..."
  const arrivals: { time: string }[] = [];
  const arrMatches = content.matchAll(/(?:\*\*)?(?:arrival|arrive)(?:\*\*)?[:\s]+\*?\*?(\d{1,2}:\d{2}\s*(?:AM|PM))/gi);
  for (const m of arrMatches) {
    arrivals.push({ time: m[1] });
  }

  // Find stops - match "Stops: Direct flight" or "Direct" or "1 stop"
  const stopsInfo: number[] = [];
  const stopsMatches = content.matchAll(/(?:\*\*)?(?:stops?)(?:\*\*)?[:\s]+\*?\*?(direct|non-?stop|\d+\s*stops?)/gi);
  for (const m of stopsMatches) {
    const stopText = m[1].toLowerCase();
    stopsInfo.push(stopText.includes('direct') || stopText.includes('non') ? 0 : parseInt(stopText) || 1);
  }

  // Build flight objects from extracted data
  // Use flightNumbers.length as primary count since we can derive airlines from them
  const maxFlights = Math.max(flightNumbers.length, airlines.length, prices.length);
  for (let i = 0; i < maxFlights && i < 20; i++) {
    // Get airline from explicit list, or derive from flight number
    let airlineName = airlines[i];
    if (!airlineName && flightNumbers[i]) {
      const code = flightNumbers[i].match(/^([A-Z]{1,2})/i)?.[1]?.toUpperCase() || '';
      airlineName = airlineCodeMap[code];
    }
    
    // Skip if no airline and no price
    if (!airlineName && !prices[i]) continue;
    
    flights.push({
      airline: airlineName || 'Airline',
      flightNumber: flightNumbers[i],
      price: prices[i] || 0,
      departureTime: departures[i]?.time || '',
      arrivalTime: arrivals[i]?.time || '',
      duration: durations[i] || '',
      stops: stopsInfo[i] ?? 0
    });
  }

  // Fallback: Try inline patterns like "IndiGo 6E284 - ₹6,048"
  if (flights.length === 0) {
    const inlineMatches = content.matchAll(/\b(IndiGo|Air India|SpiceJet|Vistara|Akasa|GoAir|Go First)\b\s*(?:flight\s*)?([A-Z0-9]{2}\s*\d{2,4})?\s*[-–]?\s*₹\s?([\d,]{3,})/gi);
    for (const m of inlineMatches) {
      flights.push({
        airline: m[1].trim(),
        flightNumber: m[2]?.replace(/\s/g, ''),
        price: parseInt(m[3].replace(/,/g, '')),
        departureTime: '',
        arrivalTime: '',
        duration: '',
        stops: 0
      });
    }
  }

  // Only return if we found flights with valid prices
  if (flights.length === 0 || !flights.some(f => f.price >= 100)) return null;

  // Filter out flights with invalid prices
  const validFlights = flights.filter(f => f.price >= 100);

  // Get origin and destination
  const origin = routeMatch ? routeMatch[1].trim() : 'Origin';
  const destination = routeMatch ? routeMatch[2].trim() : 'Destination';

  // Map to the nested structure expected by FlightResultsCard
  const mapToFlightStructure = (f: typeof validFlights[0]) => ({
    price: f.price,
    total_duration: f.duration ? parseDurationToMinutes(f.duration) : 120,
    flights: [{
      airline: f.airline,
      flight_number: f.flightNumber,
      departure_airport: {
        name: origin,
        id: getAirportCode(origin),
        time: f.departureTime
      },
      arrival_airport: {
        name: destination,
        id: getAirportCode(destination),
        time: f.arrivalTime
      },
      duration: f.duration ? parseDurationToMinutes(f.duration) : 120,
      airplane: 'Aircraft'
    }],
    layovers: f.stops > 0 ? Array(f.stops).fill({ name: 'Layover', duration: 60 }) : []
  });

  return {
    from: origin,
    to: destination,
    date: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
    best_flights: validFlights.slice(0, 3).map(mapToFlightStructure),
    other_flights: validFlights.slice(3).map(mapToFlightStructure)
  };
};

// Helper to get airport code from city name
const getAirportCode = (city: string): string => {
  const codes: Record<string, string> = {
    'pune': 'PNQ',
    'indore': 'IDR',
    'mumbai': 'BOM',
    'delhi': 'DEL',
    'bangalore': 'BLR',
    'bengaluru': 'BLR',
    'chennai': 'MAA',
    'hyderabad': 'HYD',
    'kolkata': 'CCU',
    'ahmedabad': 'AMD',
    'goa': 'GOI',
    'jaipur': 'JAI',
    'lucknow': 'LKO',
    'kochi': 'COK',
    'cochin': 'COK',
    'patna': 'PAT',
    'bhopal': 'BHO',
    'nagpur': 'NAG',
    'chandigarh': 'IXC',
    'guwahati': 'GAU',
    'srinagar': 'SXR',
    'varanasi': 'VNS',
    'coimbatore': 'CJB',
    'trivandrum': 'TRV',
    'thiruvananthapuram': 'TRV',
    'mangalore': 'IXE',
    'visakhapatnam': 'VTZ',
    'raipur': 'RPR',
    'ranchi': 'IXR',
    'bhubaneswar': 'BBI',
    'amritsar': 'ATQ',
    'udaipur': 'UDR',
    'jodhpur': 'JDH',
    'madurai': 'IXM',
    'tiruchirappalli': 'TRZ',
    'trichy': 'TRZ'
  };
  const lowerCity = city.toLowerCase().trim();
  return codes[lowerCity] || city.substring(0, 3).toUpperCase();
};

// Helper to calculate duration between two times
const calculateDuration = (dep: string, arr: string): string => {
  if (!dep || !arr) return '';
  try {
    const [depH, depM] = dep.split(':').map(Number);
    const [arrH, arrM] = arr.split(':').map(Number);
    let mins = (arrH * 60 + arrM) - (depH * 60 + depM);
    if (mins < 0) mins += 24 * 60; // Handle overnight
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  } catch {
    return '';
  }
};

// Helper to parse duration string to minutes
const parseDurationToMinutes = (duration: string): number => {
  if (!duration) return 120;
  const hMatch = duration.match(/(\d+)\s*h/i);
  const mMatch = duration.match(/(\d+)\s*m/i);
  const hours = hMatch ? parseInt(hMatch[1]) : 0;
  const mins = mMatch ? parseInt(mMatch[1]) : 0;
  return hours * 60 + mins || 120;
};

// Preview Content Renderer - Parses confirmation preview and renders beautifully
const PreviewContentRenderer = ({ content, actionType }: { content: string; actionType?: string }) => {
  const lines = content.split('\n').filter(line => line.trim());
  
  // Determine the icon and color scheme based on action type
  const getActionConfig = (type?: string) => {
    switch (type) {
      case 'send_email':
        return { 
          icon: <Mail className="w-5 h-5 text-red-400" />, 
          iconBg: 'bg-red-500/10',
          labelColor: 'text-gray-400'
        };
      case 'create_event':
        return { 
          icon: <Calendar className="w-5 h-5 text-blue-400" />, 
          iconBg: 'bg-blue-500/10',
          labelColor: 'text-gray-400'
        };
      case 'create_document':
        return { 
          icon: <FileText className="w-5 h-5 text-blue-400" />, 
          iconBg: 'bg-blue-500/10',
          labelColor: 'text-gray-400'
        };
      case 'create_form':
        return { 
          icon: <ClipboardList className="w-5 h-5 text-purple-400" />, 
          iconBg: 'bg-purple-500/10',
          labelColor: 'text-gray-400'
        };
      case 'create_meeting':
        return { 
          icon: <Video className="w-5 h-5 text-green-400" />, 
          iconBg: 'bg-green-500/10',
          labelColor: 'text-gray-400'
        };
      case 'create_repository':
      case 'create_issue':
        return { 
          icon: <Github className="w-5 h-5 text-gray-300" />, 
          iconBg: 'bg-gray-500/10',
          labelColor: 'text-gray-400'
        };
      default:
        return { 
          icon: <AlertCircle className="w-5 h-5 text-gray-400" />, 
          iconBg: 'bg-gray-500/10',
          labelColor: 'text-gray-400'
        };
    }
  };

  const config = getActionConfig(actionType);
  
  // Parse the content into structured data
  const parseContent = () => {
    const parsed: { 
      header?: string; 
      fields: Array<{ label: string; value: string; isBody?: boolean }>;
      questions?: Array<{ number: string; text: string; options?: string[] }>;
    } = { fields: [] };
    
    let currentQuestion: { number: string; text: string; options?: string[] } | null = null;
    let bodyContent = '';
    let inBody = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const cleanLine = line.replace(/\*\*/g, '').trim();
      
      // Skip header lines with emojis
      if (cleanLine.match(/^[📅📄📝📊📋✉️📹🗑️🔗⚡🔀]\s+/)) {
        parsed.header = cleanLine.replace(/^[📅📄📝📊📋✉️📹🗑️🔗⚡🔀]\s+/, '');
        continue;
      }
      
      // Check for field patterns like "**To:** value" or "To: value"
      const fieldMatch = cleanLine.match(/^([A-Za-z\s\/]+):\s*(.*)$/);
      if (fieldMatch && !inBody) {
        const [, label, value] = fieldMatch;
        const trimmedLabel = label.trim();
        
        // Check if this starts a body/content section
        if (['Intent/Content', 'Content', 'Body', 'Initial Content', 'Description'].includes(trimmedLabel)) {
          inBody = true;
          if (value.trim()) {
            bodyContent = value.trim();
          }
          continue;
        }
        
        if (value.trim()) {
          parsed.fields.push({ label: trimmedLabel, value: value.trim() });
        }
        continue;
      }
      
      // Handle body content
      if (inBody) {
        // Skip AI generation notes
        if (cleanLine.includes('AI will') || cleanLine.startsWith('_')) {
          continue;
        }
        bodyContent += (bodyContent ? '\n' : '') + cleanLine;
        continue;
      }
      
      // Handle numbered questions (for forms)
      const questionMatch = cleanLine.match(/^(\d+)\.\s*([📝📄🔘☑️📋⭐📅🕐❓]?\s*)(.+)$/);
      if (questionMatch) {
        if (currentQuestion) {
          if (!parsed.questions) parsed.questions = [];
          parsed.questions.push(currentQuestion);
        }
        currentQuestion = { number: questionMatch[1], text: questionMatch[3], options: [] };
        continue;
      }
      
      // Handle question options
      if (currentQuestion && cleanLine.match(/^[•·]\s+(.+)$/)) {
        const optionMatch = cleanLine.match(/^[•·]\s+(.+)$/);
        if (optionMatch && currentQuestion.options) {
          currentQuestion.options.push(optionMatch[1]);
        }
        continue;
      }
    }
    
    // Add last question if exists
    if (currentQuestion) {
      if (!parsed.questions) parsed.questions = [];
      parsed.questions.push(currentQuestion);
    }
    
    // Add body content if exists
    if (bodyContent.trim()) {
      parsed.fields.push({ label: 'Content', value: bodyContent.trim(), isBody: true });
    }
    
    return parsed;
  };

  const parsed = parseContent();

  // Special handling for email action type - render like Bhindi
  if (actionType === 'send_email') {
    const toField = parsed.fields.find(f => f.label.toLowerCase() === 'to');
    const ccField = parsed.fields.find(f => f.label.toLowerCase() === 'cc');
    const bccField = parsed.fields.find(f => f.label.toLowerCase() === 'bcc');
    const subjectField = parsed.fields.find(f => f.label.toLowerCase() === 'subject');
    const bodyField = parsed.fields.find(f => f.isBody);

    return (
      <div className="space-y-0">
        {/* Gmail Header with icon and recipient */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#2a2a2a]">
          <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center overflow-hidden">
            <img 
              src="/gmail.png" 
              alt="Gmail" 
              className="w-6 h-6 object-contain"
              onError={(e) => {
                // Fallback to Mail icon if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('fallback-icon');
              }}
            />
          </div>
          <div className="flex-1">
            <span className="text-gray-500 text-xs">To:</span>
            <p className="text-emerald-400 font-medium text-sm">{toField?.value || 'No recipient'}</p>
          </div>
          <span className="text-xs text-gray-500 bg-[#252525] px-2.5 py-1 rounded-md font-mono">sendEmail</span>
        </div>
        
        {/* CC/BCC if present */}
        {(ccField || bccField) && (
          <div className="flex gap-6 py-3 border-b border-[#2a2a2a]">
            {ccField && (
              <div>
                <span className="text-gray-500 text-xs">CC: </span>
                <span className="text-gray-300 text-xs">{ccField.value}</span>
              </div>
            )}
            {bccField && (
              <div>
                <span className="text-gray-500 text-xs">BCC: </span>
                <span className="text-gray-300 text-xs">{bccField.value}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Subject */}
        <div className="py-4 border-b border-[#2a2a2a]">
          <p className="text-gray-500 text-xs mb-1.5">Subject</p>
          <p className="text-white font-medium text-[15px]">{subjectField?.value || 'No subject'}</p>
        </div>
        
        {/* Email Body */}
        {bodyField && bodyField.value && (
          <div className="pt-4">
            <p className="text-gray-500 text-xs mb-2">Email Content</p>
            <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed bg-[#141414] rounded-xl p-4 border border-[#252525]">
              {bodyField.value}
            </div>
          </div>
        )}
      </div>
    );
  }

  // For other action types - render as clean card
  return (
    <div className="space-y-3">
      {/* Fields */}
      {parsed.fields.filter(f => !f.isBody).map((field, idx) => (
        <div key={idx} className="flex items-start gap-3">
          <span className="text-gray-500 text-sm min-w-[100px] flex-shrink-0">{field.label}:</span>
          <span className={`text-sm ${field.label.toLowerCase() === 'title' || field.label.toLowerCase() === 'name' ? 'text-white font-medium' : 'text-gray-300'}`}>
            {field.value}
          </span>
        </div>
      ))}
      
      {/* Questions (for forms) */}
      {parsed.questions && parsed.questions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">Questions</p>
          <div className="space-y-3">
            {parsed.questions.map((q, idx) => (
              <div key={idx} className="bg-[#141414] rounded-lg p-3 border border-[#252525]">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-medium text-sm">{q.number}.</span>
                  <div className="flex-1">
                    <p className="text-gray-200 text-sm">{q.text}</p>
                    {q.options && q.options.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Body content */}
      {parsed.fields.find(f => f.isBody) && (
        <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
          <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed bg-[#141414] rounded-lg p-3 border border-[#252525]">
            {parsed.fields.find(f => f.isBody)?.value}
          </div>
        </div>
      )}
    </div>
  );
};

interface MainAgentContentProps {
  chatId?: string | null;
  onChatIdChange?: (chatId: string) => void;
}

export function MainAgentContent({ chatId, onChatIdChange }: MainAgentContentProps) {
  const router = useRouter();
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState('Thinking...');
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [examples, setExamples] = useState<any>(null);
  const [showExamples, setShowExamples] = useState(true);
  const [agentHealth, setAgentHealth] = useState<any>(null);
  const [groupedChats, setGroupedChats] = useState<GroupedChats>({
    today: [],
    yesterday: [],
    lastWeek: [],
    lastMonth: [],
    older: [],
  });
  // Confirmation flow state
  const [pendingConfirmation, setPendingConfirmation] = useState<ConfirmationRequest | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  // Memory state - track which message pairs have been saved to memory
  const [savedToMemory, setSavedToMemory] = useState<Set<string>>(new Set());
  const [savingToMemory, setSavingToMemory] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamingContentRef = useRef<string>('');
  const metadataRef = useRef<{ agentsUsed?: string[], processingTime?: string }>({});
  const shouldSaveRef = useRef<boolean>(false);
  const isSavingRef = useRef<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/signin');
      return;
    }

    const initializeChat = async () => {
      await migrateOldConversation();
      loadExamplesAndHealth();

      if (chatId) {
        await loadChatSession(chatId);
      } else {
        const newSession = await createNewChatSession();
        if (newSession) {
          setCurrentChatId(newSession.id);
          setMessages([]);
          setShowExamples(true);
          onChatIdChange?.(newSession.id);
        }
      }

      await loadChatHistory();
    };

    initializeChat();
  }, [router]);

  // Handle chatId changes from parent (dashboard sidebar)
  useEffect(() => {
    if (chatId && chatId !== currentChatId) {
      // Clear current messages immediately for better UX
      setMessages([]);
      setShowExamples(true);
      loadChatSession(chatId);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  useEffect(() => {
    if (streamingMessageId) {
      scrollToBottom();
    }
  }, [streamingMessageId, messages]);

  useEffect(() => {
    const updateChat = async () => {
      if (currentChatId && messages.length > 0 && !streamingMessageId && shouldSaveRef.current) {
        shouldSaveRef.current = false;
        await saveMessagesToDB(messages);
      }
    };
    
    updateChat();
  }, [messages, currentChatId, streamingMessageId]);

  const loadExamplesAndHealth = async () => {
    try {
      const [examplesData, healthData] = await Promise.all([
        getAgentExamples(),
        checkAgentHealth(),
      ]);
      setExamples(examplesData);
      setAgentHealth(healthData);
    } catch (error) {
      console.error('Error loading examples/health:', error);
    }
  };

  const loadChatHistory = async () => {
    const grouped = await getGroupedChatSessions();
    setGroupedChats(grouped);
  };

  const saveMessagesToDB = async (messagesToSave: ChatMessage[]) => {
    if (isSavingRef.current) {
      return;
    }

    if (!currentChatId || messagesToSave.length === 0) {
      return;
    }

    const validMessages = messagesToSave.filter(m => m.content && m.content.trim() !== '');
    if (validMessages.length === 0) {
      return;
    }

    try {
      isSavingRef.current = true;
      const result = await updateChatSession(currentChatId, validMessages);
      if (result) {
        await loadChatHistory();
      }
    } catch (error) {
      console.error('Error saving messages:', error);
    } finally {
      isSavingRef.current = false;
    }
  };

  const loadChatSession = async (chatIdToLoad: string) => {
    const session = await getChatSession(chatIdToLoad);
    if (session) {
      setCurrentChatId(session.id);
      setMessages(session.messages);
      setShowExamples(session.messages.length === 0);
    } else {
      const newSession = await createNewChatSession();
      if (newSession) {
        setCurrentChatId(newSession.id);
        setMessages([]);
        setShowExamples(true);
        onChatIdChange?.(newSession.id);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (queryText?: string) => {
    const query = queryText || input.trim();
    
    if (!query || isLoading) return;

    setInput('');
    setShowExamples(false);

    // Check if query requires user location
    let userLocation: UserLocation | undefined = undefined;
    
    if (requiresLocation(query)) {
      console.log('[Location] Query requires location, requesting...');
      
      // Try to get cached location first
      const locationStore = useLocationStore.getState();
      
      if (locationStore.coords && !locationStore.isStale()) {
        console.log('[Location] Using cached location');
        userLocation = locationStore.coords;
      } else {
        // Request fresh location
        console.log('[Location] Requesting fresh location from browser');
        
        // Show thinking message while requesting location
        setIsThinking(true);
        setThinkingMessage('Requesting your location...');
        
        const location = await getUserLocation();
        
        setIsThinking(false);
        
        if (location) {
          console.log('[Location] Location granted:', location);
          locationStore.setCoords(location.lat, location.lng);
          userLocation = location;
        } else {
          console.log('[Location] Location denied or unavailable');
          locationStore.setDenied(true);
          
          // Add system message explaining location denial
          const systemMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: '📍 **Location Required**\n\nTo search for places near you, I need access to your location. You can either:\n\n1. Enable location access in your browser settings and try again\n2. Specify your city or area in your query (e.g., "Find cafes in Manhattan" or "Restaurants near Central Park")',
            timestamp: new Date(),
          };
          
          setMessages((prev) => [...prev, systemMessage]);
          return; // Don't proceed with query
        }
      }
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setIsThinking(true);
    setThinkingMessage('Thinking...');
    
    const assistantMessageId = (Date.now() + 1).toString();
    setStreamingMessageId(assistantMessageId);
    streamingContentRef.current = '';
    metadataRef.current = {};
    
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, assistantMessage]);
    
    try {
      const conversationHistory: ConversationMessage[] = [
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        {
          role: 'user',
          content: query,
        }
      ];

      // Pass currentChatId as conversationId for artifact memory and userLocation for Maps
      await processQueryStreaming(
        query, 
        conversationHistory, 
        (chunk: StreamChunk) => {
        switch (chunk.type) {
          case 'thinking':
            setIsThinking(chunk.status === 'start');
            break;
            
          case 'status':
            setThinkingMessage(chunk.message || 'Processing...');
            break;
            
          case 'analysis':
            if (chunk.agents) {
              metadataRef.current.agentsUsed = chunk.agents;
            }
            break;
            
          case 'content':
            if (chunk.text) {
              streamingContentRef.current += chunk.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: streamingContentRef.current }
                    : m
                )
              );
            }
            break;
            
          case 'metadata':
            metadataRef.current = {
              agentsUsed: chunk.agentsUsed,
              processingTime: chunk.processingTime,
            };
            break;
          
          case 'confirmation_request':
            // Handle confirmation request - pause streaming and show confirmation UI
            console.log('[Confirmation] Received confirmation request:', chunk);
            console.log('[Confirmation] Preview content:', chunk.previewContent);
            console.log('[Confirmation] Looking for message ID:', assistantMessageId);
            
            // Build the preview content with step indicator if part of a chain
            let confirmationPreview = chunk.previewContent || 'Action requires confirmation';
            if (chunk.chainInfo) {
              const stepIndicator = `📋 **Step ${chunk.chainInfo.currentStep} of ${chunk.chainInfo.totalSteps}**\n\n`;
              confirmationPreview = stepIndicator + confirmationPreview;
            }
            
            // Update the assistant message to show the confirmation preview FIRST
            setMessages((prev) => {
              console.log('[Confirmation] Current messages:', prev.map(m => ({ id: m.id, content: m.content?.substring(0, 50) })));
              const updated = prev.map((m) =>
                m.id === assistantMessageId
                  ? { 
                      ...m, 
                      content: confirmationPreview,
                      isPendingConfirmation: true,
                      confirmationData: {
                        requestId: chunk.requestId!,
                        toolName: chunk.toolName!,
                        agentName: chunk.agentName!,
                        actionType: chunk.actionType!,
                        description: chunk.description!,
                      }
                    }
                  : m
              );
              console.log('[Confirmation] Updated messages:', updated.map(m => ({ id: m.id, content: m.content?.substring(0, 50), isPending: (m as any).isPendingConfirmation })));
              return updated;
            });
            
            // Then update other states
            setIsThinking(false);
            setIsLoading(false);
            setStreamingMessageId(null);
            
            // Store the confirmation request with chain info
            setPendingConfirmation({
              requestId: chunk.requestId!,
              toolName: chunk.toolName!,
              agentName: chunk.agentName!,
              actionType: chunk.actionType!,
              description: chunk.description!,
              params: chunk.params || {},
              previewContent: chunk.previewContent!,
              originalQuery: chunk.originalQuery,
              chainInfo: chunk.chainInfo,
            });
            break;
            
          case 'error':
            throw new Error(chunk.error || chunk.message || 'Unknown error');
            
          case 'done':
            const finalContent = streamingContentRef.current;
            const finalMetadata = { ...metadataRef.current };
            
            setMessages((prev) => {
              const updatedMessages = prev.map((m) => {
                if (m.id === assistantMessageId) {
                  // Don't overwrite content if this is a pending confirmation
                  // (confirmation_request sets the content, done should not clear it)
                  if ((m as any).isPendingConfirmation) {
                    return m; // Keep the message as-is
                  }
                  return {
                    ...m,
                    content: finalContent,
                    agentsUsed: finalMetadata.agentsUsed,
                    processingTime: finalMetadata.processingTime,
                  };
                }
                return m;
              });
              
              if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
              }
              
              saveTimeoutRef.current = setTimeout(() => {
                saveMessagesToDB(updatedMessages);
                saveTimeoutRef.current = null;
              }, 200);
              
              return updatedMessages;
            });
            break;
        }
      }, currentChatId || undefined, userLocation);  // Pass currentChatId for artifact memory and userLocation for Maps

    } catch (error: any) {
      if (error.message && (error.message.includes('Session expired') || error.message.includes('Authentication required'))) {
        router.push('/auth/signin');
        return;
      }
      
      setMessages((prev) => {
        const updatedMessages = prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: `Error: ${error.message || 'Failed to process your request. Please try again.'}`,
                isError: true,
              }
            : m
        );
        
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(() => {
          saveMessagesToDB(updatedMessages);
          saveTimeoutRef.current = null;
        }, 200);
        
        return updatedMessages;
      });
    } finally {
      setIsLoading(false);
      setIsThinking(false);
      setStreamingMessageId(null);
      streamingContentRef.current = '';
      metadataRef.current = {};
      shouldSaveRef.current = false;
      inputRef.current?.focus();
    }
  };

  /**
   * Handle user confirming a pending action
   * Executes the action and streams the response
   */
  const handleConfirmAction = async () => {
    if (!pendingConfirmation || isConfirming) return;

    setIsConfirming(true);
    setIsThinking(true);
    setThinkingMessage('Executing your confirmed action...');

    // Create a new assistant message for the execution response
    const responseMessageId = (Date.now() + 1).toString();
    setStreamingMessageId(responseMessageId);
    streamingContentRef.current = '';
    metadataRef.current = {};

    const responseMessage: ChatMessage = {
      id: responseMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    // Update the pending confirmation message and add response message
    setMessages((prev) => {
      const updated = prev.map((m) =>
        (m as any).isPendingConfirmation
          ? { ...m, isPendingConfirmation: false, isConfirmed: true }
          : m
      );
      return [...updated, responseMessage];
    });

    // Track if a new confirmation is received during streaming (for action chains)
    let receivedNewConfirmation = false;

    try {
      await confirmActionStreaming(pendingConfirmation.requestId, (chunk: StreamChunk) => {
        switch (chunk.type) {
          case 'thinking':
            setIsThinking(chunk.status === 'start');
            break;

          case 'status':
            setThinkingMessage(chunk.message || 'Processing...');
            break;

          case 'content':
            if (chunk.text) {
              streamingContentRef.current += chunk.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === responseMessageId
                    ? { ...m, content: streamingContentRef.current }
                    : m
                )
              );
            }
            break;

          case 'metadata':
            metadataRef.current = {
              agentsUsed: chunk.agentsUsed,
              processingTime: chunk.processingTime,
            };
            break;

          case 'confirmation_request':
            // Handle next confirmation in chain - another action needs confirmation
            console.log('[Confirmation] Received next confirmation in chain:', chunk);
            receivedNewConfirmation = true;
            
            // First, finalize the current response message
            const currentContent = streamingContentRef.current;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === responseMessageId
                  ? { ...m, content: currentContent }
                  : m
              )
            );
            
            // Create a new message for the next confirmation preview
            const nextConfirmMessageId = `assistant-${Date.now()}-nextconfirm`;
            const nextConfirmPreview = chunk.previewContent || 'Next action requires confirmation';
            const chainInfo = chunk.chainInfo;
            const stepIndicator = chainInfo ? `\n\n📋 **Step ${chainInfo.currentStep} of ${chainInfo.totalSteps}**` : '';
            
            setMessages((prev) => [
              ...prev,
              {
                id: nextConfirmMessageId,
                role: 'assistant' as const,
                content: stepIndicator + '\n\n' + nextConfirmPreview,
                timestamp: new Date(),
                isPendingConfirmation: true,
                confirmationData: {
                  requestId: chunk.requestId!,
                  toolName: chunk.toolName!,
                  agentName: chunk.agentName!,
                  actionType: chunk.actionType!,
                  description: chunk.description!,
                }
              } as any
            ]);
            
            // Set the new pending confirmation
            setPendingConfirmation({
              requestId: chunk.requestId!,
              toolName: chunk.toolName!,
              agentName: chunk.agentName!,
              actionType: chunk.actionType!,
              description: chunk.description!,
              params: chunk.params || {},
              previewContent: nextConfirmPreview,
              originalQuery: chunk.originalQuery,
              chainInfo: chunk.chainInfo,
            });
            
            // Reset states for the new confirmation
            setIsThinking(false);
            setIsConfirming(false);
            streamingContentRef.current = '';
            break;

          case 'error':
            throw new Error(chunk.error || chunk.message || 'Action execution failed');

          case 'done':
            // Skip updating messages if we received a new confirmation (action chain)
            // The new confirmation message is already set up
            if (receivedNewConfirmation) {
              console.log('[Confirmation] Skipping done handler - new confirmation received');
              break;
            }
            
            const finalContent = streamingContentRef.current;
            const finalMetadata = { ...metadataRef.current };

            setMessages((prev) => {
              const updatedMessages = prev.map((m) =>
                m.id === responseMessageId
                  ? {
                      ...m,
                      content: finalContent,
                      agentsUsed: finalMetadata.agentsUsed,
                      processingTime: finalMetadata.processingTime,
                    }
                  : m
              );

              if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
              }

              saveTimeoutRef.current = setTimeout(() => {
                saveMessagesToDB(updatedMessages);
                saveTimeoutRef.current = null;
              }, 200);

              return updatedMessages;
            });
            break;
        }
      });
    } catch (error: any) {
      if (error.message && (error.message.includes('Session expired') || error.message.includes('Authentication required'))) {
        router.push('/auth/signin');
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === responseMessageId
            ? {
                ...m,
                content: `Error: ${error.message || 'Failed to execute action. Please try again.'}`,
                isError: true,
              }
            : m
        )
      );
    } finally {
      setIsConfirming(false);
      setIsThinking(false);
      setStreamingMessageId(null);
      // Only clear pendingConfirmation if we didn't receive a new one (action chain)
      if (!receivedNewConfirmation) {
        setPendingConfirmation(null);
      }
      streamingContentRef.current = '';
      metadataRef.current = {};
      inputRef.current?.focus();
    }
  };

  /**
   * Handle user canceling a pending action
   */
  const handleCancelAction = async () => {
    if (!pendingConfirmation) return;

    try {
      const result = await cancelAction(pendingConfirmation.requestId);

      // Update the message to show cancellation
      setMessages((prev) =>
        prev.map((m) =>
          (m as any).isPendingConfirmation
            ? {
                ...m,
                content: result.message || 'Action canceled. Let me know if you want to make any changes.',
                isPendingConfirmation: false,
                isCanceled: true,
              }
            : m
        )
      );

      // Save the updated messages
      setMessages((prev) => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
          saveMessagesToDB(prev);
          saveTimeoutRef.current = null;
        }, 200);

        return prev;
      });
    } catch (error: any) {
      console.error('Error canceling action:', error);
      // Still clear the confirmation state even on error
    } finally {
      setPendingConfirmation(null);
      inputRef.current?.focus();
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    inputRef.current?.focus();
  };

  const handleNewChat = async () => {
    // If the current chat has no messages, don't create a new session
    // This prevents creating duplicate empty chat sessions like professional chat systems
    if (messages.length === 0) {
      // Just reset the state without creating a new session
      setInput('');
      setShowExamples(true);
      inputRef.current?.focus();
      return;
    }
    
    const newSession = await createNewChatSession();
    if (newSession) {
      setCurrentChatId(newSession.id);
      setMessages([]);
      setShowExamples(true);
      setInput('');
      await loadChatHistory();
      onChatIdChange?.(newSession.id);
    }
  };

  const handleChatSelect = async (chatIdToSelect: string) => {
    if (chatIdToSelect === currentChatId) return;
    await loadChatSession(chatIdToSelect);
    await loadChatHistory();
    onChatIdChange?.(chatIdToSelect);
  };

  const handleDeleteChat = async (chatIdToDelete: string) => {
    if (confirm('Delete this chat?')) {
      const success = await deleteChatSession(chatIdToDelete);
      if (success) {
        await loadChatHistory();
        
        // If deleting current chat, create new one
        if (chatIdToDelete === currentChatId) {
          await handleNewChat();
        }
      }
    }
  };

  /**
   * Handle adding a conversation pair to long-term memory
   */
  const handleAddToMemory = async (assistantMessageId: string) => {
    alert('Hello button clicked!'); // Debug alert
    
    console.log('[Memory] handleAddToMemory called with:', assistantMessageId);
    
    // Find the assistant message
    const messageIndex = messages.findIndex(m => m.id === assistantMessageId);
    console.log('[Memory] Message index:', messageIndex);
    
    if (messageIndex < 0) {
      console.log('[Memory] Message not found, returning');
      return;
    }
    
    const assistantMessage = messages[messageIndex];
    
    // Find the most recent user message BEFORE this assistant message
    // We need to search backwards to find a user message
    let userMessage = null;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMessage = messages[i];
        break;
      }
    }
    
    console.log('[Memory] User message:', userMessage?.role, userMessage?.content?.substring(0, 50));
    console.log('[Memory] Assistant message:', assistantMessage?.role, assistantMessage?.content?.substring(0, 50));
    
    // Ensure we have a user-assistant pair
    if (!userMessage || assistantMessage.role !== 'assistant') {
      console.log('[Memory] Not a valid user-assistant pair, returning');
      alert('Could not find a valid user-assistant message pair to save.');
      return;
    }
    
    setSavingToMemory(assistantMessageId);
    
    try {
      console.log('[Memory] Calling addMemory API...');
      const result = await addMemory({
        userMessage: userMessage.content,
        assistantMessage: assistantMessage.content,
        sourceApp: assistantMessage.agentsUsed?.length 
          ? (assistantMessage.agentsUsed.length > 1 ? 'multi-agent' : assistantMessage.agentsUsed[0])
          : 'chat',
        metadata: {
          agentsUsed: assistantMessage.agentsUsed,
          processingTime: assistantMessage.processingTime,
          conversationId: currentChatId,
        }
      });
      
      console.log('[Memory] API result:', result);
      
      if (result.success) {
        setSavedToMemory(prev => new Set([...prev, assistantMessageId]));
        console.log('[Memory] Successfully saved to memory');
        alert('Memory saved successfully!');
      } else {
        console.error('Failed to save to memory:', result.error);
        alert('Failed to save to memory: ' + (result.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error saving to memory:', error);
      alert(error.message || 'Failed to save to memory. Please try again.');
    } finally {
      setSavingToMemory(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-black overflow-hidden h-full">
      {showExamples && messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center w-full px-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-3">
              How can we help you today?
            </h2>
          </div>
          
          <div className="w-full max-w-3xl">
            <VercelV0Chat
              value={input}
              onChange={setInput}
              onSubmit={handleSendMessage}
              placeholder="Ask me anything... (e.g., 'schedule a meeting and create a document')"
              disabled={isLoading}
              showExamples={true}
              examples={[
                {
                  icon: <Calendar className="w-4 h-4" />,
                  label: "Schedule Meeting",
                  onClick: () => handleExampleClick("Schedule a meeting tomorrow at 2pm"),
                },
                {
                  icon: <FileText className="w-4 h-4" />,
                  label: "Create Document",
                  onClick: () => handleExampleClick("Create a new document"),
                },
                {
                  icon: <ClipboardList className="w-4 h-4" />,
                  label: "Create Form",
                  onClick: () => handleExampleClick("Create a feedback form"),
                },
                {
                  icon: <Github className="w-4 h-4" />,
                  label: "GitHub Repos",
                  onClick: () => handleExampleClick("Show my GitHub repositories"),
                },
                {
                  icon: <Video className="w-4 h-4" />,
                  label: "Schedule Meet",
                  onClick: () => handleExampleClick("Schedule a video call"),
                },
              ]}
            />
            <p className="text-xs text-gray-600 mt-3 text-center">
              {isLoading ? 'Processing your request...' : 'The Main Agent can coordinate multiple services in a single query'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
            <style>{scrollbarStyles}</style>
            <div className="max-w-4xl mx-auto space-y-6 w-full">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'user' ? (
                    <div className="max-w-3xl rounded-2xl px-6 py-2 bg-neutral-900 border border-neutral-800">
                      <div 
                        className="whitespace-pre-wrap"
                        style={{ 
                          fontFamily: 'Inter, "Inter Fallback"',
                          fontSize: '16px',
                          lineHeight: '26px',
                          fontWeight: 400,
                          letterSpacing: 'normal',
                          color: '#F1F2F5'
                        }}
                      >
                        {message.content}
                      </div>
                    </div>
                  ) : message.isError ? (
                    <div className="max-w-3xl rounded-2xl px-6 py-2 bg-red-500/10 border border-red-500/30 text-red-400">
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  ) : (message as any).isPendingConfirmation ? (
                    // Confirmation request message - Bhindi.io style design
                    <div className="max-w-3xl w-full">
                      {/* Preview Card - Sleek dark container */}
                      <div className="rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden shadow-xl">
                        {/* Action Type Header - Bhindi style with icon and colored badge */}
                        <div className="px-5 py-3.5 flex items-center justify-between border-b border-[#2a2a2a]">
                          <div className="flex items-center gap-2.5">
                            {(message as any).confirmationData?.actionType === 'send_email' ? (
                              <div className="w-5 h-5 bg-red-500/20 rounded flex items-center justify-center">
                                <Mail className="w-3 h-3 text-red-400" />
                              </div>
                            ) : (
                              <span className="text-lg">
                                {getActionTypeIcon((message as any).confirmationData?.actionType || 'unknown')}
                              </span>
                            )}
                            <span className="text-sm font-medium text-white">
                              {(message as any).confirmationData?.description || 'Action Preview'}
                            </span>
                          </div>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${
                            (message as any).confirmationData?.agentName === 'gmail' 
                              ? 'text-emerald-400 bg-emerald-400/10' 
                              : (message as any).confirmationData?.agentName === 'calendar'
                              ? 'text-blue-400 bg-blue-400/10'
                              : 'text-gray-400 bg-gray-400/10'
                          }`}>
                            {formatAgentName((message as any).confirmationData?.agentName || 'agent')}
                          </span>
                        </div>
                        
                        {/* Preview Content - Clean formatted display */}
                        <div className="p-5">
                          <div 
                            className="space-y-3"
                            style={{ 
                              fontFamily: 'Inter, "Inter Fallback"',
                              fontSize: '14px',
                              lineHeight: '22px',
                            }}
                          >
                            {message.content ? (
                              <PreviewContentRenderer content={message.content} actionType={(message as any).confirmationData?.actionType} />
                            ) : (
                              <span className="text-gray-500">No preview content available</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Confirmation Bar - Separate elegant container */}
                      <div className="mt-3 rounded-xl bg-[#141414] border border-[#252525] px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center">
                            <AlertCircle className="w-3 h-3 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200">Confirmation Required</p>
                            <p className="text-xs text-gray-500">Task paused due to pending confirmation. Click on confirm to proceed.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCancelAction}
                            disabled={isConfirming}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#252525] hover:bg-[#303030] disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 text-sm font-medium transition-all duration-200"
                          >
                            <X className="w-3.5 h-3.5" />
                            Skip
                          </button>
                          <button
                            onClick={handleConfirmAction}
                            disabled={isConfirming}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-emerald-600/20"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {isConfirming ? 'Processing...' : 'Confirm'}
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-600 text-right">
                        {(message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)).toLocaleTimeString()}
                      </div>
                    </div>
                  ) : (message as any).isCanceled ? (
                    // Canceled action message - Minimal style
                    <div className="max-w-3xl w-full">
                      <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center">
                            <X className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-400">Action Skipped</span>
                            <p className="text-xs text-gray-600 mt-0.5">The action was not executed</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-600 text-right">
                        {(message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)).toLocaleTimeString()}
                      </div>
                    </div>
                  ) : (message as any).isConfirmed ? (
                    // Confirmed action message - Success style
                    <div className="max-w-3xl w-full">
                      <div className="rounded-xl bg-[#1a1a1a] border border-emerald-500/20 px-5 py-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Check className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-emerald-400">Action Confirmed</span>
                            <p className="text-xs text-gray-500 mt-0.5">Executing your request...</p>
                          </div>
                        </div>
                        <div 
                          className="pl-11 text-sm text-gray-400"
                          style={{ 
                            fontFamily: 'Inter, "Inter Fallback"',
                            lineHeight: '22px',
                          }}
                        >
                          {formatMessageContent(message.content)}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-600 text-right">
                        {(message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)).toLocaleTimeString()}
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-3xl">
                      {(() => {
                        // Check for meeting creation (Google Meet)
                        const meetingInfo = extractMeetingInfo(message.content);
                        if (meetingInfo) {
                          return (
                            <MeetingCard
                              title={meetingInfo.title}
                              date={meetingInfo.date}
                              time={meetingInfo.time}
                              meetingCode={meetingInfo.meetingCode}
                              meetingLink={meetingInfo.meetingLink}
                              host={meetingInfo.host}
                              hostEmail={meetingInfo.hostEmail}
                            />
                          );
                        }
                        return null;
                      })()}
                      
                      {(() => {
                        // Check for flight search results
                        const flightData = extractFlightInfo(message.content);
                        if (flightData) {
                          return (
                            <div className="mb-4">
                              <FlightResultsInline data={flightData} />
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      <div 
                        style={{ 
                          fontFamily: 'Inter, "Inter Fallback"',
                          fontSize: '16px',
                          lineHeight: '26px',
                          fontWeight: 400,
                          letterSpacing: 'normal',
                          color: '#F1F2F5'
                        }}
                      >
                        {formatMessageContent(message.content)}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-neutral-800/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          {message.agentsUsed && message.agentsUsed.length > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Agents:</span>
                              {message.agentsUsed.map((agent: string) => (
                                <span
                                  key={agent}
                                  className="px-2 py-1 rounded-full bg-neutral-800 text-gray-400"
                                >
                                  {getAgentIcon(agent)} {formatAgentName(agent)}
                                </span>
                              ))}
                            </div>
                          )}
                          {message.processingTime && (
                            <span className="text-gray-500">
                              ⚡ {message.processingTime}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Add to Memory button */}
                          {messages.findIndex(m => m.id === message.id) > 0 && (
                            <button
                              onClick={() => handleAddToMemory(message.id)}
                              disabled={savingToMemory === message.id || savedToMemory.has(message.id)}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200 ${
                                savedToMemory.has(message.id)
                                  ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                                  : savingToMemory === message.id
                                  ? 'bg-neutral-800 text-gray-400 cursor-wait'
                                  : 'bg-neutral-800 hover:bg-neutral-700 text-gray-400 hover:text-gray-300'
                              }`}
                              title={savedToMemory.has(message.id) ? 'Saved to memory' : 'Add to long-term memory'}
                            >
                              <Brain className="w-3.5 h-3.5" />
                              <span>
                                {savedToMemory.has(message.id)
                                  ? 'Remembered'
                                  : savingToMemory === message.id
                                  ? 'Saving...'
                                  : 'Remember'}
                              </span>
                            </button>
                          )}
                          <span className="text-gray-500">
                            {(message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isThinking && (
                <div className="flex justify-start max-w-3xl mb-4">
                  <ThinkingIndicator message={thinkingMessage} />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
      
          <div className="bg-black p-6">
            <div className="max-w-3xl mx-auto">
              <VercelV0Chat
                value={input}
                onChange={setInput}
                onSubmit={handleSendMessage}
                placeholder="Ask me anything... (e.g., 'schedule a meeting and create a document')"
                disabled={isLoading}
                showExamples={false}
              />
              <p className="text-xs text-gray-600 mt-3 text-center">
                {isLoading ? 'Processing your request...' : 'The Main Agent can coordinate multiple services in a single query'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MainAgentContent;

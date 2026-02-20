'use client';

import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useToast } from '@/contexts/ToastContext';

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
  getChatSessionCached,
  updateChatSession,
  deleteChatSession,
  getGroupedChatSessions,
  migrateOldConversation,
  GroupedChats,
  invalidateChatCache,
  invalidateChatSessionCache,
  getTimelineEventsForMessages,
  TimelineEventData,
} from '../lib/chatHistory';
import { addMemory } from '../lib/memory';
import { getUserLocation, requiresLocation } from '../lib/geolocation';
import { useLocationStore } from '../lib/stores/locationStore';
import { getSupabaseClient, ChatMessageRow, rowToChatMessage } from '../lib/supabase';
import { VercelV0Chat } from '@/components/ui/v0-ai-chat';
import { ThinkingIndicator } from '@/components/ui/thinking-indicator';
import { FileAttachment, FileAttachmentRef } from '@/components/ui/FileAttachment';
import FileMessage from '@/components/ui/FileMessage';
import { UploadedFile } from '@/lib/files';
import { Calendar, FileText, ClipboardList, Github, Video, Check, X, Mail, AlertCircle, Brain, Volume2, VolumeX } from 'lucide-react';
import { MeetingCard } from '@/components/ui/meeting-card';
import { FlightResultsInline, FlightData } from '@/components/ui/flight-results-card';
import { TimelineContainer, TimelineEvent, TimelineEventType } from '@/components/Timeline';
import { MarkdownContent } from '@/components/ui/MarkdownContent';
import { FileGenerationPanel } from '@/components/ui/FileGenerationPanel';
import { detectFileGenerationRequest } from '@/lib/fileGeneration';
import { useVoiceInput, getBaseLanguageName } from '@/hooks/useVoiceInput';
import { useTTS } from '@/hooks/useTTS';

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
    airplane?: string;
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
  const numberedAirlineMatches = content.matchAll(/\d+\.\s*\*?\*?(Air India Express|Air India|IndiGo|SpiceJet|Vistara|Akasa Air|Go First|AirAsia India|AirAsia|Alliance Air|Emirates|Qatar Airways|Singapore Airlines|Lufthansa|British Airways|Etihad)\*?\*?/gi);
  for (const m of numberedAirlineMatches) {
    airlines.push(m[1].trim());
  }
  
  // Pattern 2: "Airline: IndiGo" or "**Airline:** IndiGo"
  if (airlines.length === 0) {
    const airlineMatches = content.matchAll(/(?:\*\*)?(?:airline|carrier)(?:\*\*)?[:\s*]+\*?\*?(Air India Express|Air India|IndiGo|SpiceJet|Vistara|Akasa Air|Go First|AirAsia India|AirAsia|Alliance Air|Emirates|Qatar Airways|Singapore Airlines|Lufthansa|British Airways|Etihad)\*?\*?/gi);
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
    const boldAirlineMatches = content.matchAll(/\*\*(Air India Express|Air India|IndiGo|SpiceJet|Vistara|Akasa Air|Go First|AirAsia India|AirAsia|Alliance Air)\*\*/gi);
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

  // Find stops - match "Stops: Direct flight" or "Direct" or "1 stop" or "Layover:"
  const stopsInfo: number[] = [];
  const stopsMatches = content.matchAll(/(?:\*\*)?(?:stops?)(?:\*\*)?[:\s]+\*?\*?(direct|non-?stop|\d+\s*stops?)|(?:\*\*)?layover(?:\*\*)?[:\s]/gi);
  for (const m of stopsMatches) {
    const stopText = m[1] || m[0];
    if (stopText.toLowerCase().includes('layover')) {
      stopsInfo.push(1); // If layover is mentioned, it's at least 1 stop
    } else {
      const text = stopText.toLowerCase();
      stopsInfo.push(text.includes('direct') || text.includes('non') ? 0 : parseInt(stopText) || 1);
    }
  }

  // Find airplane models - match "Aircraft: Boeing 737" or "Airplane: Airbus A320" or "Aircraft Model: ATR 72"
  const airplanes: string[] = [];
  const airplaneMatches = content.matchAll(/(?:\*\*)?(?:aircraft|airplane|plane|aircraft\s*model)(?:\*\*)?[:\s]+\*?\*?([A-Za-z0-9\s-]+?)(?:\*\*)?(?:\n|\.|,|$)/gi);
  for (const m of airplaneMatches) {
    const model = m[1].trim();
    // Filter out generic terms
    if (model && !model.toLowerCase().includes('model') && model.length > 2) {
      airplanes.push(model);
    }
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
      stops: stopsInfo[i] ?? 0,
      airplane: airplanes[i] || ''
    });
  }

  // Fallback: Try inline patterns like "IndiGo 6E284 - ₹6,048"
  if (flights.length === 0) {
    const inlineMatches = content.matchAll(/\b(Air India Express|Air India|IndiGo|SpiceJet|Vistara|Akasa Air|Akasa|GoAir|Go First|AirAsia India|AirAsia|Alliance Air)\b\s*(?:flight\s*)?([A-Z0-9]{2}\s*\d{2,4})?\s*[-–]?\s*₹\s?([\d,]{3,})/gi);
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
  const mapToFlightStructure = (f: typeof validFlights[0]) => {
    const baseFlightLeg = {
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
      airplane: f.airplane || ''
    };

    // For connecting flights (stops > 0), create multiple flight legs
    if (f.stops > 0) {
      const flightLegs = [baseFlightLeg];
      // Add additional legs for each stop
      for (let i = 1; i <= f.stops; i++) {
        flightLegs.push({
          ...baseFlightLeg,
          flight_number: f.flightNumber
        });
      }
      return {
        price: f.price,
        total_duration: f.duration ? parseDurationToMinutes(f.duration) : 120,
        flights: flightLegs,
        layovers: Array(f.stops).fill({ name: 'Layover', duration: 60 })
      };
    }

    // Direct flight
    return {
      price: f.price,
      total_duration: f.duration ? parseDurationToMinutes(f.duration) : 120,
      flights: [baseFlightLeg],
      layovers: []
    };
  };

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

// Helper to get the correct app logo based on agent and action type
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

// Preview Content Renderer - Parses confirmation preview and renders beautifully
const PreviewContentRenderer = ({ content, actionType, agentName }: { content: string; actionType?: string; agentName?: string }) => {
  const lines = content.split('\n').filter(line => line.trim());
  
  // Check if this is a Microsoft email
  const isMicrosoftEmail = agentName === 'microsoft';
  
  // Determine the icon and color scheme based on action type
  const getActionConfig = (type?: string) => {
    switch (type) {
      case 'send_email':
        return { 
          icon: <Mail className={`w-5 h-5 ${isMicrosoftEmail ? 'text-blue-400' : 'text-red-400'}`} />, 
          iconBg: isMicrosoftEmail ? 'bg-blue-500/10' : 'bg-red-500/10',
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
      description?: string;
    } = { fields: [] };
    
    let currentQuestion: { number: string; text: string; options?: string[] } | null = null;
    let bodyContent = '';
    let inBody = false;
    let inQuestions = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const cleanLine = line.replace(/\*\*/g, '').trim();
      
      // Skip header lines with emojis
      if (cleanLine.match(/^[📅📄📝📊📋✉️📹🗑️🔗⚡🔀]\s+/)) {
        parsed.header = cleanLine.replace(/^[📅📄📝📊📋✉️📹🗑️🔗⚡🔀]\s+/, '');
        continue;
      }
      
      // Check for "Questions:" label - switch to questions mode
      if (cleanLine.toLowerCase() === 'questions:' || cleanLine.toLowerCase().startsWith('questions:')) {
        inBody = false;
        inQuestions = true;
        // Save body content as description before switching to questions
        if (bodyContent.trim()) {
          parsed.description = bodyContent.trim();
          bodyContent = '';
        }
        continue;
      }
      
      // Handle numbered questions (for forms) - check this BEFORE body content handling
      const questionMatch = cleanLine.match(/^(\d+)\.\s*([📝📄🔘☑️📋⭐📅🕐❓]?\s*)(.+)$/);
      if (questionMatch) {
        // Found a question - switch to questions mode
        inBody = false;
        inQuestions = true;
        // Save any accumulated body content as description
        if (bodyContent.trim() && !parsed.description) {
          parsed.description = bodyContent.trim();
          bodyContent = '';
        }
        
        if (currentQuestion) {
          if (!parsed.questions) parsed.questions = [];
          parsed.questions.push(currentQuestion);
        }
        currentQuestion = { number: questionMatch[1], text: questionMatch[3], options: [] };
        continue;
      }
      
      // Handle question options (bullet points)
      if (currentQuestion && cleanLine.match(/^[•·]\s+(.+)$/)) {
        const optionMatch = cleanLine.match(/^[•·]\s+(.+)$/);
        if (optionMatch && currentQuestion.options) {
          currentQuestion.options.push(optionMatch[1]);
        }
        continue;
      }
      
      // Check for field patterns like "**To:** value" or "To: value"
      const fieldMatch = cleanLine.match(/^([A-Za-z\s\/]+):\s*(.*)$/);
      if (fieldMatch && !inBody && !inQuestions) {
        const [, label, value] = fieldMatch;
        const trimmedLabel = label.trim();
        
        // Check if this starts a body/content section
        if (['Intent/Content', 'Content', 'Body', 'Initial Content', 'Description', 'Email Content'].includes(trimmedLabel)) {
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
      
      // Handle body content (but not if we're in questions mode)
      if (inBody && !inQuestions) {
        // Skip AI generation notes
        if (cleanLine.includes('AI will') || cleanLine.startsWith('_')) {
          continue;
        }
        bodyContent += (bodyContent ? '\n' : '') + cleanLine;
        continue;
      }
    }
    
    // Add last question if exists
    if (currentQuestion) {
      if (!parsed.questions) parsed.questions = [];
      parsed.questions.push(currentQuestion);
    }
    
    // Add body content if exists and wasn't converted to description
    if (bodyContent.trim() && !parsed.description) {
      parsed.fields.push({ label: 'Content', value: bodyContent.trim(), isBody: true });
    }
    
    // Also try to parse questions from inline content (e.g., "1. 📄 Full Name *(required)* 2. 📄 Email")
    // This handles cases where questions are in a single line or concatenated together
    if (!parsed.questions || parsed.questions.length === 0) {
      const fullContent = content;
      
      // Extract description - text before "Questions:" or before first numbered item
      const questionsLabelMatch = fullContent.match(/Questions:\s*/i);
      let contentToParseQuestions = fullContent;
      
      if (questionsLabelMatch) {
        const descEnd = fullContent.indexOf(questionsLabelMatch[0]);
        if (descEnd > 0) {
          let descText = fullContent.substring(0, descEnd).trim();
          // Clean up description - remove field labels (handles both start of line and inline)
          descText = descText.replace(/\*?\*?(Title|Description)\*?\*?:\s*/gi, '').trim();
          if (descText) {
            parsed.description = descText;
          }
        }
        // Get content after "Questions:"
        contentToParseQuestions = fullContent.substring(fullContent.indexOf(questionsLabelMatch[0]) + questionsLabelMatch[0].length);
      } else {
        // No "Questions:" label - check if content starts with description before first question
        const firstQuestionMatch = contentToParseQuestions.match(/\d+\.\s*[📝📄🔘☑️📋⭐📅🕐❓]/);
        if (firstQuestionMatch) {
          const firstQIndex = contentToParseQuestions.indexOf(firstQuestionMatch[0]);
          if (firstQIndex > 0) {
            let descText = contentToParseQuestions.substring(0, firstQIndex).trim();
            // Clean up description - remove field labels
            descText = descText.replace(/\*?\*?(Title|Description)\*?\*?:\s*/gi, '').trim();
            if (descText) {
              parsed.description = descText;
            }
          }
        }
      }
      
      // Split by question number pattern - split before each "N. " where N is a digit
      const questionSegments = contentToParseQuestions.split(/(?=\d+\.\s+)/);
      const inlineQuestions: Array<{ number: string; text: string; options: string[] }> = [];
      
      for (const segment of questionSegments) {
        const trimmedSegment = segment.trim();
        if (!trimmedSegment) continue;
        
        // Match question number and content
        const questionMatch = trimmedSegment.match(/^(\d+)\.\s*(.+)/s);
        if (!questionMatch) continue;
        
        const questionNumber = questionMatch[1];
        let questionContent = questionMatch[2].trim();
        
        // Extract options (marked with •)
        const options: string[] = [];
        const optionParts = questionContent.split('•');
        
        // First part is the question text, rest are options
        let questionText = optionParts[0].trim();
        
        for (let i = 1; i < optionParts.length; i++) {
          const opt = optionParts[i].trim();
          if (opt) {
            options.push(opt);
          }
        }
        
        if (questionText) {
          inlineQuestions.push({
            number: questionNumber,
            text: questionText,
            options: options
          });
        }
      }
      
      if (inlineQuestions.length > 0) {
        parsed.questions = inlineQuestions;
      }
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
    
    // Also check for "Email Content" as body field
    const emailContentField = parsed.fields.find(f => f.label.toLowerCase() === 'email content');
    const actualBodyField = bodyField || emailContentField;

    return (
      <div className="space-y-0">
        {/* Email Header with logo */}
        <div className="flex items-center gap-4 pb-4 border-b border-white/[0.06]">
          <Image 
            src={isMicrosoftEmail ? '/Microsoft_Outlook_Icon_(2025–present).svg.png' : '/gmail.png'} 
            alt={isMicrosoftEmail ? 'Outlook' : 'Gmail'} 
            width={32} 
            height={32}
            className="object-contain"
          />
          <div className="flex-1">
            <span className="text-white/40 text-xs">To:</span>
            <p className={`font-medium text-sm ${isMicrosoftEmail ? 'text-blue-400' : 'text-emerald-400'}`}>
              {toField?.value || 'No recipient'}
            </p>
          </div>
          <span className="text-xs text-white/50 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg font-mono">sendEmail</span>
        </div>
        
        {/* CC/BCC if present */}
        {(ccField || bccField) && (
          <div className="flex gap-6 py-3 border-b border-white/[0.06]">
            {ccField && (
              <div>
                <span className="text-white/40 text-xs">CC: </span>
                <span className="text-white/70 text-xs">{ccField.value}</span>
              </div>
            )}
            {bccField && (
              <div>
                <span className="text-white/40 text-xs">BCC: </span>
                <span className="text-white/70 text-xs">{bccField.value}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Subject */}
        <div className="py-4 border-b border-white/[0.06]">
          <p className="text-white/40 text-xs mb-1.5">Subject</p>
          <p className="text-white font-medium text-[15px]">{subjectField?.value || 'No subject'}</p>
        </div>
        
        {/* Email Body */}
        {actualBodyField && actualBodyField.value && (
          <div className="pt-4">
            <p className="text-white/40 text-xs mb-2">Email Content</p>
            <div className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed bg-white/[0.02] rounded-xl p-4 border border-white/[0.06]">
              {actualBodyField.value}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Special handling for create_form action type - beautiful form preview
  if (actionType === 'create_form') {
    const titleField = parsed.fields.find(f => f.label.toLowerCase() === 'title');
    const descriptionField = parsed.fields.find(f => f.label.toLowerCase() === 'description');
    // Use parsed.description if available (extracted before questions)
    // Only fall back to descriptionField if we don't have parsed questions (to avoid showing raw content with questions mixed in)
    const formDescription = parsed.description || 
      (parsed.questions && parsed.questions.length > 0 ? undefined : descriptionField?.value || parsed.fields.find(f => f.isBody)?.value);
    
    return (
      <div className="space-y-4">
        {/* Form Header with Google Forms branding */}
        <div className="flex items-center gap-4 pb-4 border-b border-white/[0.06]">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg leading-tight">
              {titleField?.value || 'Untitled Form'}
            </h3>
            <span className="text-xs text-purple-400/80">Google Form</span>
          </div>
          <span className="text-xs text-white/50 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg font-mono">createForm</span>
        </div>
        
        {/* Form Description */}
        {formDescription && (
          <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.06]">
            <p className="text-white/60 text-sm leading-relaxed">
              {formDescription}
            </p>
          </div>
        )}
        
        {/* Questions Section */}
        {parsed.questions && parsed.questions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 pt-2">
              <span className="text-white/50 text-xs uppercase tracking-wider font-medium">Questions</span>
              <span className="text-white/30 text-xs">({parsed.questions.length})</span>
            </div>
            
            {/* Individual Question Cards */}
            <div className="space-y-3">
              {parsed.questions.map((q, idx) => {
                // Determine question type from emoji/text
                const isRequired = q.text.includes('*(required)*') || q.text.includes('*');
                const questionText = q.text.replace(/\*\(required\)\*/g, '').replace(/\*$/g, '').trim();
                
                // Detect question type from emoji
                let questionType = 'text';
                let typeIcon = '📝';
                if (q.text.includes('📋') || (q.options && q.options.length > 0 && !q.text.includes('☑️'))) {
                  questionType = 'multiple_choice';
                  typeIcon = '🔘';
                } else if (q.text.includes('☑️')) {
                  questionType = 'checkbox';
                  typeIcon = '☑️';
                } else if (q.text.includes('⭐')) {
                  questionType = 'scale';
                  typeIcon = '⭐';
                } else if (q.text.includes('📝') || q.text.includes('📄')) {
                  questionType = 'text';
                  typeIcon = '📝';
                }
                
                return (
                  <div 
                    key={idx} 
                    className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] rounded-xl border border-white/[0.08] overflow-hidden hover:border-white/[0.12] transition-all duration-200"
                  >
                    {/* Question Header */}
                    <div className="px-4 py-3 border-b border-white/[0.05]">
                      <div className="flex items-start gap-3">
                        {/* Question Number Badge */}
                        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                          <span className="text-purple-300 font-semibold text-sm">{q.number}</span>
                        </div>
                        
                        {/* Question Text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm leading-relaxed">
                            {questionText.replace(/^[📝📄🔘☑️📋⭐📅🕐❓]\s*/, '')}
                            {isRequired && (
                              <span className="text-red-400 ml-1">*</span>
                            )}
                          </p>
                          
                          {/* Question Type Badge */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-white/40 bg-white/[0.05] px-2 py-0.5 rounded-full capitalize">
                              {typeIcon} {questionType.replace('_', ' ')}
                            </span>
                            {isRequired && (
                              <span className="text-[10px] text-red-400/80 bg-red-500/10 px-2 py-0.5 rounded-full">
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Options (if any) */}
                    {q.options && q.options.length > 0 && (
                      <div className="px-4 py-3 bg-white/[0.01]">
                        <div className="space-y-2 pl-10">
                          {q.options.map((opt, optIdx) => (
                            <div 
                              key={optIdx} 
                              className="flex items-center gap-3 group"
                            >
                              {/* Option Radio/Checkbox indicator */}
                              <div className={`flex-shrink-0 ${
                                questionType === 'checkbox' 
                                  ? 'w-4 h-4 rounded-[3px] border-2 border-white/20' 
                                  : 'w-4 h-4 rounded-full border-2 border-white/20'
                              }`} />
                              
                              {/* Option Text */}
                              <span className="text-white/60 text-sm group-hover:text-white/80 transition-colors">
                                {opt}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Other fields that aren't title/description */}
        {parsed.fields.filter(f => 
          f.label.toLowerCase() !== 'title' && 
          f.label.toLowerCase() !== 'description' && 
          !f.isBody
        ).length > 0 && (
          <div className="pt-3 border-t border-white/[0.06] space-y-2">
            {parsed.fields.filter(f => 
              f.label.toLowerCase() !== 'title' && 
              f.label.toLowerCase() !== 'description' && 
              !f.isBody
            ).map((field, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-white/40 text-xs min-w-[80px] flex-shrink-0">{field.label}:</span>
                <span className="text-white/70 text-sm">{field.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // For other action types - render as clean card with glassmorphic styling
  return (
    <div className="space-y-3">
      {/* Fields */}
      {parsed.fields.filter(f => !f.isBody).map((field, idx) => (
        <div key={idx} className="flex items-start gap-3">
          <span className="text-white/40 text-sm min-w-[100px] flex-shrink-0">{field.label}:</span>
          <span className={`text-sm ${field.label.toLowerCase() === 'title' || field.label.toLowerCase() === 'name' ? 'text-white font-medium' : 'text-white/70'}`}>
            {field.value}
          </span>
        </div>
      ))}
      
      {/* Questions (for forms) */}
      {parsed.questions && parsed.questions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Questions</p>
          <div className="space-y-3">
            {parsed.questions.map((q, idx) => (
              <div key={idx} className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.06]">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-medium text-sm">{q.number}.</span>
                  <div className="flex-1">
                    <p className="text-white/80 text-sm">{q.text}</p>
                    {q.options && q.options.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2 text-xs text-white/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
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
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <div className="text-white/70 text-sm whitespace-pre-wrap leading-relaxed bg-white/[0.02] rounded-xl p-4 border border-white/[0.06]">
            {parsed.fields.find(f => f.isBody)?.value}
          </div>
        </div>
      )}
    </div>
  );
};

// Collapsible Confirmed Action Component
const CollapsibleConfirmedAction = ({ 
  content, 
  actionType, 
  agentName, 
  description 
}: { 
  content: string; 
  actionType?: string; 
  agentName?: string; 
  description?: string; 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get the app logo
  const appLogo = getAppLogo(agentName, actionType);
  
  // Extract recipient email from content for email actions
  const getRecipientInfo = () => {
    if (actionType === 'send_email') {
      const toMatch = content.match(/\*\*To\*\*:\s*([^\n]+)/);
      if (toMatch) {
        return toMatch[1].trim();
      }
    }
    return null;
  };

  const recipientEmail = getRecipientInfo();
  
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
              {actionType === 'send_email' && recipientEmail && (
                <span className="text-xs text-white/50 truncate block mt-0.5">To: {recipientEmail}</span>
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
          {/* Preview Content - No duplicate header */}
          <div className="p-5">
            <div 
              className="space-y-3"
              style={{ 
                fontFamily: 'Inter, "Inter Fallback"',
                fontSize: '14px',
                lineHeight: '22px',
              }}
            >
              {content ? (
                <PreviewContentRenderer content={content} actionType={actionType} agentName={agentName} />
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

interface MainAgentContentProps {
  chatId?: string | null;
  onChatIdChange?: (chatId: string) => void;
}

export function MainAgentContent({ chatId, onChatIdChange }: MainAgentContentProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const taskToastDedupRef = useRef<Set<string>>(new Set());
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
  // File attachment state
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const fileAttachmentRef = useRef<FileAttachmentRef>(null);
  
  // Confirmation flow state
  const [pendingConfirmation, setPendingConfirmation] = useState<ConfirmationRequest | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  // Memory state - track which message pairs have been saved to memory
  const [savedToMemory, setSavedToMemory] = useState<Set<string>>(new Set());
  const [savingToMemory, setSavingToMemory] = useState<string | null>(null);
  // Timeline state - track execution progress
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [showTimeline, setShowTimeline] = useState(true);
  // Track which message ID the current timeline belongs to
  const [timelineMessageId, setTimelineMessageId] = useState<string | null>(null);
  // Store persisted timeline events per message (for viewing historical timelines)
  const [messageTimelines, setMessageTimelines] = useState<Record<string, TimelineEvent[]>>({});

  // Voice input and multi-language state
  const [voiceLanguage, setVoiceLanguage] = useState('en-US');

  // File generation request tracking - track which message should get file generation
  const [lastUserQuery, setLastUserQuery] = useState('');
  const [messageFileGenerationMap, setMessageFileGenerationMap] = useState<Record<string, 'pdf' | 'txt'>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamingContentRef = useRef<string>('');
  const metadataRef = useRef<{ agentsUsed?: string[], processingTime?: string }>({});
  const shouldSaveRef = useRef<boolean>(false);
  const isSavingRef = useRef<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Voice input hook
  const voiceInput = useVoiceInput({
    language: voiceLanguage,
    continuous: true,
    interimResults: true,
    onTranscript: (transcript, isFinal) => {
      if (isFinal) {
        setInput(transcript);
      }
    },
    onError: (error) => {
      console.error('[VoiceInput] Error:', error);
    },
  });

  // TTS hook for reading assistant messages
  const tts = useTTS({ language: voiceLanguage });

  // Strict language matching: respond ONLY in user's current message language.
  // We still use the selected voice language as a hint for same-script languages (e.g., Devanagari).
  const getResponseLanguageForQuery = (text: string): string => {
    const trimmed = (text || '').trim();
    if (!trimmed) return 'English';

    // Basic script detection
    const hasDevanagari = /[\u0900-\u097F]/.test(trimmed);
    const hasLatin = /[A-Za-z]/.test(trimmed);

    // If the user typed in English/Latin, force English.
    if (hasLatin && !hasDevanagari) return 'English';

    // If Devanagari is present, use the currently selected base language as the best guess
    // (Marathi vs Hindi etc), otherwise fall back to English.
    if (hasDevanagari) return getBaseLanguageName(voiceLanguage) || 'Hindi';

    // Default fallback
    return getBaseLanguageName(voiceLanguage) || 'English';
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Track if initial load has been done to prevent duplicate session creation
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/signin');
      return;
    }

    // Prevent running initialization multiple times
    if (initialLoadDone.current) {
      return;
    }
    initialLoadDone.current = true;

    const initializeChat = async () => {
      await migrateOldConversation();
      loadExamplesAndHealth();

      // If chatId is provided from parent (dashboard), load that session
      // Otherwise, wait for parent to provide one - don't create our own
      if (chatId) {
        await loadChatSession(chatId);
      }
      // If no chatId provided, just wait - the parent (dashboard) will provide one
      // This prevents duplicate session creation between dashboard and MainAgentContent

      await loadChatHistory();
    };

    initializeChat();
  }, [router, chatId]);

  // Handle chatId changes from parent (dashboard sidebar)
  // This handles both selecting existing chats and creating new chats
  useEffect(() => {
    if (chatId && chatId !== currentChatId) {
      // Clear current state immediately for better UX
      setMessages([]);
      setShowExamples(true);
      setInput('');
      setIsLoading(false);
      setIsThinking(false);
      setStreamingMessageId(null);
      setPendingConfirmation(null);
      
      // Update the current chat ID
      setCurrentChatId(chatId);
      
      // Load the chat session (or if it's a new empty session, it will just set empty messages)
      loadChatSession(chatId);
    }
  }, [chatId]);

  // Realtime subscription for messages - updates UI instantly when messages are inserted/updated
  useEffect(() => {
    if (!currentChatId) return;

    const supabase = getSupabaseClient();
    const channelName = `chat-messages-${currentChatId}`;

    console.log('[Realtime] Setting up message subscription for chat:', currentChatId);

    const channel = supabase
      .channel(channelName)
      // Listen for new messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_session_id=eq.${currentChatId}`,
        },
        (payload) => {
          const newRow = payload.new as ChatMessageRow;
          console.log('[Realtime] Message INSERT received:', newRow.id);

          // Only add if not already in messages (avoid duplicates from local state)
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newRow.id);
            if (exists) {
              console.log('[Realtime] Message already exists, skipping');
              return prev;
            }

            const newMessage = rowToChatMessage(newRow);
            console.log('[Realtime] Adding new message to UI');
            return [...prev, newMessage];
          });
        }
      )
      // Listen for message updates (e.g., AI response streaming completion)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_session_id=eq.${currentChatId}`,
        },
        (payload) => {
          const updatedRow = payload.new as ChatMessageRow;
          console.log('[Realtime] Message UPDATE received:', updatedRow.id);

          setMessages((prev) =>
            prev.map((m) =>
              m.id === updatedRow.id 
                ? { ...rowToChatMessage(updatedRow), files: m.files }  // Preserve files on update
                : m
            )
          );
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Message subscription status:', status);
      });

    return () => {
      console.log('[Realtime] Cleaning up message subscription for chat:', currentChatId);
      supabase.removeChannel(channel);
    };
  }, [currentChatId]);

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

  const loadChatHistory = async (forceRefresh: boolean = false) => {
    const grouped = await getGroupedChatSessions(forceRefresh);
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
      // Convert fileGeneration to files format for database persistence
      const messagesWithFiles = validMessages.map(msg => {
        if (msg.fileGeneration && !msg.files) {
          return {
            ...msg,
            files: [
              {
                id: `${msg.id}-file-${Date.now()}`,
                filename: msg.fileGeneration.filename,
                originalFilename: msg.fileGeneration.filename,
                mimeType: msg.fileGeneration.type === 'pdf' ? 'application/pdf' : 'text/plain',
                size: msg.fileGeneration.fileSize || 0,
                url: msg.fileGeneration.fileUrl,
                fileType: msg.fileGeneration.type === 'pdf' ? 'document' : 'other' as const,
              }
            ],
          };
        }
        return msg;
      });

      // Map fileType to allowed union type and ensure correct typing
      const allowedFileTypes = ["audio", "image", "document", "video", "other"] as const;
      const fixedMessagesWithFiles: ChatMessage[] = messagesWithFiles.map((msg) => {
        if (msg && Array.isArray(msg.files)) {
          return {
            ...msg,
            files: msg.files.map((file) => ({
              ...file,
              fileType: allowedFileTypes.includes(file.fileType as any)
                ? (file.fileType as typeof allowedFileTypes[number])
                : "other",
            })),
          };
        }
        return msg as ChatMessage;
      });
      const result = await updateChatSession(currentChatId, fixedMessagesWithFiles);
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
    try {
      // Use cached version for faster loading
      const session = await getChatSessionCached(chatIdToLoad);
      if (session) {
        setCurrentChatId(session.id);
        
        // Sort messages by sequence_order (if available) or timestamp for correct order
        const sortedMessages = [...(session.messages || [])].sort((a, b) => {
          // Use sequence order if both have it
          if (a.sequenceOrder != null && b.sequenceOrder != null) {
            return a.sequenceOrder - b.sequenceOrder;
          }
          // Fall back to timestamp
          const timeA = new Date(a.timestamp || 0).getTime();
          const timeB = new Date(b.timestamp || 0).getTime();
          return timeA - timeB;
        });
        
        setMessages(sortedMessages);
        setShowExamples(!sortedMessages || sortedMessages.length === 0);
        onChatIdChange?.(session.id);
        
        // Fetch timeline events for assistant messages
        const assistantMessages = sortedMessages
          .filter(m => m.role === 'assistant');
        const assistantMessageIds = assistantMessages.map(m => m.id);
        
        if (assistantMessageIds.length > 0) {
          try {
            const timelinesData = await getTimelineEventsForMessages(assistantMessageIds);
            // Convert to TimelineEvent format and store - KEEP EACH MESSAGE'S TIMELINE SEPARATE
            const timelinesMap: Record<string, TimelineEvent[]> = {};
            
            for (const [msgId, events] of Object.entries(timelinesData)) {
              const convertedEvents = (events as TimelineEventData[]).map(e => ({
                eventId: e.eventId || `stored-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                type: e.type as TimelineEvent['type'],
                timestamp: e.timestamp || new Date().toISOString(),
                message: e.message,
                agentName: e.agentName,
                agentDisplayName: e.agentDisplayName,
                agentIcon: e.agentIcon,
                toolName: e.toolName,
                toolDisplayName: e.toolDisplayName,
                status: (e.status as 'completed' | 'in-progress' | 'failed' | 'pending') || 'completed',
                icon: e.icon,
                description: e.description,
                data: e.data,
                result: e.result,
              }));
              
              // Store timeline for THIS message (not merged with others)
              if (convertedEvents.length > 0) {
                timelinesMap[msgId] = convertedEvents;
              }
            }
            
            // Set all message timelines (each message has its own timeline)
            setMessageTimelines(timelinesMap);
          } catch (error) {
            console.error('Error fetching timeline events:', error);
          }
        }
      } else {
        // Session not found - this could be a newly created session that's not yet in the DB
        // or an invalid session ID. Just set empty state with this ID.
        console.log('Session not found, treating as new empty session:', chatIdToLoad);
        setCurrentChatId(chatIdToLoad);
        setMessages([]);
        setShowExamples(true);
        onChatIdChange?.(chatIdToLoad);
        setMessageTimelines({});
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
      // On error, still set the chat ID and show empty state
      setCurrentChatId(chatIdToLoad);
      setMessages([]);
      setShowExamples(true);
      setMessageTimelines({});
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // File attachment handlers
  const handleAttachFile = () => {
    fileAttachmentRef.current?.triggerFileSelect();
  };

  const handleFileAttached = (file: UploadedFile) => {
    setAttachedFiles(prev => [...prev, file]);
  };

  const handleFileRemoved = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSendMessage = async (queryText?: string) => {
    const query = queryText || input.trim();
    
    if (!query || isLoading) return;

    // Detect if user is asking for file generation
    const { fileType, isExplicit } = detectFileGenerationRequest(query);
    setLastUserQuery(query);

    // Stop voice input if recording
    if (voiceInput.isListening) {
      voiceInput.stopListening();
    }
    voiceInput.resetTranscript();

    setInput('');
    setShowExamples(false);

    // Store attached files for this message
    const messageFiles = [...attachedFiles];
    setAttachedFiles([]); // Clear for next message

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
      // Attach file metadata for display in chat (not persisted to DB)
      ...(messageFiles.length > 0 && {
        files: messageFiles.map(f => ({
          id: f.id,
          filename: f.filename,
          originalFilename: f.originalFilename,
          mimeType: f.mimeType,
          size: f.size,
          url: f.url,
          fileType: f.fileType,
        }))
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    
    // IMMEDIATE INSERT: Save user message to DB right away (don't wait for AI response)
    // This enables realtime to push the message to other clients instantly
    if (currentChatId) {
      // Fire and forget - don't await to avoid blocking UI
      updateChatSession(currentChatId, [userMessage]).catch((err) => {
        console.error('Error saving user message immediately:', err);
      });
    }
    
    setIsLoading(true);
    setIsThinking(true);
    setThinkingMessage('Thinking...');
    setTimelineEvents([]); // Reset timeline for new query
    
    const assistantMessageId = (Date.now() + 1).toString();
    setTimelineMessageId(assistantMessageId); // Associate timeline with this message
    setStreamingMessageId(assistantMessageId);
    streamingContentRef.current = '';
    metadataRef.current = {};
    
    // Store file generation request for this specific message
    const { fileType: detectedFileType, isExplicit: isExplicitFileGen } = detectFileGenerationRequest(lastUserQuery);
    console.log('[MainAgentContent] File generation detection:', {
      query: lastUserQuery,
      isExplicit: isExplicitFileGen,
      detectedFileType,
      messageId: assistantMessageId,
    });
    
    if (isExplicitFileGen && detectedFileType) {
      console.log(`[MainAgentContent] Setting up file generation for message ${assistantMessageId}:`, detectedFileType);
      setMessageFileGenerationMap(prev => ({
        ...prev,
        [assistantMessageId]: detectedFileType
      }));
    }
    
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

      // Extract file IDs from attached files
      const fileIds = messageFiles.map(f => f.id);

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
            console.log('[Confirmation] Is modification:', chunk.isModification);
            console.log('[Confirmation] Looking for message ID:', assistantMessageId);
            
            // Build the preview content with step indicator if part of a chain
            let confirmationPreview = chunk.previewContent || 'Action requires confirmation';
            if (chunk.chainInfo) {
              const stepIndicator = `📋 **Step ${chunk.chainInfo.currentStep} of ${chunk.chainInfo.totalSteps}**\n\n`;
              confirmationPreview = stepIndicator + confirmationPreview;
            }
            
            // If this is a modification, update the EXISTING pending confirmation message
            // Otherwise, create/update the assistant message as before
            if (chunk.isModification && pendingConfirmation) {
              console.log('[Confirmation] 🔄 Updating with modification - creating new preview after user message');
              console.log('[Confirmation] 🔄 Updated preview:', confirmationPreview.substring(0, 100));
              
              setMessages((prev) => {
                // Remove the empty assistant message we just created AND the old pending confirmation
                const filtered = prev.filter(m => {
                  // Remove empty assistant message
                  if (m.id === assistantMessageId && m.content === '') return false;
                  // Remove old pending confirmation message
                  if ((m as any).isPendingConfirmation) return false;
                  return true;
                });
                
                // Add the new confirmation message AFTER the user's modification message
                const newConfirmMessage = {
                  id: `assistant-modified-${Date.now()}`,
                  role: 'assistant' as const,
                  content: confirmationPreview,
                  timestamp: new Date(),
                  isPendingConfirmation: true,
                  confirmationData: {
                    requestId: chunk.requestId!,
                    toolName: chunk.toolName!,
                    agentName: chunk.agentName!,
                    actionType: chunk.actionType!,
                    description: chunk.description!,
                  }
                };
                
                console.log('[Confirmation] 🔄 Removed old preview, adding new one. Messages: before=' + prev.length + ', after=' + (filtered.length + 1));
                return [...filtered, newConfirmMessage];
              });
              
              // Also update the pending confirmation state
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
            } else {
              // Original behavior - update the assistant message
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
            }
            
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
          
          // Timeline event handlers - update status for completion/failure events
          case 'timeline_agent_completed':
          case 'timeline_agent_failed':
            // Update existing executing event for this agent instead of adding new
            setTimelineEvents((prev) => {
              // Determine status from backend or infer from type
              const eventStatus = chunk.status || (chunk.type === 'timeline_agent_completed' ? 'completed' : 'failed');
              
              // Find the executing event for this agent
              const executingIndex = prev.findIndex(
                e => e.type === 'timeline_agent_executing' && e.agentName === chunk.agentName
              );
              if (executingIndex >= 0) {
                // Update the existing event's type and status
                const updated = [...prev];
                updated[executingIndex] = {
                  ...updated[executingIndex],
                  type: chunk.type as TimelineEvent['type'],
                  status: eventStatus as TimelineEvent['status'],
                  result: chunk.result,
                  message: chunk.needsClarification ? 'Awaiting clarification' : chunk.message,
                  needsClarification: chunk.needsClarification,
                };
                return updated;
              }
              // If no executing event found, add as new
              return [...prev, {
                eventId: chunk.eventId || `event-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                type: chunk.type as TimelineEvent['type'],
                timestamp: chunk.timestamp || new Date().toISOString(),
                message: chunk.needsClarification ? 'Awaiting clarification' : chunk.message,
                agentName: chunk.agentName,
                agentDisplayName: chunk.agentDisplayName,
                status: eventStatus as TimelineEvent['status'],
                needsClarification: chunk.needsClarification,
              }];
            });
            break;
          
          case 'timeline_tool_completed':
          case 'timeline_tool_failed':
            // Update existing tool_started event instead of adding new
            setTimelineEvents((prev) => {
              const startedIndex = prev.findIndex(
                e => e.type === 'timeline_tool_started' && e.toolName === chunk.toolName && e.agentName === chunk.agentName
              );
              if (startedIndex >= 0) {
                const updated = [...prev];
                updated[startedIndex] = {
                  ...updated[startedIndex],
                  type: chunk.type as TimelineEvent['type'],
                  status: chunk.type === 'timeline_tool_completed' ? 'completed' : 'failed',
                  result: chunk.result,
                };
                return updated;
              }
              return prev; // Don't add if no matching started event
            });
            break;
          
          // Update-in-place events for processing phases
          case 'timeline_memory_retrieved':
            setTimelineEvents((prev) => {
              const searchingIndex = prev.findIndex(e => e.type === 'timeline_memory_searching');
              if (searchingIndex >= 0) {
                const updated = [...prev];
                updated[searchingIndex] = {
                  ...updated[searchingIndex],
                  type: 'timeline_memory_retrieved',
                  status: 'completed',
                  message: chunk.message,
                };
                return updated;
              }
              return [...prev, {
                eventId: chunk.eventId || `event-${Date.now()}`,
                type: 'timeline_memory_retrieved' as TimelineEventType,
                timestamp: chunk.timestamp || new Date().toISOString(),
                message: chunk.message,
                status: 'completed',
              }];
            });
            break;
          
          case 'timeline_artifact_resolved':
            setTimelineEvents((prev) => {
              const scanningIndex = prev.findIndex(e => e.type === 'timeline_artifact_scanning');
              if (scanningIndex >= 0) {
                const updated = [...prev];
                updated[scanningIndex] = {
                  ...updated[scanningIndex],
                  type: 'timeline_artifact_resolved',
                  status: 'completed',
                  message: chunk.message,
                };
                return updated;
              }
              return [...prev, {
                eventId: chunk.eventId || `event-${Date.now()}`,
                type: 'timeline_artifact_resolved' as TimelineEventType,
                timestamp: chunk.timestamp || new Date().toISOString(),
                message: chunk.message,
                status: 'completed',
              }];
            });
            break;
          
          case 'timeline_analysis_complete':
            setTimelineEvents((prev) => {
              const analyzingIndex = prev.findIndex(e => e.type === 'timeline_analyzing_query');
              if (analyzingIndex >= 0) {
                const updated = [...prev];
                updated[analyzingIndex] = {
                  ...updated[analyzingIndex],
                  type: 'timeline_analysis_complete',
                  status: 'completed',
                  message: chunk.message,
                };
                return updated;
              }
              return [...prev, {
                eventId: chunk.eventId || `event-${Date.now()}`,
                type: 'timeline_analysis_complete' as TimelineEventType,
                timestamp: chunk.timestamp || new Date().toISOString(),
                message: chunk.message,
                status: 'completed',
              }];
            });
            break;
          
          // Task completed - update ALL generating_response events to completed
          case 'timeline_task_completed':
            // Debug: confirm we are receiving completion events
            try {
              // eslint-disable-next-line no-console
              console.debug('[ToastDebug] SSE chunk timeline_task_completed', {
                eventId: chunk.eventId,
                status: chunk.status,
                message: chunk.message,
                summary: chunk.summary,
                currentChatId,
                assistantMessageId,
              });
            } catch (_) {}
            setTimelineEvents((prev) => {
              // Determine status from backend
              const taskStatus = (chunk.status || 'completed') as TimelineEvent['status'];
              const taskMessage = taskStatus === 'needs_input' 
                ? 'Awaiting your response' 
                : (chunk.message || chunk.summary || 'Request completed successfully');
              
              // Find all generating_response events that need to be updated
              const hasGeneratingResponse = prev.some(e => e.type === 'timeline_generating_response');
              if (hasGeneratingResponse) {
                // Update all generating_response events to completed
                return prev.map(e => 
                  e.type === 'timeline_generating_response' 
                    ? {
                        ...e,
                        type: 'timeline_task_completed' as TimelineEventType,
                        status: taskStatus,
                        message: taskMessage,
                      }
                    : e
                );
              }
              // If no generating_response found, add as new event
              return [...prev, {
                eventId: chunk.eventId || `event-${Date.now()}`,
                type: 'timeline_task_completed' as TimelineEventType,
                timestamp: chunk.timestamp || new Date().toISOString(),
                message: taskMessage,
                status: taskStatus,
              }];
            });

            // Toast: action completed / needs input (debounced by eventId/message)
            try {
              const dedupeKey = `task:${assistantMessageId || ''}:${chunk.eventId || ''}:${chunk.type}:${chunk.status || ''}:${chunk.message || chunk.summary || ''}`;
              if (!taskToastDedupRef.current.has(dedupeKey)) {
                taskToastDedupRef.current.add(dedupeKey);
                const taskStatus = (chunk.status || 'completed') as TimelineEvent['status'];
                const taskMessage =
                  taskStatus === 'needs_input'
                    ? 'Awaiting your response'
                    : (chunk.message || chunk.summary || 'Request completed successfully');

                showToast({
                  title: taskStatus === 'needs_input' ? 'Needs your input' : 'Action completed',
                  message: taskMessage,
                  variant: taskStatus === 'needs_input' ? 'warning' : 'success',
                  duration: taskStatus === 'needs_input' ? 5000 : 4000,
                  onClick: currentChatId
                    ? () => router.push(`/dashboard?tab=MainAgent&chatId=${encodeURIComponent(currentChatId)}`)
                    : () => router.push('/dashboard?tab=MainAgent'),
                });
                // eslint-disable-next-line no-console
                console.debug('[ToastDebug] showToast fired (SSE completed)', { dedupeKey, taskStatus, taskMessage });
              } else {
                // eslint-disable-next-line no-console
                console.debug('[ToastDebug] toast deduped (SSE completed)', { dedupeKey });
              }
            } catch (_) {}
            break;

          case 'timeline_task_failed':
            try {
              // eslint-disable-next-line no-console
              console.debug('[ToastDebug] SSE chunk timeline_task_failed', {
                eventId: chunk.eventId,
                message: chunk.message,
                summary: chunk.summary,
                currentChatId,
                assistantMessageId,
              });
            } catch (_) {}
            setTimelineEvents((prev) => {
              const taskMessage = chunk.message || chunk.summary || 'Request failed';
              const hasGeneratingResponse = prev.some(e => e.type === 'timeline_generating_response');
              if (hasGeneratingResponse) {
                return prev.map(e =>
                  e.type === 'timeline_generating_response'
                    ? {
                        ...e,
                        type: 'timeline_task_failed' as TimelineEventType,
                        status: 'failed',
                        message: taskMessage,
                      }
                    : e
                );
              }
              return [...prev, {
                eventId: chunk.eventId || `event-${Date.now()}`,
                type: 'timeline_task_failed' as TimelineEventType,
                timestamp: chunk.timestamp || new Date().toISOString(),
                message: taskMessage,
                status: 'failed',
              }];
            });

            // Toast: action failed (debounced by eventId/message)
            try {
              const dedupeKey = `task:${assistantMessageId || ''}:${chunk.eventId || ''}:${chunk.type}:${chunk.message || chunk.summary || ''}`;
              if (!taskToastDedupRef.current.has(dedupeKey)) {
                taskToastDedupRef.current.add(dedupeKey);
                showToast({
                  title: 'Action failed',
                  message: chunk.message || chunk.summary || 'Request failed',
                  variant: 'error',
                  duration: 5000,
                  onClick: currentChatId
                    ? () => router.push(`/dashboard?tab=MainAgent&chatId=${encodeURIComponent(currentChatId)}`)
                    : () => router.push('/dashboard?tab=MainAgent'),
                });
                // eslint-disable-next-line no-console
                console.debug('[ToastDebug] showToast fired (SSE failed)', { dedupeKey });
              } else {
                // eslint-disable-next-line no-console
                console.debug('[ToastDebug] toast deduped (SSE failed)', { dedupeKey });
              }
            } catch (_) {}
            break;
          
          case 'timeline_plan':
          case 'timeline_agent_added':
          case 'timeline_agent_executing':
          case 'timeline_narrative':
          case 'timeline_tool_started':
          case 'timeline_confirmation_required':
          case 'timeline_confirmation_received':
          case 'timeline_memory_searching':
          case 'timeline_memory_stored':
          case 'timeline_artifact_scanning':
          case 'timeline_analyzing_query':
          case 'timeline_generating_response':
            // Add the timeline event to state
            const timelineEvent: TimelineEvent = {
              eventId: chunk.eventId || `event-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              type: chunk.type,
              timestamp: chunk.timestamp || new Date().toISOString(),
              message: chunk.message,
              agentName: chunk.agentName,
              agentIcon: chunk.agentIcon,
              agentDisplayName: chunk.agentDisplayName,
              toolName: chunk.toolName,
              toolDisplayName: chunk.toolDisplayName,
              query: chunk.query,
              result: chunk.result,
              data: chunk.data,
              summary: chunk.summary,
              status: (chunk.type === 'timeline_agent_executing' || chunk.type === 'timeline_tool_started' 
                || chunk.type === 'timeline_memory_searching' || chunk.type === 'timeline_artifact_scanning'
                || chunk.type === 'timeline_analyzing_query' || chunk.type === 'timeline_generating_response') 
                ? 'in-progress' : (chunk.status as 'completed' | 'in-progress' | 'failed' | 'pending' || 'completed'),
            };
            setTimelineEvents((prev) => [...prev, timelineEvent]);
            break;
          
          case 'file_generated':
            console.log('[FileGeneration] 📄 File generated event received:', chunk);
            // File was successfully generated - store the file information
            // This will be used to trigger file download or display in the FileGenerationPanel
            if (assistantMessageId && chunk.fileType && chunk.fileUrl && chunk.filename) {
              const fileInfo = {
                type: chunk.fileType as 'pdf' | 'txt',
                filename: chunk.filename,
                fileUrl: chunk.fileUrl,
                fileSize: chunk.fileSize,
                expiresIn: chunk.expiresIn,
              };
              console.log(`[FileGeneration] ✅ ${chunk.fileType.toUpperCase()} generated: ${chunk.filename}`);
              console.log(`[FileGeneration] Download URL: ${chunk.fileUrl}`);
              console.log(`[FileGeneration] Setting file info for message: ${assistantMessageId}`);
              
              // Update the message with file generation info
              setMessages((prev) => {
                const updated = prev.map((m) => {
                  if (m.id === assistantMessageId) {
                    console.log('[FileGeneration] 📌 Updating message', assistantMessageId, 'with file generation info');
                    return { ...m, fileGeneration: fileInfo };
                  }
                  return m;
                });
                return updated;
              });

              // Toast: file generated (click opens download)
              showToast({
                title: 'File generated',
                message: `${chunk.filename} is ready for download`,
                variant: 'success',
                duration: 4000,
                onClick: () => window.open(chunk.fileUrl as string, '_blank', 'noopener,noreferrer'),
              });
            } else {
              console.warn('[FileGeneration] ⚠️ Missing required fields for file generation:', {
                assistantMessageId,
                fileType: chunk.fileType,
                fileUrl: chunk.fileUrl,
                filename: chunk.filename
              });
            }
            break;
          
          case 'file_generation_error':
            console.error('[FileGeneration] ❌ Error:', chunk.message);
            // File generation failed - log the error but don't fail the entire request
            showToast({
              title: 'File generation failed',
              message: chunk.message || 'Failed to generate file',
              variant: 'error',
              duration: 5000,
            });
            break;
          
          case 'memory_stored':
            console.log('[Memory] ✅ Stored:', chunk.memoryId);
            // Memory was stored successfully
            break;
          
          case 'error':
            throw new Error(chunk.error || chunk.message || 'Unknown error');
            
          case 'done':
            const finalContent = streamingContentRef.current;
            const finalMetadata = { ...metadataRef.current };
            
            // Store timeline events for this message in local state for future viewing
            setMessageTimelines((prev) => ({
              ...prev,
              [assistantMessageId]: [...timelineEvents],
            }));
            
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
      }, currentChatId || undefined, userLocation, assistantMessageId, fileIds, userMessage.id, getResponseLanguageForQuery(userMessage.content));  // Strict per-message response language

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
      const withResponse = [...updated, responseMessage];
      
      // Save to database immediately to persist the confirmed state
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveMessagesToDB(withResponse);
        saveTimeoutRef.current = null;
      }, 100);
      
      return withResponse;
    });

    // Track if a new confirmation is received during streaming (for action chains)
    let receivedNewConfirmation = false;

    try {
      // Pass messageId and chatId for timeline storage at chain completion
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
            console.log('[Confirmation] Is modification:', chunk.isModification);
            receivedNewConfirmation = true;
            
            // Prepare preview content
            const nextConfirmPreview = chunk.previewContent || 'Action requires confirmation';
            const chainInfo = chunk.chainInfo;
            const stepIndicator = chainInfo ? `\n\n📋 **Step ${chainInfo.currentStep} of ${chainInfo.totalSteps}**` : '';
            
            // If this is a modification, update the existing pending confirmation
            if (chunk.isModification && pendingConfirmation) {
              console.log('[Confirmation] 🔄 [CHAIN] Updating existing confirmation with modified parameters');
              console.log('[Confirmation] 🔄 [CHAIN] Updated preview length:', nextConfirmPreview.length);
              
              setMessages((prev) => {
                const updated = prev.map((m) =>
                  (m as any).isPendingConfirmation
                    ? {
                        ...m,
                        content: stepIndicator + '\n\n' + nextConfirmPreview,
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
                console.log('[Confirmation] 🔄 [CHAIN] Updated messages count:', updated.filter((m: any) => m.isPendingConfirmation).length);
                return updated;
              });
            } else {
              // Original behavior - finalize current message and create new confirmation message
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
            }
            
            // Set the new/updated pending confirmation
            setPendingConfirmation({
              requestId: chunk.requestId!,
              toolName: chunk.toolName!,
              agentName: chunk.agentName!,
              actionType: chunk.actionType!,
              description: chunk.description!,
              params: chunk.params || {},
              previewContent: chunk.previewContent || 'Action requires confirmation',
              originalQuery: chunk.originalQuery,
              chainInfo: chunk.chainInfo,
            });
            
            // Reset states for the new confirmation
            setIsThinking(false);
            setIsConfirming(false);
            streamingContentRef.current = '';
            break;
          
          // Timeline event handlers for confirmation flow - update status for completion/failure events
          case 'timeline_agent_completed':
          case 'timeline_agent_failed':
            // Update existing executing event for this agent instead of adding new
            setTimelineEvents((prev) => {
              // Determine status from backend or infer from type
              const eventStatus = chunk.status || (chunk.type === 'timeline_agent_completed' ? 'completed' : 'failed');
              
              const executingIndex = prev.findIndex(
                e => e.type === 'timeline_agent_executing' && e.agentName === chunk.agentName
              );
              if (executingIndex >= 0) {
                const updated = [...prev];
                updated[executingIndex] = {
                  ...updated[executingIndex],
                  type: chunk.type as TimelineEvent['type'],
                  status: eventStatus as TimelineEvent['status'],
                  result: chunk.result,
                  message: chunk.needsClarification ? 'Awaiting clarification' : chunk.message,
                  needsClarification: chunk.needsClarification,
                };
                return updated;
              }
              return [...prev, {
                eventId: chunk.eventId || `event-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                type: chunk.type as TimelineEvent['type'],
                timestamp: chunk.timestamp || new Date().toISOString(),
                message: chunk.needsClarification ? 'Awaiting clarification' : chunk.message,
                agentName: chunk.agentName,
                agentDisplayName: chunk.agentDisplayName,
                status: eventStatus as TimelineEvent['status'],
                needsClarification: chunk.needsClarification,
              }];
            });
            break;
          
          case 'timeline_tool_completed':
          case 'timeline_tool_failed':
            setTimelineEvents((prev) => {
              const startedIndex = prev.findIndex(
                e => e.type === 'timeline_tool_started' && e.toolName === chunk.toolName && e.agentName === chunk.agentName
              );
              if (startedIndex >= 0) {
                const updated = [...prev];
                updated[startedIndex] = {
                  ...updated[startedIndex],
                  type: chunk.type as TimelineEvent['type'],
                  status: chunk.type === 'timeline_tool_completed' ? 'completed' : 'failed',
                  result: chunk.result,
                };
                return updated;
              }
              return prev;
            });
            break;
          
          // Update-in-place events for processing phases (confirmation flow)
          case 'timeline_memory_retrieved':
            setTimelineEvents((prev) => {
              const searchingIndex = prev.findIndex(e => e.type === 'timeline_memory_searching');
              if (searchingIndex >= 0) {
                const updated = [...prev];
                updated[searchingIndex] = {
                  ...updated[searchingIndex],
                  type: 'timeline_memory_retrieved',
                  status: 'completed',
                  message: chunk.message,
                };
                return updated;
              }
              return [...prev, { eventId: chunk.eventId || `event-${Date.now()}`, type: 'timeline_memory_retrieved' as TimelineEventType, timestamp: chunk.timestamp || new Date().toISOString(), message: chunk.message, status: 'completed' }];
            });
            break;
          
          case 'timeline_artifact_resolved':
            setTimelineEvents((prev) => {
              const scanningIndex = prev.findIndex(e => e.type === 'timeline_artifact_scanning');
              if (scanningIndex >= 0) {
                const updated = [...prev];
                updated[scanningIndex] = {
                  ...updated[scanningIndex],
                  type: 'timeline_artifact_resolved',
                  status: 'completed',
                  message: chunk.message,
                };
                return updated;
              }
              return [...prev, { eventId: chunk.eventId || `event-${Date.now()}`, type: 'timeline_artifact_resolved' as TimelineEventType, timestamp: chunk.timestamp || new Date().toISOString(), message: chunk.message, status: 'completed' }];
            });
            break;
          
          case 'timeline_analysis_complete':
            setTimelineEvents((prev) => {
              const analyzingIndex = prev.findIndex(e => e.type === 'timeline_analyzing_query');
              if (analyzingIndex >= 0) {
                const updated = [...prev];
                updated[analyzingIndex] = {
                  ...updated[analyzingIndex],
                  type: 'timeline_analysis_complete',
                  status: 'completed',
                  message: chunk.message,
                };
                return updated;
              }
              return [...prev, { eventId: chunk.eventId || `event-${Date.now()}`, type: 'timeline_analysis_complete' as TimelineEventType, timestamp: chunk.timestamp || new Date().toISOString(), message: chunk.message, status: 'completed' }];
            });
            break;
          
          // Task completed - update ALL generating_response events to completed (confirmation flow)
          case 'timeline_task_completed':
            try {
              // eslint-disable-next-line no-console
              console.debug('[ToastDebug] SSE(confirm) chunk timeline_task_completed', {
                eventId: chunk.eventId,
                status: chunk.status,
                message: chunk.message,
                summary: chunk.summary,
                currentChatId,
                assistantMessageId,
              });
            } catch (_) {}
            setTimelineEvents((prev) => {
              // Determine status from backend
              const taskStatus = (chunk.status || 'completed') as TimelineEvent['status'];
              const taskMessage = taskStatus === 'needs_input' 
                ? 'Awaiting your response' 
                : (chunk.message || chunk.summary || 'Request completed successfully');
              
              // Find all generating_response events that need to be updated
              const hasGeneratingResponse = prev.some(e => e.type === 'timeline_generating_response');
              if (hasGeneratingResponse) {
                // Update all generating_response events to completed
                return prev.map(e => 
                  e.type === 'timeline_generating_response' 
                    ? {
                        ...e,
                        type: 'timeline_task_completed' as TimelineEventType,
                        status: taskStatus,
                        message: taskMessage,
                      }
                    : e
                );
              }
              return [...prev, { eventId: chunk.eventId || `event-${Date.now()}`, type: 'timeline_task_completed' as TimelineEventType, timestamp: chunk.timestamp || new Date().toISOString(), message: taskMessage, status: taskStatus }];
            });

            // Toast: action completed / needs input (debounced)
            try {
              const dedupeKey = `confirm-task:${assistantMessageId || ''}:${chunk.eventId || ''}:${chunk.type}:${chunk.status || ''}:${chunk.message || chunk.summary || ''}`;
              if (!taskToastDedupRef.current.has(dedupeKey)) {
                taskToastDedupRef.current.add(dedupeKey);
                const taskStatus = (chunk.status || 'completed') as TimelineEvent['status'];
                const taskMessage =
                  taskStatus === 'needs_input'
                    ? 'Awaiting your response'
                    : (chunk.message || chunk.summary || 'Request completed successfully');

                showToast({
                  title: taskStatus === 'needs_input' ? 'Needs your input' : 'Action completed',
                  message: taskMessage,
                  variant: taskStatus === 'needs_input' ? 'warning' : 'success',
                  duration: taskStatus === 'needs_input' ? 5000 : 4000,
                  onClick: currentChatId
                    ? () => router.push(`/dashboard?tab=MainAgent&chatId=${encodeURIComponent(currentChatId)}`)
                    : () => router.push('/dashboard?tab=MainAgent'),
                });
                // eslint-disable-next-line no-console
                console.debug('[ToastDebug] showToast fired (SSE confirm completed)', { dedupeKey, taskStatus, taskMessage });
              } else {
                // eslint-disable-next-line no-console
                console.debug('[ToastDebug] toast deduped (SSE confirm completed)', { dedupeKey });
              }
            } catch (_) {}
            break;

          case 'timeline_task_failed':
            try {
              // eslint-disable-next-line no-console
              console.debug('[ToastDebug] SSE(confirm) chunk timeline_task_failed', {
                eventId: chunk.eventId,
                message: chunk.message,
                summary: chunk.summary,
                currentChatId,
                assistantMessageId,
              });
            } catch (_) {}
            setTimelineEvents((prev) => {
              const taskMessage = chunk.message || chunk.summary || 'Action execution failed';
              const hasGeneratingResponse = prev.some(e => e.type === 'timeline_generating_response');
              if (hasGeneratingResponse) {
                return prev.map(e =>
                  e.type === 'timeline_generating_response'
                    ? {
                        ...e,
                        type: 'timeline_task_failed' as TimelineEventType,
                        status: 'failed',
                        message: taskMessage,
                      }
                    : e
                );
              }
              return [...prev, {
                eventId: chunk.eventId || `event-${Date.now()}`,
                type: 'timeline_task_failed' as TimelineEventType,
                timestamp: chunk.timestamp || new Date().toISOString(),
                message: taskMessage,
                status: 'failed',
              }];
            });

            // Toast: action failed (debounced)
            try {
              const dedupeKey = `confirm-task:${assistantMessageId || ''}:${chunk.eventId || ''}:${chunk.type}:${chunk.message || chunk.summary || ''}`;
              if (!taskToastDedupRef.current.has(dedupeKey)) {
                taskToastDedupRef.current.add(dedupeKey);
                showToast({
                  title: 'Action failed',
                  message: chunk.message || chunk.summary || 'Action execution failed',
                  variant: 'error',
                  duration: 5000,
                  onClick: currentChatId
                    ? () => router.push(`/dashboard?tab=MainAgent&chatId=${encodeURIComponent(currentChatId)}`)
                    : () => router.push('/dashboard?tab=MainAgent'),
                });
                // eslint-disable-next-line no-console
                console.debug('[ToastDebug] showToast fired (SSE confirm failed)', { dedupeKey });
              } else {
                // eslint-disable-next-line no-console
                console.debug('[ToastDebug] toast deduped (SSE confirm failed)', { dedupeKey });
              }
            } catch (_) {}
            break;
          
          case 'timeline_plan':
          case 'timeline_agent_added':
          case 'timeline_agent_executing':
          case 'timeline_narrative':
          case 'timeline_tool_started':
          case 'timeline_confirmation_required':
          case 'timeline_confirmation_received':
          case 'timeline_memory_searching':
          case 'timeline_memory_stored':
          case 'timeline_artifact_scanning':
          case 'timeline_analyzing_query':
          case 'timeline_generating_response':
            const confirmTimelineEvent: TimelineEvent = {
              eventId: chunk.eventId || `event-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              type: chunk.type,
              timestamp: chunk.timestamp || new Date().toISOString(),
              message: chunk.message,
              agentName: chunk.agentName,
              agentIcon: chunk.agentIcon,
              agentDisplayName: chunk.agentDisplayName,
              toolName: chunk.toolName,
              toolDisplayName: chunk.toolDisplayName,
              query: chunk.query,
              result: chunk.result,
              data: chunk.data,
              summary: chunk.summary,
              status: (chunk.type === 'timeline_agent_executing' || chunk.type === 'timeline_tool_started' 
                || chunk.type === 'timeline_memory_searching' || chunk.type === 'timeline_artifact_scanning'
                || chunk.type === 'timeline_analyzing_query' || chunk.type === 'timeline_generating_response') 
                ? 'in-progress' : (chunk.status as 'completed' | 'in-progress' | 'failed' | 'pending' || 'completed'),
            };
            setTimelineEvents((prev) => [...prev, confirmTimelineEvent]);
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
      }, { messageId: timelineMessageId || responseMessageId, chatId: currentChatId || undefined });
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
      // Invalidate cache and reload
      invalidateChatCache();
      await loadChatHistory(true);
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
        // Invalidate caches
        invalidateChatCache();
        invalidateChatSessionCache(chatIdToDelete);
        await loadChatHistory(true);
        
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
            <FileAttachment
              ref={fileAttachmentRef}
              onFileAttached={handleFileAttached}
              onFileRemoved={handleFileRemoved}
              attachedFiles={attachedFiles}
              disabled={isLoading}
            />
            <VercelV0Chat
              value={input}
              onChange={setInput}
              onSubmit={handleSendMessage}
              placeholder="Ask me anything... (e.g., 'schedule a meeting and create a document')"
              disabled={isLoading}
              showExamples={true}
              onAttachFile={handleAttachFile}
              attachedFiles={attachedFiles}
              isListening={voiceInput.isListening}
              isVoiceSupported={voiceInput.isSupported}
              onToggleVoice={voiceInput.toggleListening}
              audioLevel={voiceInput.audioLevel}
              interimTranscript={voiceInput.interimTranscript}
              voiceError={voiceInput.error}
              selectedLanguage={voiceLanguage}
              onLanguageChange={setVoiceLanguage}
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
                      {/* File previews - shown above message text like ChatGPT */}
                      {message.files && message.files.length > 0 && (
                        <div className={`flex flex-wrap gap-2 ${message.content ? 'mb-3 pb-2' : ''}`}>
                          {message.files.map((file) => {
                            const isImage = file.fileType === 'image';
                            
                            if (isImage && file.url) {
                              // Image preview - small thumbnail like ChatGPT
                              return (
                                <div 
                                  key={file.id}
                                  className="relative group cursor-pointer rounded-lg overflow-hidden border border-neutral-700 hover:border-neutral-500 transition-colors"
                                  onClick={() => file.url && window.open(file.url, '_blank')}
                                >
                                  <img
                                    src={file.url}
                                    alt={file.originalFilename}
                                    className="w-40 h-40 object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                </div>
                              );
                            }
                            
                            // Document/audio/video/other file - compact chip style
                            const fileIcon = file.fileType === 'document' ? '📄' 
                              : file.fileType === 'audio' ? '🎵'
                              : file.fileType === 'video' ? '🎥'
                              : '📎';
                            
                            const formatSize = (bytes: number) => {
                              if (bytes < 1024) return `${bytes} B`;
                              if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                              return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                            };

                            const getExtension = (filename: string) => {
                              const ext = filename.split('.').pop()?.toUpperCase();
                              return ext || '';
                            };
                            
                            return (
                              <div 
                                key={file.id}
                                className="flex items-center gap-3 rounded-xl bg-neutral-800 border border-neutral-700 px-4 py-3 min-w-[200px] max-w-[300px] hover:bg-neutral-750 hover:border-neutral-600 transition-colors cursor-default"
                              >
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-neutral-700 flex items-center justify-center">
                                  <span className="text-lg">{fileIcon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-neutral-200 truncate">
                                    {file.originalFilename}
                                  </p>
                                  <p className="text-xs text-neutral-500">
                                    {getExtension(file.originalFilename)} · {formatSize(file.size)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
                  ) : (
                    /* Assistant message - always show timeline at top if this message owns it */
                    <div className="max-w-3xl w-full">
                      {/* Timeline - persists at top of assistant response (current streaming or stored) */}
                      {(timelineMessageId === message.id && timelineEvents.length > 0) ? (
                        <div className="mb-4">
                          <TimelineContainer
                            events={timelineEvents}
                            isVisible={showTimeline}
                            onToggleVisibility={() => setShowTimeline(!showTimeline)}
                          />
                        </div>
                      ) : (messageTimelines[message.id] && messageTimelines[message.id].length > 0) && (
                        <div className="mb-4">
                          <TimelineContainer
                            events={messageTimelines[message.id]}
                            isVisible={showTimeline}
                            onToggleVisibility={() => setShowTimeline(!showTimeline)}
                          />
                        </div>
                      )}
                      
                      {/* Message content based on type */}
                      {message.isError ? (
                        <div className="rounded-2xl px-6 py-2 bg-red-500/10 border border-red-500/30 text-red-400">
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        </div>
                      ) : (message as any).isPendingConfirmation ? (
                    // Confirmation request message - Glassmorphic design with real logos
                    (() => {
                      const confirmData = (message as any).confirmationData;
                      const appLogo = getAppLogo(confirmData?.agentName, confirmData?.actionType);
                      return (
                        <>
                          {/* Preview Card */}
                          <div className="rounded-2xl bg-[#1a1a1a]/90 border border-white/[0.06] overflow-hidden">
                            {/* Header with logo and title */}
                            <div className="px-5 py-4 flex items-center justify-between border-b border-white/[0.06]">
                              <div className="flex items-center gap-3">
                                {/* App Logo */}
                                <Image 
                                  src={appLogo.src} 
                                  alt={appLogo.alt} 
                                  width={32} 
                                  height={32} 
                                  className="object-contain"
                                />
                                <span className="text-sm font-medium text-white/90">
                                  {confirmData?.description || 'Action Preview'}
                                </span>
                              </div>
                              <span className={`text-xs font-medium px-3 py-1.5 rounded-lg backdrop-blur-sm ${
                                confirmData?.agentName === 'gmail' 
                                  ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' 
                                  : confirmData?.agentName === 'microsoft'
                                  ? 'text-blue-400 bg-blue-400/10 border border-blue-400/20'
                                  : confirmData?.agentName === 'calendar'
                                  ? 'text-blue-400 bg-blue-400/10 border border-blue-400/20'
                                  : 'text-white/60 bg-white/5 border border-white/10'
                              }`}>
                                {formatAgentName(confirmData?.agentName || 'agent')}
                              </span>
                            </div>
                            
                            {/* Preview Content */}
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
                                  <PreviewContentRenderer content={message.content} actionType={confirmData?.actionType} agentName={confirmData?.agentName} />
                                ) : (
                                  <span className="text-white/40">No preview content available</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Confirmation Bar */}
                          <div className="mt-3 rounded-xl bg-[#141414]/90 border border-white/[0.06] px-5 py-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white/90">Confirmation Required</p>
                                <p className="text-xs text-white/40">Click confirm to proceed with this action</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleCancelAction}
                                disabled={isConfirming}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#252525] hover:bg-[#303030] border border-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed text-white/70 text-sm font-medium transition-all duration-200"
                              >
                                <X className="w-3.5 h-3.5" />
                                Skip
                              </button>
                              <button
                                onClick={handleConfirmAction}
                                disabled={isConfirming}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all duration-200"
                              >
                                <Check className="w-3.5 h-3.5" />
                                {isConfirming ? 'Processing...' : 'Confirm'}
                              </button>
                            </div>
                          </div>
                        </>
                      );
                    })()
                  ) : (message as any).isCanceled ? (
                    // Canceled action message - Minimal style
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
                  ) : (message as any).isConfirmed ? (
                    // Confirmed action message - Collapsible dropdown style
                    <CollapsibleConfirmedAction 
                      content={message.content}
                      actionType={(message as any).confirmationData?.actionType}
                      agentName={(message as any).confirmationData?.agentName}
                      description={(message as any).confirmationData?.description}
                    />
                  ) : (
                    <>
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
                        <MarkdownContent content={message.content} />
                      </div>
                      
                      {/* File Generation Panel for exporting content */}
                      {messageFileGenerationMap[message.id] && (
                        <FileGenerationPanel 
                          content={message.content}
                          isMarkdown={true}
                          title={`export-${message.id?.substring(0, 8) || 'message'}`}
                          userId={localStorage.getItem('userId') || undefined}
                          requestedFileType={messageFileGenerationMap[message.id] || null}
                          onSuccess={(url, filename) => {
                            console.log(`File ready for download: ${filename}`);
                            // Clear this message's file generation after success
                            setMessageFileGenerationMap(prev => {
                              const updated = { ...prev };
                              delete updated[message.id];
                              return updated;
                            });
                          }}
                          onError={(error) => {
                            console.error('File generation error:', error);
                            // Clear this message's file generation on error
                            setMessageFileGenerationMap(prev => {
                              const updated = { ...prev };
                              delete updated[message.id];
                              return updated;
                            });
                          }}
                        />
                      )}

                      {/* Display generated file information */}
                      {message.fileGeneration && (
                        <div className="flex flex-col gap-3 mt-4 p-4 bg-gradient-to-r from-green-900/20 to-green-800/20 rounded-lg border border-green-700/50">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              <span className="text-sm font-medium text-green-200">
                                {message.fileGeneration.filename}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                // Create a temporary link and click it to trigger download
                                const link = document.createElement('a');
                                link.href = message.fileGeneration?.fileUrl || '';
                                link.download = message.fileGeneration?.filename || 'download';
                                link.style.display = 'none';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
                            >
                              Download {message.fileGeneration?.type?.toUpperCase?.() || ''}
                            </button>
                          </div>
                          {message.fileGeneration?.fileSize && (
                            <div className="text-xs text-green-300">
                              Size: {(message.fileGeneration.fileSize / 1024).toFixed(2)} KB • Expires in {message.fileGeneration?.expiresIn ?? 0} seconds
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Display persisted files from database */}
                      {message.files && message.files.length > 0 && (
                        <div className="flex flex-col gap-2 mt-4">
                          {message.files.map((file, idx) => (
                            <div key={idx} className="flex flex-col gap-3 p-4 bg-gradient-to-r from-blue-900/20 to-blue-800/20 rounded-lg border border-blue-700/50">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  <span className="text-sm font-medium text-blue-200">
                                    {file.filename}
                                  </span>
                                </div>
                                {file.url && (
                                  <button
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = file.url!;
                                      link.download = file.filename || 'download';
                                      link.style.display = 'none';
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                                  >
                                    Download
                                  </button>
                                )}
                              </div>
                              {file.size && (
                                <div className="text-xs text-blue-300">
                                  Size: {(file.size / 1024).toFixed(2)} KB
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
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
                          {/* Read Aloud (TTS) button */}
                          {tts.isSupported && message.content && (
                            <button
                              onClick={() => tts.toggle(message.content)}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200 ${
                                tts.isSpeaking
                                  ? 'bg-violet-500/10 text-violet-400'
                                  : 'bg-neutral-800 hover:bg-neutral-700 text-gray-400 hover:text-gray-300'
                              }`}
                              title={tts.isSpeaking ? 'Stop reading' : 'Read aloud'}
                            >
                              {tts.isSpeaking ? (
                                <VolumeX className="w-3.5 h-3.5" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                              <span>{tts.isSpeaking ? 'Stop' : 'Read'}</span>
                            </button>
                          )}
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
                        </div>
                      </div>
                    </>
                  )}
                    </div>
                  )}
                </div>
              ))}

              {isThinking && (
                <div className="flex flex-col gap-4 max-w-3xl mb-4">
                  {/* Show timeline during thinking ONLY if no streaming message owns it yet */}
                  {/* This prevents duplicate timeline when the assistant message already renders it */}
                  {timelineEvents.length > 0 && !streamingMessageId && (
                    <TimelineContainer
                      events={timelineEvents}
                      isVisible={showTimeline}
                      onToggleVisibility={() => setShowTimeline(!showTimeline)}
                    />
                  )}
                  <ThinkingIndicator message={thinkingMessage} />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
      
          <div className="bg-black p-6">
            <div className="max-w-3xl mx-auto">
              <FileAttachment
                ref={fileAttachmentRef}
                onFileAttached={handleFileAttached}
                onFileRemoved={handleFileRemoved}
                attachedFiles={attachedFiles}
                disabled={isLoading}
              />
              <VercelV0Chat
                value={input}
                onChange={setInput}
                onSubmit={handleSendMessage}
                placeholder="Ask me anything... (e.g., 'schedule a meeting and create a document')"
                disabled={isLoading}
                showExamples={false}
                onAttachFile={handleAttachFile}
                attachedFiles={attachedFiles}
                isListening={voiceInput.isListening}
                isVoiceSupported={voiceInput.isSupported}
                onToggleVoice={voiceInput.toggleListening}
                audioLevel={voiceInput.audioLevel}
                interimTranscript={voiceInput.interimTranscript}
                voiceError={voiceInput.error}
                selectedLanguage={voiceLanguage}
                onLanguageChange={setVoiceLanguage}
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

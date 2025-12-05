'use client';

import React from 'react';
import { Plane, Clock, Check, ChevronDown, ChevronUp } from 'lucide-react';

// Types for flight data
interface FlightLeg {
  airline?: string;
  flight_number?: string;
  departure_airport?: {
    name?: string;
    id?: string;
    time?: string;
  };
  arrival_airport?: {
    name?: string;
    id?: string;
    time?: string;
  };
  duration?: number;
  airplane?: string;
  travel_class?: string;
  legroom?: string;
  extensions?: string[];
}

interface Layover {
  name?: string;
  id?: string;
  duration?: number;
}

interface Flight {
  flights?: FlightLeg[];
  layovers?: Layover[];
  total_duration?: number;
  price?: number;
  type?: string;
  airline_logo?: string;
  departure_token?: string;
}

interface FlightSearchParams {
  from?: string;
  to?: string;
  date?: string;
  returnDate?: string;
  currency?: string;
  travelers?: number;
}

interface FlightResultsCardProps {
  searchParams?: FlightSearchParams;
  bestFlights?: Flight[];
  otherFlights?: Flight[];
  toolName?: string;
  onSelectFlight?: (flight: Flight) => void;
}

// Airline logo mapping for common Indian airlines
const AIRLINE_LOGOS: Record<string, string> = {
  'IndiGo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/IndiGo_Airlines_logo.svg/200px-IndiGo_Airlines_logo.svg.png',
  'Air India': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Air_India_Logo.svg/200px-Air_India_Logo.svg.png',
  'SpiceJet': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/SpiceJet_logo.svg/200px-SpiceJet_logo.svg.png',
  'Vistara': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Vistara_Logo.svg/200px-Vistara_Logo.svg.png',
  'Akasa Air': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Akasa_Air_logo.svg/200px-Akasa_Air_logo.svg.png',
  'Go First': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Go_First_logo.svg/200px-Go_First_logo.svg.png',
};

// Helper function to format duration
const formatDuration = (minutes?: number): string => {
  if (!minutes) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} hr ${mins} min`;
};

// Helper function to get airline color
const getAirlineColor = (airline?: string): string => {
  const colors: Record<string, string> = {
    'IndiGo': 'from-indigo-600 to-indigo-800',
    'Air India': 'from-red-600 to-red-800',
    'SpiceJet': 'from-yellow-500 to-orange-600',
    'Vistara': 'from-purple-600 to-purple-800',
    'Akasa Air': 'from-orange-500 to-orange-700',
    'Go First': 'from-green-500 to-green-700',
  };
  return colors[airline || ''] || 'from-blue-600 to-blue-800';
};

// Single flight row component
function FlightRow({ 
  flight, 
  isConnecting = false 
}: { 
  flight: Flight; 
  isConnecting?: boolean;
}) {
  const firstLeg = flight.flights?.[0];
  const lastLeg = flight.flights?.[flight.flights.length - 1];
  const airline = firstLeg?.airline || 'Unknown';
  const flightNumber = firstLeg?.flight_number || '';
  const departureTime = firstLeg?.departure_airport?.time || '';
  const arrivalTime = lastLeg?.arrival_airport?.time || '';
  const duration = flight.total_duration;
  const airplane = firstLeg?.airplane || 'Aircraft';
  const stops = (flight.flights?.length || 1) - 1;
  const price = flight.price;
  const route = `${firstLeg?.departure_airport?.id || '?'} - ${lastLeg?.arrival_airport?.id || '?'}`;

  // Get all airlines for connecting flights
  const allAirlines = flight.flights?.map(f => f.airline).filter((v, i, a) => a.indexOf(v) === i).join(' + ') || airline;
  
  // Get airline logo URL
  const logoUrl = AIRLINE_LOGOS[airline];

  return (
    <div className="flex items-center justify-between py-4 px-4 hover:bg-white/[0.02] transition-colors border-b border-white/[0.06] last:border-b-0">
      {/* Airline Logo and Info */}
      <div className="flex items-center gap-4 min-w-[180px]">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getAirlineColor(airline)} flex items-center justify-center shadow-lg overflow-hidden`}>
          {logoUrl ? (
            <img src={logoUrl} alt={airline} className="w-8 h-8 object-contain" onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }} />
          ) : null}
          <Plane className={`w-5 h-5 text-white ${logoUrl ? 'hidden' : ''}`} />
        </div>
        <div>
          <div className="text-white font-medium text-sm">{airline} {flightNumber}</div>
          <div className="text-gray-500 text-xs">{allAirlines !== airline ? allAirlines : ''}</div>
        </div>
      </div>

      {/* Times */}
      <div className="flex items-center gap-2 min-w-[140px]">
        <span className="text-white font-semibold">{departureTime || '--:--'}</span>
        <span className="text-gray-500">→</span>
        <span className="text-white font-semibold">{arrivalTime || '--:--'}</span>
      </div>

      {/* Duration */}
      <div className="min-w-[100px]">
        <div className="text-gray-400 text-sm">{formatDuration(duration)}</div>
        <div className="text-gray-600 text-xs">{route}</div>
      </div>

      {/* Aircraft */}
      <div className="min-w-[100px]">
        <div className="text-gray-400 text-sm">{airplane}</div>
        <div className="text-gray-600 text-xs">Aircraft</div>
      </div>

      {/* Price */}
      <div className="text-right min-w-[90px]">
        <div className="text-white font-bold text-lg">₹{price?.toLocaleString('en-IN') || 'N/A'}</div>
      </div>

      {/* Stops Badge */}
      <div className="min-w-[70px] text-right">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          stops === 0 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {stops === 0 ? 'Direct' : `${stops} stop${stops > 1 ? 's' : ''}`}
        </span>
      </div>
    </div>
  );
}

// Section header component
function SectionHeader({ 
  title, 
  count, 
  isExpanded, 
  onToggle 
}: { 
  title: string; 
  count: number; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  return (
    <button 
      onClick={onToggle}
      className="w-full flex items-center justify-between py-3 px-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm font-medium">{title}</span>
        <span className="text-gray-600 text-xs">({count})</span>
      </div>
      {isExpanded ? (
        <ChevronUp className="w-4 h-4 text-gray-500" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-500" />
      )}
    </button>
  );
}

export function FlightResultsCard({
  searchParams,
  bestFlights = [],
  otherFlights = [],
  toolName = 'getFlightsList',
  onSelectFlight
}: FlightResultsCardProps) {
  const [showDirectFlights, setShowDirectFlights] = React.useState(true);
  const [showConnectingFlights, setShowConnectingFlights] = React.useState(true);

  // Separate direct and connecting flights
  const directFlights = [...bestFlights, ...otherFlights].filter(
    f => (f.flights?.length || 1) === 1
  );
  const connectingFlights = [...bestFlights, ...otherFlights].filter(
    f => (f.flights?.length || 1) > 1
  );

  const totalFlights = bestFlights.length + otherFlights.length;
  const lowestPrice = Math.min(
    ...([...bestFlights, ...otherFlights].map(f => f.price || Infinity))
  );

  if (totalFlights === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto my-4">
        <div className="bg-[#0a0a0a] rounded-2xl border border-white/[0.08] p-6">
          <div className="text-center text-gray-400">
            No flights found for this route and date.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto my-4">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white font-medium">
                {searchParams?.from || '?'} → {searchParams?.to || '?'}
              </div>
              <div className="text-gray-500 text-xs">
                {searchParams?.date || 'Date not specified'}
                {searchParams?.returnDate && ` - ${searchParams.returnDate}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-gray-500 text-xs">From</div>
              <div className="text-white font-semibold">₹{lowestPrice?.toLocaleString('en-IN')}</div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="text-green-400 text-sm font-medium">{toolName}</span>
              <Check className="w-4 h-4 text-green-400" />
            </div>
          </div>
        </div>

        {/* Direct Flights Section */}
        {directFlights.length > 0 && (
          <div>
            <SectionHeader 
              title="Direct Flights (Non-stop)" 
              count={directFlights.length}
              isExpanded={showDirectFlights}
              onToggle={() => setShowDirectFlights(!showDirectFlights)}
            />
            {showDirectFlights && (
              <div>
                {directFlights.map((flight, index) => (
                  <FlightRow 
                    key={`direct-${index}`} 
                    flight={flight} 
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Connecting Flights Section */}
        {connectingFlights.length > 0 && (
          <div>
            <SectionHeader 
              title="Connecting Flights" 
              count={connectingFlights.length}
              isExpanded={showConnectingFlights}
              onToggle={() => setShowConnectingFlights(!showConnectingFlights)}
            />
            {showConnectingFlights && (
              <div>
                {connectingFlights.map((flight, index) => (
                  <FlightRow 
                    key={`connecting-${index}`} 
                    flight={flight}
                    isConnecting={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer with tips */}
        <div className="px-5 py-3 bg-white/[0.02] border-t border-white/[0.08]">
          <div className="text-gray-500 text-xs">
            💡 <span className="text-gray-400">Tips:</span>
            <span className="ml-2">• All flights listed are direct, providing a convenient travel experience.</span>
            <span className="ml-2">• Prices can fluctuate, so it's advisable to book soon to secure these rates.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export a simpler version for inline rendering in chat
export interface FlightData {
  from?: string;
  to?: string;
  date?: string;
  best_flights?: Flight[];
  other_flights?: Flight[];
  search_metadata?: {
    search_params?: FlightSearchParams;
  };
  search_params?: FlightSearchParams;
}

export function FlightResultsInline({
  data,
  toolName
}: {
  data: FlightData;
  toolName?: string;
}) {
  const searchParams: FlightSearchParams = data.search_metadata?.search_params || data.search_params || {
    from: data.from,
    to: data.to,
    date: data.date
  };
  
  return (
    <FlightResultsCard
      searchParams={searchParams}
      bestFlights={data.best_flights || []}
      otherFlights={data.other_flights || []}
      toolName={toolName}
    />
  );
}

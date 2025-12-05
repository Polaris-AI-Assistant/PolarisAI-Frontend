// Google Maps integration service

import { authenticatedFetch } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface MapsQueryResponse {
  success: boolean;
  response: string;
  query: string;
  toolsUsed?: string[];
  results?: any[];
  executionTime?: number;
  timestamp: string;
  error?: string;
}

export interface MapsExample {
  category: string;
  queries: string[];
}

export interface MapsCapability {
  name: string;
  description: string;
  tool: string;
  examples: string[];
  parameters: string[];
}

export interface PlaceType {
  type: string;
  description: string;
}

/**
 * Process a natural language query to the Maps agent
 */
export const processMapsQuery = async (
  query: string,
  conversationHistory?: any[]
): Promise<MapsQueryResponse> => {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/maps/agent/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        conversationHistory: conversationHistory || []
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to process Maps query');
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing Maps query:', error);
    throw error;
  }
};

/**
 * Get example queries that the Maps agent can handle
 */
export const getMapsExamples = async (): Promise<{ examples: MapsExample[]; notes: string[] }> => {
  try {
    const response = await fetch(`${API_URL}/api/maps/agent/examples`);
    
    if (!response.ok) {
      throw new Error('Failed to get Maps examples');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Maps examples:', error);
    throw error;
  }
};

/**
 * Get detailed information about Maps agent capabilities
 */
export const getMapsCapabilities = async (): Promise<{
  agent: string;
  version: string;
  capabilities: MapsCapability[];
  supported_place_types: string[];
  travel_modes: string[];
}> => {
  try {
    const response = await fetch(`${API_URL}/api/maps/agent/capabilities`);
    
    if (!response.ok) {
      throw new Error('Failed to get Maps capabilities');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Maps capabilities:', error);
    throw error;
  }
};

/**
 * Get list of supported place types
 */
export const getMapsPlaceTypes = async (): Promise<{
  place_types: PlaceType[];
  notes: string[];
}> => {
  try {
    const response = await fetch(`${API_URL}/api/maps/agent/place-types`);
    
    if (!response.ok) {
      throw new Error('Failed to get place types');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting place types:', error);
    throw error;
  }
};

/**
 * Check if the Maps agent is operational
 */
export const checkMapsStatus = async (): Promise<{
  status: string;
  agent: string;
  api_key_configured: boolean;
  message: string;
  timestamp: string;
}> => {
  try {
    const response = await fetch(`${API_URL}/api/maps/agent/status`);
    
    if (!response.ok) {
      throw new Error('Failed to check Maps status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking Maps status:', error);
    throw error;
  }
};

/**
 * Helper function to format place search results
 */
export const formatPlaceResults = (results: any[]): string => {
  if (!results || results.length === 0) {
    return 'No places found.';
  }

  return results.slice(0, 5).map((place, idx) => {
    const parts = [
      `${idx + 1}. **${place.name}**`,
      `   ${place.address || place.vicinity || 'Address not available'}`
    ];

    if (place.rating) {
      parts.push(`   ⭐ ${place.rating}/5 (${place.user_ratings_total || 0} reviews)`);
    }

    if (place.opening_hours?.open_now !== undefined) {
      parts.push(`   ${place.opening_hours.open_now ? '🟢 Open now' : '🔴 Closed'}`);
    }

    return parts.join('\n');
  }).join('\n\n');
};

/**
 * Helper function to format distance result
 */
export const formatDistanceResult = (result: any): string => {
  if (!result) return 'Distance information not available.';

  return `
**Distance**: ${result.distance.text}
**Travel Time**: ${result.duration.text}
**Mode**: ${result.mode}

From: ${result.origin}
To: ${result.destination}
  `.trim();
};

/**
 * Helper function to format place details
 */
export const formatPlaceDetails = (place: any): string => {
  if (!place) return 'Place details not available.';

  const parts = [`**${place.name}**\n`];

  if (place.address) parts.push(`📍 ${place.address}`);
  if (place.phone) parts.push(`📞 ${place.phone}`);
  if (place.website) parts.push(`🌐 ${place.website}`);
  if (place.rating) {
    parts.push(`⭐ ${place.rating}/5 (${place.user_ratings_total || 0} reviews)`);
  }
  if (place.opening_hours) {
    parts.push(`🕒 ${place.opening_hours.open_now ? 'Open now' : 'Closed'}`);
  }
  if (place.price_level) {
    parts.push(`💰 ${'$'.repeat(place.price_level)}`);
  }

  return parts.join('\n');
};

/**
 * Helper to extract coordinates from various formats
 */
export const parseCoordinates = (input: string): { lat: number; lng: number } | null => {
  // Try "lat,lng" format
  const coordMatch = input.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (coordMatch) {
    return {
      lat: parseFloat(coordMatch[1]),
      lng: parseFloat(coordMatch[2])
    };
  }

  return null;
};

/**
 * Get icon for Maps agent
 */
export const getMapsIcon = (): string => {
  return '🗺️';
};

/**
 * Get display name for Maps agent
 */
export const getMapsDisplayName = (): string => {
  return 'Google Maps';
};

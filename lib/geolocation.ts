/**
 * Geolocation utility for requesting user's current location
 * Used by Maps agent to provide location-aware search results
 */

export interface UserLocation {
  lat: number;
  lng: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

/**
 * Request user's current location via browser geolocation API
 * @returns Promise resolving to coordinates or null if denied/failed
 */
export async function getUserLocation(): Promise<UserLocation | null> {
  // Check if geolocation is supported
  if (!navigator.geolocation) {
    console.warn('[Geolocation] Browser does not support geolocation');
    return null;
  }

  return new Promise((resolve) => {
    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 300000 // 5 minutes - cache location for 5 min
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log('[Geolocation] Location obtained:', location);
        resolve(location);
      },
      (error) => {
        console.warn('[Geolocation] Error obtaining location:', {
          code: error.code,
          message: error.message
        });
        resolve(null);
      },
      options
    );
  });
}

/**
 * Check if a query requires user location
 * @param query User's search query
 * @returns true if location is needed
 */
export function requiresLocation(query: string): boolean {
  const locationKeywords = [
    'near me',
    'nearby',
    'closest',
    'around me',
    'in my area',
    'close to me',
    'nearest',
    'around here',
    'in the vicinity',
    'within',
  ];

  const lowerQuery = query.toLowerCase();
  return locationKeywords.some(keyword => lowerQuery.includes(keyword));
}

/**
 * Format location for display
 * @param location User location coordinates
 * @returns Formatted string
 */
export function formatLocation(location: UserLocation): string {
  return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
}

/**
 * Get human-readable error message for geolocation errors
 * @param error GeolocationPositionError
 * @returns User-friendly error message
 */
export function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location access denied. Please type your city or area instead.';
    case error.POSITION_UNAVAILABLE:
      return 'Location information unavailable. Please type your city or area.';
    case error.TIMEOUT:
      return 'Location request timed out. Please type your city or area.';
    default:
      return 'Unable to get location. Please type your city or area.';
  }
}

/**
 * Request location with user-friendly error handling
 * @returns Location or error message
 */
export async function requestLocationWithFallback(): Promise<{
  location?: UserLocation;
  error?: string;
}> {
  try {
    const location = await getUserLocation();
    
    if (location) {
      return { location };
    }
    
    return {
      error: 'Location access denied. Please specify your city or area instead.'
    };
  } catch (error) {
    return {
      error: 'Unable to access location. Please specify your city or area instead.'
    };
  }
}

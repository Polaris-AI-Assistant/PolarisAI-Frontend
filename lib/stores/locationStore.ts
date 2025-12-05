/**
 * User Location Store (Zustand)
 * 
 * Ephemeral frontend-only store for user's geolocation
 * NOT persisted to database or localStorage
 * Used only for Maps agent queries requiring "near me" context
 */

import { create } from 'zustand';

export interface UserLocation {
  lat: number;
  lng: number;
}

interface LocationState {
  // Current user coordinates (null if not set)
  coords: UserLocation | null;
  
  // Whether location was requested and denied
  denied: boolean;
  
  // Timestamp of last location update
  lastUpdated: number | null;
  
  // Actions
  setCoords: (lat: number, lng: number) => void;
  clearCoords: () => void;
  setDenied: (denied: boolean) => void;
  isStale: () => boolean;
}

/**
 * Location cache duration: 5 minutes
 * After this time, location should be re-requested
 */
const LOCATION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useLocationStore = create<LocationState>((set, get) => ({
  coords: null,
  denied: false,
  lastUpdated: null,

  /**
   * Set user coordinates
   */
  setCoords: (lat: number, lng: number) => {
    set({
      coords: { lat, lng },
      denied: false,
      lastUpdated: Date.now()
    });
    console.log('[LocationStore] Coordinates set:', { lat, lng });
  },

  /**
   * Clear user coordinates
   */
  clearCoords: () => {
    set({
      coords: null,
      lastUpdated: null
    });
    console.log('[LocationStore] Coordinates cleared');
  },

  /**
   * Mark location as denied by user
   */
  setDenied: (denied: boolean) => {
    set({ denied });
    console.log('[LocationStore] Denied status:', denied);
  },

  /**
   * Check if cached location is stale
   * @returns true if location needs refresh
   */
  isStale: () => {
    const { lastUpdated } = get();
    if (!lastUpdated) return true;
    
    const age = Date.now() - lastUpdated;
    return age > LOCATION_CACHE_DURATION;
  }
}));

/**
 * Get current location from store or request new one
 * @param forceRefresh Force new location request even if cached
 * @returns Current location or null
 */
export async function getCurrentLocation(
  forceRefresh: boolean = false
): Promise<UserLocation | null> {
  const store = useLocationStore.getState();
  
  // Return cached location if fresh and not forcing refresh
  if (!forceRefresh && store.coords && !store.isStale()) {
    console.log('[LocationStore] Using cached location:', store.coords);
    return store.coords;
  }
  
  // Location is stale or forced refresh, need to request again
  return null;
}

/**
 * Cached Connection Status Service
 * 
 * Provides cached connection status checks for all integrations.
 * Uses stale-while-revalidate pattern for optimal performance.
 */

import { useCacheStore, ConnectionStatuses } from './stores/cacheStore';
import { checkGmailStatus } from './gmail';
import { checkGitHubStatus } from './github';
import { checkFormsStatus } from './forms';
import { checkSheetsStatus } from './sheets';
import { checkDocsStatus } from './docs';
import { checkCalendarStatus } from './calendar';
import { checkMeetStatus } from './meet';
import { checkMicrosoftStatus } from './microsoft';

// Re-export types for convenience
export type {
  GmailConnectionStatus,
  GitHubConnectionStatus,
  FormsConnectionStatus,
  SheetsConnectionStatus,
  DocsConnectionStatus,
  CalendarConnectionStatus,
  MeetConnectionStatus,
  MicrosoftConnectionStatus,
  ConnectionStatuses,
} from './stores/cacheStore';

/**
 * Get all connection statuses with caching
 * Returns cached data immediately and refreshes in background if stale
 */
export const getAllConnectionStatusesCached = async (forceRefresh: boolean = false): Promise<Partial<ConnectionStatuses>> => {
  const cacheStore = useCacheStore.getState();
  
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = cacheStore.getAllConnectionStatuses();
    const isStale = cacheStore.isConnectionStatusStale();
    
    if (cached) {
      // If stale, trigger background refresh
      if (isStale && !cacheStore.isLoadingConnections) {
        refreshConnectionStatusesInBackground();
      }
      return cached;
    }
  }
  
  // Fetch fresh data
  return await fetchAllConnectionStatuses();
};

/**
 * Get a specific connection status with caching
 */
export const getConnectionStatusCached = async <K extends keyof ConnectionStatuses>(
  service: K,
  forceRefresh: boolean = false
): Promise<ConnectionStatuses[K] | null> => {
  const cacheStore = useCacheStore.getState();
  
  // Check cache first
  if (!forceRefresh) {
    const cached = cacheStore.getConnectionStatus(service);
    const isStale = cacheStore.isConnectionStatusStale();
    
    if (cached) {
      // If stale, trigger background refresh for this service
      if (isStale && !cacheStore.isLoadingConnections) {
        refreshSingleConnectionInBackground(service);
      }
      return cached;
    }
  }
  
  // Fetch fresh data for this service
  const status = await fetchSingleConnectionStatus(service);
  if (status) {
    cacheStore.setConnectionStatus(service, status);
  }
  return status;
};

/**
 * Fetch all connection statuses from APIs
 */
const fetchAllConnectionStatuses = async (): Promise<Partial<ConnectionStatuses>> => {
  const cacheStore = useCacheStore.getState();
  cacheStore.setLoadingConnections(true);
  
  try {
    // Fetch all statuses in parallel for speed
    const [
      gmail,
      github,
      forms,
      sheets,
      docs,
      calendar,
      meet,
      microsoft,
    ] = await Promise.allSettled([
      checkGmailStatus(),
      checkGitHubStatus(),
      checkFormsStatus(),
      checkSheetsStatus(),
      checkDocsStatus(),
      checkCalendarStatus(),
      checkMeetStatus(),
      checkMicrosoftStatus(),
    ]);
    
    const statuses: Partial<ConnectionStatuses> = {
      gmail: gmail.status === 'fulfilled' ? gmail.value : { connected: false },
      github: github.status === 'fulfilled' ? github.value : { connected: false },
      forms: forms.status === 'fulfilled' ? forms.value : { connected: false },
      sheets: sheets.status === 'fulfilled' ? sheets.value : { connected: false },
      docs: docs.status === 'fulfilled' ? docs.value : { connected: false, email: null },
      calendar: calendar.status === 'fulfilled' ? calendar.value : { connected: false },
      meet: meet.status === 'fulfilled' ? meet.value : { connected: false },
      microsoft: microsoft.status === 'fulfilled' ? microsoft.value : { 
        connected: false,
        apps: { outlook: false, calendar: false, onedrive: false, excel: false, teams: false, word: false }
      },
    };
    
    // Cache all statuses
    cacheStore.setAllConnectionStatuses(statuses);
    
    return statuses;
  } catch (error) {
    console.error('Error fetching connection statuses:', error);
    cacheStore.setLoadingConnections(false);
    return {};
  }
};

/**
 * Fetch a single connection status
 */
const fetchSingleConnectionStatus = async <K extends keyof ConnectionStatuses>(
  service: K
): Promise<ConnectionStatuses[K] | null> => {
  try {
    switch (service) {
      case 'gmail':
        return await checkGmailStatus() as ConnectionStatuses[K];
      case 'github':
        return await checkGitHubStatus() as ConnectionStatuses[K];
      case 'forms':
        return await checkFormsStatus() as ConnectionStatuses[K];
      case 'sheets':
        return await checkSheetsStatus() as ConnectionStatuses[K];
      case 'docs':
        return await checkDocsStatus() as ConnectionStatuses[K];
      case 'calendar':
        return await checkCalendarStatus() as ConnectionStatuses[K];
      case 'meet':
        return await checkMeetStatus() as ConnectionStatuses[K];
      case 'microsoft':
        return await checkMicrosoftStatus() as ConnectionStatuses[K];
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error fetching ${service} status:`, error);
    return null;
  }
};

/**
 * Background refresh for all connection statuses
 */
const refreshConnectionStatusesInBackground = async () => {
  const cacheStore = useCacheStore.getState();
  
  if (cacheStore.isLoadingConnections) return;
  
  console.log('[Cache] Refreshing connection statuses in background...');
  await fetchAllConnectionStatuses();
};

/**
 * Background refresh for a single connection
 */
const refreshSingleConnectionInBackground = async <K extends keyof ConnectionStatuses>(
  service: K
) => {
  const cacheStore = useCacheStore.getState();
  
  console.log(`[Cache] Refreshing ${service} status in background...`);
  
  const status = await fetchSingleConnectionStatus(service);
  if (status) {
    cacheStore.setConnectionStatus(service, status);
  }
};

/**
 * Invalidate all connection status cache
 */
export const invalidateConnectionCache = () => {
  const cacheStore = useCacheStore.getState();
  cacheStore.invalidateConnectionStatuses();
};

/**
 * Update a single connection status in cache (optimistic update)
 */
export const updateConnectionStatusCache = <K extends keyof ConnectionStatuses>(
  service: K,
  status: ConnectionStatuses[K]
) => {
  const cacheStore = useCacheStore.getState();
  cacheStore.setConnectionStatus(service, status);
};

/**
 * Clear all caches (call on logout)
 */
export const clearAllCaches = () => {
  const cacheStore = useCacheStore.getState();
  cacheStore.clearAllCache();
};

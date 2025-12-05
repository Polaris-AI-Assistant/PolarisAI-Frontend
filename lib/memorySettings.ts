/**
 * Memory Settings Types and Hook
 * 
 * Type definitions and custom hook for managing user memory preferences
 */

import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface MemorySettings {
  enabled: boolean;
  categories: {
    forms: boolean;
    docs: boolean;
    sheets: boolean;
    calendar: boolean;
    gmail: boolean;
    flights: boolean;
    otherArtifacts: boolean;
  };
  autoDeleteDays: 1 | 7 | 30 | 90 | 0; // 0 = never delete
  weeklyDigestEnabled: boolean;
  weeklyDigestDay: 'sunday' | 'monday' | 'friday';
  weeklyDigestTime: string; // "08:00" 24h format
}

export const DEFAULT_MEMORY_SETTINGS: MemorySettings = {
  enabled: true,
  categories: {
    forms: true,
    docs: true,
    sheets: true,
    calendar: true,
    gmail: true,
    flights: true,
    otherArtifacts: true,
  },
  autoDeleteDays: 0,
  weeklyDigestEnabled: false,
  weeklyDigestDay: 'sunday',
  weeklyDigestTime: '08:00',
};

interface UseMemorySettingsReturn {
  settings: MemorySettings;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  updateSettings: (partialSettings: Partial<MemorySettings>) => void;
  saveSettings: () => Promise<void>;
  deleteAllMemories: () => Promise<void>;
  deleteLast30Days: () => Promise<void>;
}

/**
 * Get auth token helper
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { getAuthToken } = await import('./auth');
    return getAuthToken();
  } catch {
    return null;
  }
}

/**
 * Custom hook for managing memory settings
 */
export function useMemorySettings(): UseMemorySettingsReturn {
  const [settings, setSettings] = useState<MemorySettings>(DEFAULT_MEMORY_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/api/settings/memory`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No settings yet, use defaults
          setSettings(DEFAULT_MEMORY_SETTINGS);
          return;
        }
        throw new Error('Failed to fetch memory settings');
      }

      const data = await response.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Error fetching memory settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      // Use defaults on error
      setSettings(DEFAULT_MEMORY_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = (partialSettings: Partial<MemorySettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...partialSettings,
      // Handle nested categories update
      ...(partialSettings.categories && {
        categories: {
          ...prev.categories,
          ...partialSettings.categories,
        },
      }),
    }));
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/api/settings/memory`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error('Failed to save memory settings');
      }

      const data = await response.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Error saving memory settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAllMemories = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/api/settings/memory/all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete memories');
      }
    } catch (err) {
      console.error('Error deleting memories:', err);
      throw err;
    }
  };

  const deleteLast30Days = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/api/settings/memory/last-30-days`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete memories');
      }
    } catch (err) {
      console.error('Error deleting memories:', err);
      throw err;
    }
  };

  return {
    settings,
    isLoading,
    isSaving,
    error,
    updateSettings,
    saveSettings,
    deleteAllMemories,
    deleteLast30Days,
  };
}

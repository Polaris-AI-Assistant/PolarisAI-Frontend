/**
 * Settings Modal Store
 * 
 * Global state management for the settings modal using vanilla React hooks
 * (Zustand not currently installed, using React Context pattern instead)
 */

import { create } from 'zustand';

export type SettingsTab = 'general' | 'memory' | 'notifications' | 'account';

interface SettingsStore {
  isOpen: boolean;
  activeTab: SettingsTab;
  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;
  setActiveTab: (tab: SettingsTab) => void;
}

// Note: Since Zustand is not in package.json, we'll use React Context instead
// This file provides the interface, actual implementation in SettingsContext.tsx
export type { SettingsStore };

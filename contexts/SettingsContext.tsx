'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SettingsTab = 'general' | 'memory' | 'notifications' | 'account';

interface SettingsContextType {
  isOpen: boolean;
  activeTab: SettingsTab;
  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;
  setActiveTab: (tab: SettingsTab) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const openSettings = (tab: SettingsTab = 'general') => {
    setActiveTab(tab);
    setIsOpen(true);
  };

  const closeSettings = () => {
    setIsOpen(false);
  };

  return (
    <SettingsContext.Provider
      value={{
        isOpen,
        activeTab,
        openSettings,
        closeSettings,
        setActiveTab,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

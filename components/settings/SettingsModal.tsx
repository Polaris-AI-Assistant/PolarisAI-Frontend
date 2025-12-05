'use client';

import React, { useEffect } from 'react';
import { useSettings, SettingsTab as TabType } from '@/contexts/SettingsContext';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { X, Settings as SettingsIcon, Brain, Bell, User } from 'lucide-react';
import MemorySettingsTab from './MemorySettingsTab';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <SettingsIcon className="h-4 w-4" /> },
  { id: 'memory', label: 'Memory', icon: <Brain className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  { id: 'account', label: 'Account', icon: <User className="h-4 w-4" /> },
];

export default function SettingsModal() {
  const { isOpen, activeTab, closeSettings, setActiveTab } = useSettings();

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeSettings();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Trap focus
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeSettings]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeSettings()}>
      <DialogContent 
        className="max-w-4xl w-full h-[85vh] max-h-[800px] bg-[#1f1f1f] border border-zinc-800 p-0 gap-0 overflow-hidden rounded-2xl"
        onPointerDownOutside={closeSettings}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/50">
          <h1 className="text-xl font-semibold text-white">Settings</h1>
          <button
            onClick={closeSettings}
            className="rounded-lg p-2 hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close settings"
          >
            <X className="h-5 w-5 text-zinc-400 hover:text-white" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Tabs Sidebar */}
          <div className="w-64 border-r border-zinc-800/50 bg-[#171717] px-3 py-4 flex-shrink-0 overflow-y-auto">
            <nav className="space-y-0.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-all',
                    activeTab === tab.id
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-[#1f1f1f]">
            <div className="max-w-3xl mx-auto px-8 py-6">
              {activeTab === 'general' && <GeneralTab />}
              {activeTab === 'memory' && <MemorySettingsTab />}
              {activeTab === 'notifications' && <NotificationsTab />}
              {activeTab === 'account' && <AccountTab />}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Placeholder tabs
function GeneralTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">General</h2>
        <p className="text-[15px] text-zinc-400 mt-1">
          Manage your general preferences and settings.
        </p>
      </div>
      <div className="p-12 rounded-xl bg-zinc-900/30 border border-zinc-800/50 text-center">
        <p className="text-zinc-500 text-sm">General settings coming soon...</p>
      </div>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Notifications</h2>
        <p className="text-[15px] text-zinc-400 mt-1">
          Control how and when you receive notifications.
        </p>
      </div>
      <div className="p-12 rounded-xl bg-zinc-900/30 border border-zinc-800/50 text-center">
        <p className="text-zinc-500 text-sm">Notification settings coming soon...</p>
      </div>
    </div>
  );
}

function AccountTab() {
  const [user, setUser] = React.useState<{ email?: string } | null>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const { getCurrentUser } = await import('@/lib/auth');
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    try {
      const { signOut } = await import('@/lib/auth');
      await signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Account</h2>
        <p className="text-[15px] text-zinc-400 mt-1">
          Manage your account settings and preferences.
        </p>
      </div>
      
      {user?.email && (
        <div className="space-y-4 p-5 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
          <div>
            <h3 className="text-sm font-medium text-zinc-500">Email</h3>
            <p className="text-[15px] text-white mt-1.5">{user.email}</p>
          </div>
        </div>
      )}

      <div className="p-5 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-colors text-sm font-medium"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

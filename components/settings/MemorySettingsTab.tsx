'use client';

import React, { useEffect, useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useMemorySettings } from '@/lib/memorySettings';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, CheckCircle2, Trash2, Database } from 'lucide-react';
import MemoryDashboard from './MemoryDashboard';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export default function MemorySettingsTab() {
  const {
    settings,
    isLoading,
    isSaving,
    error,
    updateSettings,
    saveSettings,
    deleteAllMemories,
    deleteLast30Days,
  } = useMemorySettings();

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [userEmail, setUserEmail] = useState<string>('');
  const [activeView, setActiveView] = useState<'settings' | 'memories'>('memories');

  // Get user email for digest display
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const { getCurrentUser } = await import('@/lib/auth');
        const user = await getCurrentUser();
        if (user?.email) {
          setUserEmail(user.email);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    fetchUserEmail();
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        await saveSettings();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [settings, isLoading]);

  const handleDeleteConfirm = (type: 'all' | 'last30') => {
    if (type === 'all') {
      setConfirmDialog({
        isOpen: true,
        title: 'Delete All Memories',
        message: 'Are you sure you want to delete all your memories? This action cannot be undone.',
        onConfirm: async () => {
          try {
            await deleteAllMemories();
            setConfirmDialog({ ...confirmDialog, isOpen: false });
          } catch (err) {
            console.error('Failed to delete memories:', err);
          }
        },
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        title: 'Delete Last 30 Days',
        message: 'Are you sure you want to delete memories from the last 30 days? This action cannot be undone.',
        onConfirm: async () => {
          try {
            await deleteLast30Days();
            setConfirmDialog({ ...confirmDialog, isOpen: false });
          } catch (err) {
            console.error('Failed to delete memories:', err);
          }
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center gap-1 p-0.5 bg-zinc-900/50 rounded-lg border border-zinc-800/50 w-fit">
        <button
          onClick={() => setActiveView('memories')}
          className={cn(
            'px-4 py-2 rounded-md text-[14px] font-medium transition-all flex items-center gap-2',
            activeView === 'memories'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white'
          )}
        >
          <Database className="h-4 w-4" />
          Saved Memories
        </button>
        <button
          onClick={() => setActiveView('settings')}
          className={cn(
            'px-4 py-2 rounded-md text-[14px] font-medium transition-all',
            activeView === 'settings'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white'
          )}
        >
          Memory Settings
        </button>
      </div>

      {/* Conditional Rendering */}
      {activeView === 'memories' ? (
        <MemoryDashboard />
      ) : (
        <>
          {/* Header */}
          <div>
            <h2 className="text-lg font-semibold text-white">Memory Settings</h2>
            <p className="text-[15px] text-zinc-400 mt-1">
              Control how Polaris remembers your activity and artifacts.
            </p>
          </div>

      {/* Save Status Indicator */}
      {saveStatus !== 'idle' && (
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm',
            saveStatus === 'saving' && 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
            saveStatus === 'saved' && 'bg-green-500/10 text-green-400 border border-green-500/20',
            saveStatus === 'error' && 'bg-red-500/10 text-red-400 border border-red-500/20'
          )}
        >
          {saveStatus === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
          {saveStatus === 'saved' && <CheckCircle2 className="h-4 w-4" />}
          {saveStatus === 'error' && <AlertCircle className="h-4 w-4" />}
          <span>
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && 'Settings saved'}
            {saveStatus === 'error' && 'Failed to save settings'}
          </span>
        </div>
      )}

      {/* Global Memory Toggle */}
      <div className="space-y-3 p-5 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Label htmlFor="memory-enabled" className="text-[15px] font-medium text-white">
              Enable memory
            </Label>
            <p className="text-[14px] text-zinc-400 mt-1.5 leading-relaxed">
              When enabled, Polaris can remember your activity and artifacts (forms, docs, events, etc.) 
              to provide better suggestions. Turn this off to stop saving new memories.
            </p>
          </div>
          <Switch
            id="memory-enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSettings({ enabled: checked })}
            className="ml-4 flex-shrink-0"
          />
        </div>

        {!settings.enabled && (
          <div className="mt-3 p-3.5 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
            <p className="text-[13px] text-zinc-400 leading-relaxed">
              Existing memories will not be deleted automatically. You can delete them from the Memory dashboard 
              or use the Danger Zone below.
            </p>
          </div>
        )}
      </div>

      {/* Category Toggles */}
      <div className="space-y-4 p-5 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
        <div>
          <h3 className="text-[15px] font-semibold text-white">Memory Categories</h3>
          <p className="text-[14px] text-zinc-400 mt-1">
            Choose which types of activities Polaris should remember.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { key: 'forms', label: 'Forms', description: 'Remember forms you create or update' },
            { key: 'docs', label: 'Docs', description: 'Remember documents you work with' },
            { key: 'sheets', label: 'Sheets', description: 'Remember spreadsheets and data' },
            { key: 'calendar', label: 'Calendar', description: 'Remember events and scheduling' },
            { key: 'gmail', label: 'Gmail', description: 'Remember email interactions' },
            { key: 'flights', label: 'Flights', description: 'Remember flight bookings and searches' },
            { key: 'otherArtifacts', label: 'Other artifacts', description: 'Remember other created content' },
          ].map((category) => (
            <div
              key={category.key}
              className={cn(
                'flex items-start gap-3 p-3.5 rounded-lg border transition-colors',
                settings.enabled
                  ? 'bg-zinc-800/20 border-zinc-700/40 hover:bg-zinc-800/40'
                  : 'bg-zinc-800/10 border-zinc-800/20 opacity-50'
              )}
            >
              <Checkbox
                id={`category-${category.key}`}
                checked={settings.categories[category.key as keyof typeof settings.categories]}
                onCheckedChange={(checked) =>
                  updateSettings({
                    categories: {
                      ...settings.categories,
                      [category.key]: checked === true,
                    },
                  })
                }
                disabled={!settings.enabled}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={`category-${category.key}`}
                  className={cn(
                    'text-[14px] font-medium cursor-pointer',
                    settings.enabled ? 'text-white' : 'text-zinc-500'
                  )}
                >
                  {category.label}
                </Label>
                <p
                  className={cn(
                    'text-[13px] mt-0.5 leading-relaxed',
                    settings.enabled ? 'text-zinc-400' : 'text-zinc-600'
                  )}
                >
                  {category.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-delete Options */}
      <div className="space-y-4 p-5 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
        <div>
          <h3 className="text-[15px] font-semibold text-white">Auto-delete activity</h3>
          <p className="text-[14px] text-zinc-400 mt-1">
            Choose how long Polaris should keep your activity before deleting it automatically.
          </p>
        </div>

        <div className="space-y-2">
          {[
            { value: 1, label: '24 hours' },
            { value: 7, label: '7 days' },
            { value: 30, label: '30 days' },
            { value: 90, label: '90 days' },
            { value: 0, label: 'Never delete' },
          ].map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                settings.autoDeleteDays === option.value
                  ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20'
                  : 'bg-zinc-800/20 border-zinc-700/40 hover:bg-zinc-800/40'
              )}
            >
              <input
                type="radio"
                name="auto-delete"
                value={option.value}
                checked={settings.autoDeleteDays === option.value}
                onChange={() => updateSettings({ autoDeleteDays: option.value as 0 | 1 | 7 | 30 | 90 })}
                className="w-4 h-4 text-blue-500 focus:ring-blue-500 focus:ring-2 border-zinc-600"
              />
              <span className="text-[14px] text-white">{option.label}</span>
            </label>
          ))}
        </div>

        {settings.autoDeleteDays === 0 && (
          <div className="mt-3 p-3.5 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
            <p className="text-[13px] text-zinc-400 leading-relaxed">
              Memories are kept until you delete them manually from the Danger Zone below.
            </p>
          </div>
        )}
      </div>

      {/* Weekly Digest */}
      <div className="space-y-4 p-5 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold text-white">Weekly activity digest</h3>
            <p className="text-[14px] text-zinc-400 mt-1">
              Receive a weekly email summary of your Polaris activity.
            </p>
          </div>
          <Switch
            id="weekly-digest-enabled"
            checked={settings.weeklyDigestEnabled}
            onCheckedChange={(checked) => updateSettings({ weeklyDigestEnabled: checked })}
            className="flex-shrink-0"
          />
        </div>

        {settings.weeklyDigestEnabled && (
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="digest-day" className="text-[14px] font-medium text-white">
                Send on
              </Label>
              <select
                id="digest-day"
                value={settings.weeklyDigestDay}
                onChange={(e) =>
                  updateSettings({ weeklyDigestDay: e.target.value as 'sunday' | 'monday' | 'friday' })
                }
                className="mt-2 w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="sunday">Sunday</option>
                <option value="monday">Monday</option>
                <option value="friday">Friday</option>
              </select>
            </div>

            <div>
              <Label htmlFor="digest-time" className="text-[14px] font-medium text-white">
                Time (24-hour format)
              </Label>
              <input
                id="digest-time"
                type="time"
                value={settings.weeklyDigestTime}
                onChange={(e) => updateSettings({ weeklyDigestTime: e.target.value })}
                className="mt-2 w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {userEmail && (
              <div className="p-3.5 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
                <p className="text-[13px] text-zinc-400 leading-relaxed">
                  Digest will be sent to: <span className="text-white font-medium">{userEmail}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="space-y-4 p-5 rounded-xl bg-red-950/20 border border-red-900/30">
        <div>
          <h3 className="text-[15px] font-semibold text-red-400">Danger Zone</h3>
          <p className="text-[14px] text-zinc-400 mt-1">
            Irreversible actions that permanently delete your memory data.
          </p>
        </div>

        <div className="space-y-2.5">
          <Button
            variant="destructive"
            onClick={() => handleDeleteConfirm('last30')}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[14px] py-2.5"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete last 30 days
          </Button>

          <Button
            variant="destructive"
            onClick={() => handleDeleteConfirm('all')}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[14px] py-2.5"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete all memories
          </Button>
        </div>
      </div>
        </>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
          />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-zinc-400 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDialog.onConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

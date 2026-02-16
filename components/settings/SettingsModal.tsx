'use client';

import React, { useEffect, useState } from 'react';
import { useSettings, SettingsTab as TabType } from '@/contexts/SettingsContext';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { X, Settings as SettingsIcon, Brain, Bell, User, Sun, Moon, Monitor, Camera, Loader2, AlertCircle } from 'lucide-react';
import MemorySettingsTab from './MemorySettingsTab';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  getUserSettings,
  updateUserSettings,
  updateUserProfile,
  deleteUserAccount,
  type NotificationSettings,
  type AppearanceSettings,
} from '@/lib/userSettings';
import { getCurrentUser } from '@/lib/auth';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'Appearance', icon: <SettingsIcon className="h-4 w-4" /> },
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
        {/* Close button - positioned absolutely */}
        <button
          onClick={closeSettings}
          className="absolute top-4 right-4 z-10 rounded-lg p-2 hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close settings"
        >
          <X className="h-5 w-5 text-zinc-400 hover:text-white" />
        </button>

        <div className="flex flex-1 overflow-hidden h-full">
          {/* Tabs Sidebar */}
          <div className="w-64 border-r border-zinc-800/50 bg-[#171717] px-3 py-4 flex-shrink-0 overflow-y-auto custom-scrollbar">
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
          <div className="flex-1 overflow-y-auto bg-[#1f1f1f] custom-scrollbar">
            <div className="max-w-3xl mx-auto px-8 py-6">
              {activeTab === 'general' && <AppearanceTab />}
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

// ─── Appearance Tab ─────────────────────────────────────────────────
function AppearanceTab() {
  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: 'dark',
    language: 'en',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await getUserSettings();
      setAppearance(settings.appearance);
    } catch (error) {
      console.error('Failed to load appearance settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updates: Partial<AppearanceSettings>) => {
    try {
      setSaving(true);
      const newAppearance = { ...appearance, ...updates };
      setAppearance(newAppearance);
      await updateUserSettings({ appearance: newAppearance });
      
      // Apply theme change immediately
      if (updates.theme) {
        applyTheme(updates.theme);
      }
    } catch (error) {
      console.error('Failed to save appearance settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = (theme: 'dark' | 'light' | 'auto') => {
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Appearance</h2>
        <p className="text-[15px] text-zinc-400 mt-1">
          Customize how Polaris looks and feels.
        </p>
      </div>

      {/* Theme Selector */}
      <div className="space-y-3 p-5 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
        <div>
          <h3 className="text-[15px] font-semibold text-white">Theme</h3>
          <p className="text-[14px] text-zinc-400 mt-1">
            Choose your preferred color scheme.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light' as const, label: 'Light', icon: <Sun className="h-4 w-4" /> },
            { value: 'dark' as const, label: 'Dark', icon: <Moon className="h-4 w-4" /> },
            { value: 'auto' as const, label: 'Auto', icon: <Monitor className="h-4 w-4" /> },
          ].map((theme) => (
            <button
              key={theme.value}
              onClick={() => saveSettings({ theme: theme.value })}
              disabled={saving}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all',
                appearance.theme === theme.value
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                  : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 hover:text-white',
                saving && 'opacity-50 cursor-not-allowed'
              )}
            >
              {theme.icon}
              <span className="text-sm font-medium">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Language Selector */}
      <div className="space-y-3 p-5 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
        <div>
          <h3 className="text-[15px] font-semibold text-white">Language</h3>
          <p className="text-[14px] text-zinc-400 mt-1">
            Select your preferred language.
          </p>
        </div>

        <select
          value={appearance.language}
          onChange={(e) => saveSettings({ language: e.target.value })}
          disabled={saving}
          className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
        >
          <option value="en">English</option>
          <option value="es">Español (Coming soon)</option>
          <option value="fr">Français (Coming soon)</option>
          <option value="de">Deutsch (Coming soon)</option>
          <option value="ja">日本語 (Coming soon)</option>
        </select>
      </div>

      {saving && (
        <div className="flex items-center gap-2 text-sm text-emerald-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
}

// ─── Notifications Tab ─────────────────────────────────────────────────
function NotificationsTab() {
  const [notifications, setNotifications] = useState<NotificationSettings>({
    push_enabled: true,
    email_notifications: true,
    daily_summary: true,
    important_updates: true,
    schedule_reminders: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await getUserSettings();
      setNotifications(settings.notifications);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updates: Partial<NotificationSettings>) => {
    try {
      setSaving(true);
      const newNotifications = { ...notifications, ...updates };
      setNotifications(newNotifications);
      await updateUserSettings({ notifications: newNotifications });
      setTimeout(() => setSaving(false), 500);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Notifications 🔔</h2>
        <p className="text-[15px] text-zinc-400 mt-1">
          Control how and when you receive notifications.
        </p>
      </div>

      {/* Push Notifications */}
      <div className="space-y-4 p-5 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Label htmlFor="push-enabled" className="text-[15px] font-medium text-white">
              Enable push notifications
            </Label>
            <p className="text-[14px] text-zinc-400 mt-1.5 leading-relaxed">
              Get real-time notifications for agent activities and updates.
            </p>
          </div>
          <Switch
            id="push-enabled"
            checked={notifications.push_enabled}
            onCheckedChange={(checked) => saveSettings({ push_enabled: checked })}
            className="flex-shrink-0"
          />
        </div>
      </div>

      {/* Email Notifications */}
      <div className="space-y-4 p-5 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
        <div>
          <h3 className="text-[15px] font-semibold text-white">Email Notifications</h3>
          <p className="text-[14px] text-zinc-400 mt-1">
            Choose what email notifications you want to receive.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Label htmlFor="email-notifications" className="text-[14px] font-medium text-white">
                Email notifications
              </Label>
              <p className="text-[13px] text-zinc-500 mt-1">
                Receive email notifications for important events.
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={notifications.email_notifications}
              onCheckedChange={(checked) => saveSettings({ email_notifications: checked })}
              className="flex-shrink-0"
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Label htmlFor="daily-summary" className="text-[14px] font-medium text-white">
                Daily summary
              </Label>
              <p className="text-[13px] text-zinc-500 mt-1">
                Get a daily summary of your agent activities.
              </p>
            </div>
            <Switch
              id="daily-summary"
              checked={notifications.daily_summary}
              onCheckedChange={(checked) => saveSettings({ daily_summary: checked })}
              className="flex-shrink-0"
              disabled={!notifications.email_notifications}
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Label htmlFor="important-updates" className="text-[14px] font-medium text-white">
                Important updates
              </Label>
              <p className="text-[13px] text-zinc-500 mt-1">
                Get notified about critical updates and announcements.
              </p>
            </div>
            <Switch
              id="important-updates"
              checked={notifications.important_updates}
              onCheckedChange={(checked) => saveSettings({ important_updates: checked })}
              className="flex-shrink-0"
              disabled={!notifications.email_notifications}
            />
          </div>
        </div>
      </div>

      {/* Schedule Reminders */}
      <div className="space-y-4 p-5 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Label htmlFor="schedule-reminders" className="text-[15px] font-medium text-white">
              Schedule reminders
            </Label>
            <p className="text-[14px] text-zinc-400 mt-1.5 leading-relaxed">
              Get reminders for scheduled tasks and events.
            </p>
          </div>
          <Switch
            id="schedule-reminders"
            checked={notifications.schedule_reminders}
            onCheckedChange={(checked) => saveSettings({ schedule_reminders: checked })}
            className="flex-shrink-0"
          />
        </div>
      </div>

      {saving && (
        <div className="flex items-center gap-2 text-sm text-emerald-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
}

// ─── Account Tab ─────────────────────────────────────────────────────
function AccountTab() {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      setDisplayName(userData?.user_metadata?.display_name || userData?.email?.split('@')[0] || '');
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const handleSaveName = async () => {
    try {
      setSaving(true);
      setError('');
      await updateUserProfile({ displayName });
      await fetchUser();
      setEditingName(false);
    } catch (err) {
      setError('Failed to update display name');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getInitial = (name: string) => {
    return name?.trim()[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Account 👤</h2>
        <p className="text-[15px] text-zinc-400 mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Profile Picture */}
      <div className="space-y-4 p-5 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
        <div>
          <h3 className="text-[15px] font-semibold text-white">Profile Picture</h3>
          <p className="text-[14px] text-zinc-400 mt-1">
            Your profile picture will be displayed across Polaris.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-semibold">
            {getInitial(displayName)}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
          >
            <Camera className="h-4 w-4 mr-2" />
            Change Picture (Coming soon)
          </Button>
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-4 p-5 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
        <div>
          <h3 className="text-[15px] font-semibold text-white">Display Name</h3>
          <p className="text-[14px] text-zinc-400 mt-1">
            This is the name that will be shown in Polaris.
          </p>
        </div>

        {editingName ? (
          <div className="space-y-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter display name"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSaveName}
                disabled={saving || !displayName.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
              <Button
                onClick={() => {
                  setEditingName(false);
                  setDisplayName(user?.user_metadata?.display_name || user?.email?.split('@')[0] || '');
                }}
                variant="outline"
                className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-[15px] text-white">{displayName}</p>
            <Button
              onClick={() => setEditingName(true)}
              variant="outline"
              size="sm"
              className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
            >
              Edit
            </Button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>

      {/* Email (Read-only) */}
      <div className="space-y-4 p-5 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
        <div>
          <h3 className="text-sm font-medium text-zinc-500">Email Address</h3>
          <p className="text-[15px] text-white mt-1.5">{user?.email || 'Loading...'}</p>
          <p className="text-[13px] text-zinc-500 mt-1">This email is verified and cannot be changed.</p>
        </div>
      </div>

      {/* Change Password */}
      <div className="space-y-4 p-5 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
        <div>
          <h3 className="text-[15px] font-semibold text-white">Password</h3>
          <p className="text-[14px] text-zinc-400 mt-1">
            Update your password to keep your account secure.
          </p>
        </div>
        <Button
          onClick={() => setShowPasswordModal(true)}
          variant="outline"
          className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
        >
          Change Password
        </Button>
      </div>

      {/* Delete Account */}
      <div className="space-y-4 p-5 rounded-xl bg-red-500/5 border border-red-500/20">
        <div>
          <h3 className="text-[15px] font-semibold text-red-400">Delete Account</h3>
          <p className="text-[14px] text-red-300/70 mt-1">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>
        <Button
          onClick={() => setShowDeleteModal(true)}
          variant="destructive"
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
        >
          Delete Account
        </Button>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          userEmail={user?.email || ''}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}

// ─── Change Password Modal ─────────────────────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const { getAuthToken } = await import('@/lib/auth');
      const token = await getAuthToken();

      const response = await fetch(`${API_URL}/api/auth/update-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update password');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>

        {success ? (
          <div className="text-center py-4">
            <div className="text-emerald-400 text-5xl mb-3">✓</div>
            <p className="text-emerald-400">Password updated successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="new-password" className="text-sm text-zinc-400">
                New Password
              </Label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1.5 w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="confirm-password" className="text-sm text-zinc-400">
                Confirm New Password
              </Label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Delete Account Modal ─────────────────────────────────────────────────
function DeleteAccountModal({ userEmail, onClose }: { userEmail: string; onClose: () => void }) {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');

    if (confirmEmail !== userEmail) {
      setError('Email does not match');
      return;
    }

    try {
      setLoading(true);
      await deleteUserAccount(confirmEmail);
      
      // Sign out and redirect
      const { signOut } = await import('@/lib/auth');
      await signOut();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-red-500/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-semibold text-red-400 mb-2">Delete Account</h3>
        <p className="text-sm text-zinc-400 mb-6">
          This action cannot be undone. All your data will be permanently deleted.
          <br /><br />
          Please type <strong className="text-white">{userEmail}</strong> to confirm.
        </p>

        <div className="space-y-4">
          <input
            type="email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading || !confirmEmail}
              variant="destructive"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Account'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

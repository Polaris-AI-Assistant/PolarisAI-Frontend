// User settings API functions
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

import { getAuthToken } from './auth';

export interface NotificationSettings {
  push_enabled: boolean;
  email_notifications: boolean;
  daily_summary: boolean;
  important_updates: boolean;
  schedule_reminders: boolean;
}

export interface AppearanceSettings {
  theme: 'dark' | 'light' | 'auto';
  language: string;
}

export interface UserSettings {
  user_id: string;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  created_at: string;
  updated_at: string;
}

/**
 * Get user settings
 */
export async function getUserSettings(): Promise<UserSettings> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/api/user/settings`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }

  const data = await response.json();
  return data.settings;
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  settings: Partial<Pick<UserSettings, 'notifications' | 'appearance'>>
): Promise<UserSettings> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/api/user/settings`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    throw new Error('Failed to update settings');
  }

  const data = await response.json();
  return data.settings;
}

/**
 * Update user profile (display name, profile picture)
 */
export async function updateUserProfile(profile: {
  displayName?: string;
  profilePicture?: string;
}): Promise<void> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/api/user/profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }
}

/**
 * Delete user account
 */
export async function deleteUserAccount(confirmEmail: string): Promise<void> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/api/user/account`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ confirmEmail }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete account');
  }
}

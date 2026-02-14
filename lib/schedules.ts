// Schedules API service for PolarisAI

import { authenticatedFetch, getAuthToken, getStoredUser } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Schedule {
  id: string;
  user_id: string;
  type: 'reminder' | 'action';
  content: string;
  cron_expression: string;
  recurring: boolean;
  status: 'active' | 'paused' | 'completed' | 'failed';
  next_execution: string;
  next_execution_local?: string;
  last_execution: string | null;
  last_execution_local?: string | null;
  execution_count: number;
  timezone: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleData {
  content: string;
  cronExpression: string;
  type: 'reminder' | 'action';
  recurring?: boolean;
  timezone?: string;
}

export interface UpdateScheduleData {
  content?: string;
  cronExpression?: string;
  recurring?: boolean;
}

export interface SchedulesListResponse {
  success: boolean;
  schedules: Schedule[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get headers for schedule API calls
 */
function getHeaders() {
  const token = getAuthToken();
  const user = getStoredUser();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-user-id': user?.id || '',
  };
}

/**
 * Create a new schedule
 */
export async function createSchedule(data: CreateScheduleData): Promise<Schedule> {
  const response = await fetch(`${API_URL}/api/schedules`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to create schedule');
  }

  return result.schedule;
}

/**
 * List user's schedules
 */
export async function listSchedules(
  options: { status?: string; limit?: number; offset?: number } = {}
): Promise<SchedulesListResponse> {
  const { status = 'all', limit = 50, offset = 0 } = options;
  const params = new URLSearchParams({
    status,
    limit: String(limit),
    offset: String(offset),
  });

  const response = await fetch(`${API_URL}/api/schedules?${params}`, {
    headers: getHeaders(),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch schedules');
  }

  return result;
}

/**
 * Get a specific schedule
 */
export async function getSchedule(scheduleId: string): Promise<Schedule> {
  const response = await fetch(`${API_URL}/api/schedules/${scheduleId}`, {
    headers: getHeaders(),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch schedule');
  }

  return result.schedule;
}

/**
 * Update a schedule
 */
export async function updateSchedule(
  scheduleId: string,
  updates: UpdateScheduleData
): Promise<Schedule> {
  const response = await fetch(`${API_URL}/api/schedules/${scheduleId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to update schedule');
  }

  return result.schedule;
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(scheduleId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/schedules/${scheduleId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to delete schedule');
  }
}

/**
 * Pause a schedule
 */
export async function pauseSchedule(scheduleId: string): Promise<Schedule> {
  const response = await fetch(`${API_URL}/api/schedules/${scheduleId}/pause`, {
    method: 'POST',
    headers: getHeaders(),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to pause schedule');
  }

  return result.schedule;
}

/**
 * Resume a paused schedule
 */
export async function resumeSchedule(scheduleId: string): Promise<Schedule> {
  const response = await fetch(`${API_URL}/api/schedules/${scheduleId}/resume`, {
    method: 'POST',
    headers: getHeaders(),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to resume schedule');
  }

  return result.schedule;
}

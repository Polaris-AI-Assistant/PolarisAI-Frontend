'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Schedule,
  CreateScheduleData,
  listSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  pauseSchedule,
  resumeSchedule,
} from '../lib/schedules'
import { ScheduleCard } from './schedule-card'

// Custom scrollbar styles for modal
const modalScrollbarStyles = `
  .modal-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .modal-scrollbar::-webkit-scrollbar-track {
    background: rgba(26, 26, 26, 0.3);
    border-radius: 4px;
  }
  .modal-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  .modal-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

// ─── Cron preset options ─────────────────────────────────────────────
const CRON_PRESETS = [
  { label: 'Every day at 9 AM', value: '0 9 * * *' },
  { label: 'Every day at 2 PM', value: '0 14 * * *' },
  { label: 'Every day at 6 PM', value: '0 18 * * *' },
  { label: 'Every Monday at 9 AM', value: '0 9 * * 1' },
  { label: 'Every weekday at 9 AM', value: '0 9 * * 1-5' },
  { label: 'Every hour', value: '0 * * * *' },
]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type ScheduleMode = 'once' | 'daily' | 'weekly' | 'custom'

/** Parse a cron expression back into form state */
function parseCron(cron: string) {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return null
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
  return { minute, hour, dayOfMonth, month, dayOfWeek }
}

/** Build cron from UI form state */
function buildCron(mode: ScheduleMode, hour: string, minute: string, selectedDays: boolean[], specificDate: string): string {
  const h = hour || '9'
  const m = minute || '0'

  switch (mode) {
    case 'once': {
      if (specificDate) {
        const d = new Date(specificDate)
        return `${m} ${h} ${d.getDate()} ${d.getMonth() + 1} *`
      }
      return `${m} ${h} * * *`
    }
    case 'daily':
      return `${m} ${h} * * *`
    case 'weekly': {
      const days = selectedDays
        .map((sel, i) => (sel ? i : -1))
        .filter((i) => i >= 0)
      if (days.length === 0) return `${m} ${h} * * *`
      if (days.length === 7) return `${m} ${h} * * *`
      return `${m} ${h} * * ${days.join(',')}`
    }
    case 'custom':
      return '' // user types manually
    default:
      return `${m} ${h} * * *`
  }
}

// ─── Schedule Form Modal ─────────────────────────────────────────────
function ScheduleFormModal({
  onClose,
  onSuccess,
  editSchedule,
}: {
  onClose: () => void
  onSuccess: () => void
  editSchedule?: Schedule | null
}) {
  const [content, setContent] = useState(editSchedule?.content || '')
  const [type, setType] = useState<'reminder' | 'action'>(editSchedule?.type || 'reminder')
  const [recurring, setRecurring] = useState(editSchedule?.recurring || false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Schedule builder state
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('daily')
  const [hour, setHour] = useState('09')
  const [minute, setMinute] = useState('00')
  const [selectedDays, setSelectedDays] = useState<boolean[]>([false, true, true, true, true, true, false]) // weekdays
  const [specificDate, setSpecificDate] = useState('')
  const [customCron, setCustomCron] = useState('')

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Pre-fill from edit schedule
  useEffect(() => {
    if (editSchedule?.cron_expression) {
      const parsed = parseCron(editSchedule.cron_expression)
      if (parsed) {
        setHour(parsed.hour === '*' ? '09' : parsed.hour.padStart(2, '0'))
        setMinute(parsed.minute === '*' ? '00' : parsed.minute.padStart(2, '0'))

        if (parsed.dayOfMonth !== '*' && parsed.month !== '*') {
          setScheduleMode('once')
        } else if (parsed.dayOfWeek !== '*') {
          setScheduleMode('weekly')
          const dayNums = parsed.dayOfWeek.split(',').map(Number)
          setSelectedDays(DAY_LABELS.map((_, i) => dayNums.includes(i)))
          setRecurring(true)
        } else {
          setScheduleMode('daily')
          setRecurring(true)
        }
      } else {
        setScheduleMode('custom')
        setCustomCron(editSchedule.cron_expression)
      }
    }
  }, [editSchedule])

  // Compute final cron expression
  const cronExpression =
    scheduleMode === 'custom'
      ? customCron
      : buildCron(scheduleMode, hour, minute, selectedDays, specificDate)

  // Auto-set recurring based on mode
  useEffect(() => {
    if (scheduleMode === 'once') setRecurring(false)
    if (scheduleMode === 'daily' || scheduleMode === 'weekly') setRecurring(true)
  }, [scheduleMode])

  // Get today in YYYY-MM-DD for date input min
  const todayStr = new Date().toISOString().split('T')[0]

  // Compute human-readable preview
  const previewText = (() => {
    if (scheduleMode === 'custom') return customCron || 'Enter a cron expression'
    const hNum = parseInt(hour) || 0
    const ampm = hNum >= 12 ? 'PM' : 'AM'
    const h12 = hNum === 0 ? 12 : hNum > 12 ? hNum - 12 : hNum
    const timeStr = `${h12}:${(minute || '00').padStart(2, '0')} ${ampm}`

    if (scheduleMode === 'once') {
      if (specificDate) {
        const d = new Date(specificDate + 'T00:00:00')
        return `Once on ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${timeStr}`
      }
      return `Once at ${timeStr}`
    }
    if (scheduleMode === 'daily') return `Every day at ${timeStr}`
    if (scheduleMode === 'weekly') {
      const days = selectedDays
        .map((s, i) => (s ? DAY_LABELS[i] : null))
        .filter(Boolean)
      if (days.length === 0) return `Select at least one day`
      if (days.length === 7) return `Every day at ${timeStr}`
      return `Every ${days.join(', ')} at ${timeStr}`
    }
    return ''
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!cronExpression) {
      setError('Please configure a schedule')
      setLoading(false)
      return
    }

    try {
      if (editSchedule) {
        await updateSchedule(editSchedule.id, {
          content,
          cronExpression,
          recurring,
        })
      } else {
        await createSchedule({
          content,
          cronExpression,
          type,
          recurring,
          timezone,
        })
      }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Toggle a day in weekly mode
  const toggleDay = (index: number) => {
    setSelectedDays((prev) => prev.map((v, i) => (i === index ? !v : v)))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <style>{modalScrollbarStyles}</style>
      <div className="bg-[#0f0f0f]/95 backdrop-blur-xl rounded-2xl border border-white/[0.06] shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto modal-scrollbar">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-white">
              {editSchedule ? 'Edit Schedule' : 'Create Schedule'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type selector */}
            {!editSchedule && (
              <div>
                <label className="block text-sm font-medium text-white mb-3">Type</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setType('reminder')}
                    className={`flex-1 flex items-center justify-center gap-3 px-5 py-4 rounded-xl border transition-all ${
                      type === 'reminder'
                        ? 'bg-white/[0.08] border-white/20 text-white shadow-lg'
                        : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:bg-white/[0.04] hover:border-white/10'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="text-sm font-medium">Reminder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('action')}
                    className={`flex-1 flex items-center justify-center gap-3 px-5 py-4 rounded-xl border transition-all ${
                      type === 'action'
                        ? 'bg-white/[0.08] border-white/20 text-white shadow-lg'
                        : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:bg-white/[0.04] hover:border-white/10'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-sm font-medium">Action</span>
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {type === 'reminder'
                    ? 'Get a push notification at the scheduled time'
                    : 'AI will execute a task at the scheduled time'}
                </p>
              </div>
            )}

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                {type === 'reminder' ? 'Reminder Message' : 'Action to Execute'}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  type === 'reminder'
                    ? 'e.g., Time to take a break and stretch'
                    : 'e.g., Send me a daily weather summary'
                }
                required
                rows={3}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/[0.08] rounded-xl text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-white/20 focus:bg-[#1f1f1f] resize-none transition-all"
              />
            </div>

            {/* ── Schedule Mode Tabs ── */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">Frequency</label>
              <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-white/[0.06]">
                {([
                  { value: 'once', label: 'Once' },
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'custom', label: 'Custom' },
                ] as { value: ScheduleMode; label: string }[]).map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setScheduleMode(tab.value)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      scheduleMode === tab.value
                        ? 'bg-white/[0.08] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Date picker (Once mode) ── */}
            {scheduleMode === 'once' && (
              <div>
                <label className="block text-sm font-medium text-white mb-3">Date</label>
                <input
                  type="date"
                  value={specificDate}
                  min={todayStr}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  required
                  style={{ colorScheme: 'dark' }}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-white/20 focus:bg-[#1f1f1f] transition-all"
                />
              </div>
            )}

            {/* ── Day-of-week selector (Weekly mode) ── */}
            {scheduleMode === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-white mb-3">Repeat on</label>
                <div className="flex gap-2">
                  {DAY_LABELS.map((day, i) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`flex-1 py-3 rounded-xl text-xs font-semibold transition-all ${
                        selectedDays[i]
                          ? 'bg-white text-black shadow-lg'
                          : 'bg-[#1a1a1a] border border-white/[0.08] text-gray-500 hover:bg-white/[0.04] hover:border-white/[0.12]'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Time picker (all modes except custom) ── */}
            {scheduleMode !== 'custom' && (
              <div>
                <label className="block text-sm font-medium text-white mb-3">Time</label>
                <div className="flex gap-3 items-center">
                  <div className="flex-1 relative">
                    <select
                      value={hour}
                      onChange={(e) => setHour(e.target.value)}
                      style={{ colorScheme: 'dark' }}
                      className="w-full appearance-none px-4 py-3 bg-[#1a1a1a] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-white/20 focus:bg-[#1f1f1f] transition-all pr-8"
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const ampm = i >= 12 ? 'PM' : 'AM'
                        const h12 = i === 0 ? 12 : i > 12 ? i - 12 : i
                        return (
                          <option key={i} value={String(i).padStart(2, '0')}>
                            {h12}:00 {ampm}
                          </option>
                        )
                      })}
                    </select>
                    <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  <span className="text-gray-500 font-medium">:</span>

                  <div className="flex-1 relative">
                    <select
                      value={minute}
                      onChange={(e) => setMinute(e.target.value)}
                      style={{ colorScheme: 'dark' }}
                      className="w-full appearance-none px-4 py-3 bg-[#1a1a1a] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-white/20 focus:bg-[#1f1f1f] transition-all pr-8"
                    >
                      {Array.from({ length: 60 }, (_, m) => (
                        <option key={m} value={String(m).padStart(2, '0')}>
                          :{String(m).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* ── Custom cron input ── */}
            {scheduleMode === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Cron Expression
                </label>
                <input
                  type="text"
                  value={customCron}
                  onChange={(e) => setCustomCron(e.target.value)}
                  placeholder="0 9 * * *"
                  required
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/[0.08] rounded-xl text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-white/20 focus:bg-[#1f1f1f] transition-all font-mono"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Format: minute hour day month dayOfWeek
                </p>
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {CRON_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setCustomCron(preset.value)}
                      className={`px-3 py-2 rounded-lg text-xs border transition-all ${
                        customCron === preset.value
                          ? 'bg-white/[0.08] border-white/20 text-white'
                          : 'bg-[#1a1a1a] border-white/[0.06] text-gray-400 hover:bg-white/[0.04]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Schedule preview ── */}
            <div className="flex items-center gap-3 p-4 bg-[#1a1a1a] border border-white/[0.06] rounded-xl">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-white">{previewText}</p>
            </div>

            {/* Recurring toggle */}
            <div className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-white/[0.06] rounded-xl">
              <div>
                <p className="text-sm font-medium text-white">Recurring</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {recurring ? 'Will repeat on schedule' : 'Will run only once'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRecurring(!recurring)}
                className={`relative w-12 h-6 rounded-full transition-all shadow-inner ${
                  recurring ? 'bg-white' : 'bg-white/10'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all shadow-sm ${
                    recurring ? 'translate-x-6 bg-black' : 'translate-x-0 bg-white/60'
                  }`}
                />
              </button>
            </div>

            {/* Timezone info */}
            <div className="flex items-center gap-3 p-4 bg-[#1a1a1a] border border-white/[0.06] rounded-xl">
              <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-400">
                Timezone: <span className="text-white">{timezone}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-5 py-3 bg-[#1a1a1a] border border-white/[0.08] rounded-xl text-white text-sm font-medium hover:bg-white/[0.04] hover:border-white/[0.12] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !content || !cronExpression}
                className="flex-1 px-5 py-3 bg-white rounded-xl text-black text-sm font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading
                  ? 'Saving...'
                  : editSchedule
                    ? 'Update Schedule'
                    : 'Create Schedule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────
function EmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-white text-lg font-medium mb-2">No schedules yet</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">
        Create reminders to get notified or schedule AI actions to run automatically.
      </p>
      <button
        onClick={onCreateNew}
        className="px-5 py-2.5 bg-emerald-500 rounded-lg text-black text-sm font-semibold hover:bg-emerald-400 transition-colors"
      >
        Create Your First Schedule
      </button>
    </div>
  )
}

// ─── Main SchedulesContent Component ─────────────────────────────────
export default function SchedulesContent() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('active')
  const [showForm, setShowForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)

  const loadSchedules = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listSchedules({ status: filter })
      setSchedules(data.schedules)
    } catch (error) {
      console.error('Error loading schedules:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return
    try {
      await deleteSchedule(id)
      loadSchedules()
    } catch (error) {
      console.error('Error deleting schedule:', error)
    }
  }

  const handlePause = async (id: string) => {
    try {
      await pauseSchedule(id)
      loadSchedules()
    } catch (error) {
      console.error('Error pausing schedule:', error)
    }
  }

  const handleResume = async (id: string) => {
    try {
      await resumeSchedule(id)
      loadSchedules()
    } catch (error) {
      console.error('Error resuming schedule:', error)
    }
  }

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setEditingSchedule(null)
    loadSchedules()
  }

  const filters = [
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' },
    { value: 'all', label: 'All' },
  ]

  return (
    <div className="flex-1 flex flex-col bg-[#212121] overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/[0.08] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Schedules</h1>
            <p className="text-sm text-gray-500 mt-1">
              Create reminders and automated AI actions
            </p>
          </div>
          <button
            onClick={() => {
              setEditingSchedule(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 rounded-lg text-black text-sm font-semibold hover:bg-emerald-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Schedule
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mt-4 bg-white/5 p-1 rounded-lg w-fit">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                filter === f.value
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-gray-500">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm">Loading schedules...</span>
            </div>
          </div>
        ) : schedules.length === 0 ? (
          <EmptyState
            onCreateNew={() => {
              setEditingSchedule(null)
              setShowForm(true)
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPause={handlePause}
                onResume={handleResume}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <ScheduleFormModal
          editSchedule={editingSchedule}
          onClose={() => {
            setShowForm(false)
            setEditingSchedule(null)
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}

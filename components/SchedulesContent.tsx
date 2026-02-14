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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] rounded-xl border border-white/10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              {editSchedule ? 'Edit Schedule' : 'Create Schedule'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type selector */}
            {!editSchedule && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setType('reminder')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                      type === 'reminder'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-lg">🔔</span>
                    <span className="text-sm font-medium">Reminder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('action')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                      type === 'action'
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-lg">⚡</span>
                    <span className="text-sm font-medium">Action</span>
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  {type === 'reminder'
                    ? 'Get a push notification at the scheduled time'
                    : 'AI will execute a task at the scheduled time'}
                </p>
              </div>
            )}

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
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
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-white/30 resize-none transition-colors"
              />
            </div>

            {/* ── Schedule Mode Tabs ── */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
              <div className="flex bg-white/5 p-1 rounded-lg">
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
                    className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                      scheduleMode === tab.value
                        ? 'bg-white/10 text-white shadow-sm'
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                <input
                  type="date"
                  value={specificDate}
                  min={todayStr}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  required
                  style={{ colorScheme: 'dark' }}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
            )}

            {/* ── Day-of-week selector (Weekly mode) ── */}
            {scheduleMode === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Repeat on</label>
                <div className="flex gap-1.5">
                  {DAY_LABELS.map((day, i) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedDays[i]
                          ? 'bg-emerald-500 text-black'
                          : 'bg-white/5 border border-white/10 text-gray-500 hover:bg-white/10'
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                <div className="flex gap-3 items-center">
                  <div className="flex-1 relative">
                    <select
                      value={hour}
                      onChange={(e) => setHour(e.target.value)}
                      style={{ colorScheme: 'dark' }}
                      className="w-full appearance-none px-4 py-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30 transition-colors pr-8"
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
                      className="w-full appearance-none px-4 py-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30 transition-colors pr-8"
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cron Expression
                </label>
                <input
                  type="text"
                  value={customCron}
                  onChange={(e) => setCustomCron(e.target.value)}
                  placeholder="0 9 * * *"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-white/30 transition-colors font-mono"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Format: minute hour day month dayOfWeek
                </p>
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {CRON_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setCustomCron(preset.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                        customCron === preset.value
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Schedule preview ── */}
            <div className="flex items-center gap-2.5 p-3 bg-white/5 rounded-lg">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-gray-300">{previewText}</p>
            </div>

            {/* Recurring toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-300">Recurring</p>
                <p className="text-xs text-gray-500">
                  {recurring ? 'Will repeat on schedule' : 'Will run only once'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRecurring(!recurring)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  recurring ? 'bg-emerald-500' : 'bg-white/20'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    recurring ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Timezone info */}
            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-gray-400">
                Timezone: <span className="text-gray-300">{timezone}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg text-white text-sm font-medium hover:bg-white/15 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !content || !cronExpression}
                className="flex-1 px-4 py-2.5 bg-emerald-500 rounded-lg text-black text-sm font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

// ─── Status Badge ────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Active' },
    paused: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Paused' },
    completed: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Completed' },
    failed: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Failed' },
  }
  const { bg, text, label } = config[status] || config.active

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}

// ─── Schedule Card ───────────────────────────────────────────────────
function ScheduleCard({
  schedule,
  onEdit,
  onDelete,
  onPause,
  onResume,
}: {
  schedule: Schedule
  onEdit: (s: Schedule) => void
  onDelete: (id: string) => void
  onPause: (id: string) => void
  onResume: (id: string) => void
}) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleString()
    } catch {
      return dateStr
    }
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 flex flex-col gap-4 hover:border-white/15 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{schedule.type === 'reminder' ? '🔔' : '⚡'}</span>
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
            {schedule.type}
          </span>
        </div>
        <StatusBadge status={schedule.status} />
      </div>

      {/* Content */}
      <p className="text-white text-sm leading-relaxed">{schedule.content}</p>

      {/* Meta */}
      <div className="space-y-2 pt-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 text-xs">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-gray-500">Next run:</span>
          <span className="text-gray-300">
            {formatDate(schedule.next_execution_local || schedule.next_execution)}
          </span>
        </div>

        {schedule.recurring && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-blue-400">🔄</span>
            <span className="text-blue-400 font-medium">Recurring</span>
            <span className="text-gray-500 font-mono">{schedule.cron_expression}</span>
          </div>
        )}

        {schedule.execution_count > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-500">Executed {schedule.execution_count} time{schedule.execution_count !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {schedule.status === 'active' && (
          <button
            onClick={() => onPause(schedule.id)}
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-xs font-medium hover:bg-white/10 transition-colors"
          >
            Pause
          </button>
        )}
        {schedule.status === 'paused' && (
          <button
            onClick={() => onResume(schedule.id)}
            className="flex-1 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
          >
            Resume
          </button>
        )}
        <button
          onClick={() => onEdit(schedule)}
          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-xs font-medium hover:bg-white/10 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(schedule.id)}
          className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
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
    <div className="flex-1 flex flex-col bg-black overflow-hidden">
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
      <div className="flex-1 overflow-y-auto p-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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

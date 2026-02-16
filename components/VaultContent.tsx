'use client'

import React, { useState, useEffect } from 'react'
import {
  getVaultFiles,
  getVaultStats,
  deleteVaultFile,
  formatFileSize,
  getFileIcon,
  type VaultFile,
  type VaultStats,
} from '../lib/vault'
import { downloadFile } from '../lib/files'

// ─── File Preview Modal ──────────────────────────────────────────────
function FilePreviewModal({
  file,
  onClose,
  onDelete,
  onDownload,
}: {
  file: VaultFile
  onClose: () => void
  onDelete: (id: string) => void
  onDownload: (file: VaultFile) => void
}) {
  const isImage = file.file_type === 'image'
  const isPdf = file.mime_type === 'application/pdf'
  const isVideo = file.file_type === 'video'
  const isAudio = file.file_type === 'audio'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#1e1e1e] rounded-xl border border-white/10 w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">{getFileIcon(file.file_type)}</span>
            <div className="min-w-0">
              <h3 className="text-white font-semibold text-sm truncate">{file.original_filename}</h3>
              <p className="text-gray-500 text-xs mt-0.5">
                {formatFileSize(file.size)} • {file.mime_type}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-black/40 flex items-center justify-center min-h-[300px] max-h-[60vh]">
          {isImage && file.public_url ? (
            <img
              src={file.public_url}
              alt={file.original_filename}
              className="max-w-full max-h-full object-contain"
            />
          ) : isPdf && file.public_url ? (
            <iframe
              src={file.public_url}
              className="w-full h-full min-h-[500px]"
              title={file.original_filename}
            />
          ) : isVideo && file.public_url ? (
            <video
              src={file.public_url}
              controls
              className="max-w-full max-h-full"
            />
          ) : isAudio && file.public_url ? (
            <div className="flex flex-col items-center gap-6 p-8">
              <span className="text-7xl">🎵</span>
              <audio src={file.public_url} controls className="w-full max-w-md" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 p-8 text-center">
              <span className="text-7xl">{getFileIcon(file.file_type)}</span>
              <p className="text-gray-400 text-sm">Preview not available for this file type</p>
              <p className="text-gray-600 text-xs">{file.mime_type}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08]">
          <div className="text-xs text-gray-500">
            Created {new Date(file.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div className="flex items-center gap-2">
            {file.public_url && (
              <a
                href={file.public_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open
              </a>
            )}
            <button
              onClick={() => onDownload(file)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this file permanently?')) {
                  onDelete(file.id)
                  onClose()
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── File Card ───────────────────────────────────────────────────────
function FileCard({
  file,
  viewMode,
  onClick,
}: {
  file: VaultFile
  viewMode: 'grid' | 'list'
  onClick: () => void
}) {
  const isImage = file.file_type === 'image'
  const isPdf = file.mime_type === 'application/pdf'

  if (viewMode === 'list') {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center gap-4 px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10 transition-all text-left group"
      >
        {/* Thumbnail */}
        <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center overflow-hidden flex-shrink-0">
          {isImage && file.public_url ? (
            <img src={file.public_url} alt="" className="w-full h-full object-cover" />
          ) : isPdf ? (
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
              <text x="7" y="17" fontSize="5" fontWeight="bold" fill="currentColor">PDF</text>
            </svg>
          ) : (
            <span className="text-lg">{getFileIcon(file.file_type)}</span>
          )}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate group-hover:text-emerald-400 transition-colors">
            {file.original_filename}
          </p>
        </div>

        {/* Size */}
        <span className="text-xs text-gray-500 flex-shrink-0">{formatFileSize(file.size)}</span>

        {/* Date */}
        <span className="text-xs text-gray-500 flex-shrink-0 hidden sm:block">
          {new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>

        {/* Arrow */}
        <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    )
  }

  // Grid card
  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:bg-white/[0.06] hover:border-white/10 transition-all group"
    >
      {/* Preview area */}
      <div className="w-full h-[140px] bg-[#111] flex items-center justify-center overflow-hidden relative">
        {isImage && file.public_url ? (
          <img
            src={file.public_url}
            alt={file.original_filename}
            className="w-full h-full object-cover"
          />
        ) : isPdf ? (
          <div className="flex flex-col items-center gap-1">
            <svg className="w-10 h-10 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
              <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
            <span className="text-[10px] text-red-400 font-semibold uppercase">PDF</span>
          </div>
        ) : (
          <span className="text-4xl">{getFileIcon(file.file_type)}</span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-xs font-medium bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
            View File
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm text-white truncate font-medium group-hover:text-emerald-400 transition-colors" title={file.original_filename}>
          {file.original_filename}
        </p>
        <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)}</p>
      </div>
    </button>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      </div>
      <h3 className="text-white font-semibold mb-1">No files yet</h3>
      <p className="text-gray-500 text-sm max-w-sm">
        Files generated by your agents will appear here. Start a conversation to create some!
      </p>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────
export default function VaultContent() {
  const [files, setFiles] = useState<VaultFile[]>([])
  const [stats, setStats] = useState<VaultStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null)

  useEffect(() => {
    loadData()
  }, [timeFilter, typeFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [filesData, statsData] = await Promise.all([
        getVaultFiles({
          timeFilter,
          type: typeFilter !== 'all' ? typeFilter : undefined,
        }),
        getVaultStats(),
      ])
      setFiles(filesData.files)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading vault data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (fileId: string) => {
    try {
      await deleteVaultFile(fileId)
      loadData()
    } catch {
      alert('Failed to delete file')
    }
  }

  const handleDownload = (file: VaultFile) => {
    downloadFile(file.id, file.original_filename)
  }

  const storagePercent = stats
    ? (stats.totalStorage / stats.storageLimit) * 100
    : 0

  const timeButtons = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ]

  const typeOptions = [
    { value: 'all', label: 'All Files' },
    { value: 'image', label: 'Images' },
    { value: 'document', label: 'Documents' },
    { value: 'audio', label: 'Audio' },
    { value: 'video', label: 'Video' },
  ]

  return (
    <div className="flex-1 flex flex-col bg-black overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/[0.08] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Vault</h1>
            <p className="text-sm text-gray-500 mt-1">
              Files generated by your agents
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-white/5 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm cursor-pointer outline-none hover:bg-white/10 transition-colors"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Filter tabs */}
        <div className="flex gap-1 mt-4 bg-white/5 p-1 rounded-lg w-fit">
          {timeButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setTimeFilter(btn.key)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                timeFilter === btn.key
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Storage Bar */}
        {stats && (
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 mb-6">
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-gray-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                Storage
              </span>
              <span className="text-gray-400">{formatFileSize(stats.totalStorage)} / {formatFileSize(stats.storageLimit)}</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              />
            </div>
            {/* Quick stats */}
            <div className="flex gap-4 mt-3">
              <span className="text-xs text-gray-500">{stats.totalFiles} files</span>
              {stats.byType?.image ? <span className="text-xs text-gray-500">{stats.byType.image} images</span> : null}
              {stats.byType?.document ? <span className="text-xs text-gray-500">{stats.byType.document} docs</span> : null}
              {stats.byType?.audio ? <span className="text-xs text-gray-500">{stats.byType.audio} audio</span> : null}
              {stats.byType?.video ? <span className="text-xs text-gray-500">{stats.byType.video} video</span> : null}
            </div>
          </div>
        )}

        {/* Files */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-gray-500">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm">Loading files...</span>
            </div>
          </div>
        ) : files.length === 0 ? (
          <EmptyState />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                viewMode="grid"
                onClick={() => setPreviewFile(file)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                viewMode="list"
                onClick={() => setPreviewFile(file)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDelete={handleDelete}
          onDownload={handleDownload}
        />
      )}
    </div>
  )
}

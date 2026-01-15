'use client';

import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Trash2, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Memory {
  id: string;
  content: string;
  summary?: string;
  memory_type: 'user_profile' | 'behavior_pattern' | 'task_state' | 'cross_app';
  source_app: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

const MEMORY_TYPE_LABELS = {
  user_profile: 'User Profile',
  behavior_pattern: 'Behavior Pattern',
  task_state: 'Task State',
  cross_app: 'Cross-App'
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function MemoryDashboard() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchMemories();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMemories(memories);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMemories(
        memories.filter((memory) =>
          memory.content.toLowerCase().includes(query) ||
          (memory.summary && memory.summary.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, memories]);

  const fetchMemories = async () => {
    try {
      setIsLoading(true);
      const { getAuthToken } = await import('@/lib/auth');
      const token = getAuthToken();

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/api/memory/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch memories');
      }

      const data = await response.json();
      if (data.success && data.memories) {
        setMemories(data.memories);
        setFilteredMemories(data.memories);
      }
    } catch (error) {
      console.error('Error fetching memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMemory = async (memoryId: string) => {
    try {
      const { getAuthToken } = await import('@/lib/auth');
      const token = getAuthToken();

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/api/memory/${memoryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete memory');
      }

      // Remove from local state
      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
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
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white">Saved memories</h2>
        <p className="text-[14px] text-zinc-400 mt-1 leading-relaxed">
          Polaris tries to remember your recent chats, but it may forget things over time. Saved
          memories are never forgotten.{' '}
          <button className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
            Learn more
          </button>
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search memories"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-10 py-3 bg-zinc-900/30 border border-zinc-800/50 rounded-lg text-[14px] text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-300 rounded-md hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Memories List */}
      {filteredMemories.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-500 text-sm">
            {searchQuery ? 'No memories found matching your search' : 'No memories saved yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMemories.map((memory) => (
            <div
              key={memory.id}
              className={cn(
                'group relative p-4 rounded-lg border transition-all',
                'bg-zinc-900/20 border-zinc-800/40 hover:bg-zinc-800/30 hover:border-zinc-700/50'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-white leading-relaxed line-clamp-2">
                    {memory.summary || "No summary available"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[13px] text-zinc-500">{formatDate(memory.created_at)}</span>
                    {memory.memory_type && (
                      <>
                        <span className="text-[13px] text-zinc-700">•</span>
                        <span className="text-[13px] text-zinc-500">
                          {MEMORY_TYPE_LABELS[memory.memory_type]}
                        </span>
                      </>
                    )}
                    {memory.source_app && memory.source_app !== 'chat' && (
                      <>
                        <span className="text-[13px] text-zinc-700">•</span>
                        <span className="text-[13px] text-zinc-500 capitalize">
                          {memory.source_app}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(memory.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-zinc-700/50 transition-all"
                >
                  <MoreVertical className="h-4 w-4 text-zinc-400" />
                </button>
              </div>

              {/* Delete Confirmation Dropdown */}
              {deleteConfirmId === memory.id && (
                <div
                  className="absolute right-4 top-12 z-10 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl py-1 min-w-[120px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => deleteMemory(memory.id)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close delete dropdown */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-[5]"
          onClick={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  );
}

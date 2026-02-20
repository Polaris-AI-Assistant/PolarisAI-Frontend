'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket, type Notification } from '@/contexts/SocketContext';
import { useToast } from '@/contexts/ToastContext';

const TOAST_DEBOUNCE_MS = 900;

function isToastDebugEnabled() {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem('polaris_toast_debug') === '1';
  } catch {
    return false;
  }
}

function notificationDedupeKey(n: Notification): string {
  const d = (n.data || {}) as any;
  if (typeof d.dedupeKey === 'string' && d.dedupeKey.trim()) return d.dedupeKey.trim();
  return [
    n.type,
    n.title || '',
    n.message || '',
    d.chatId || '',
    d.scheduleId || '',
    d.taskId || '',
    d.fileUrl || '',
  ].join('|');
}

function toToastVariant(type: Notification['type']) {
  switch (type) {
    case 'success':
      return 'success' as const;
    case 'error':
      return 'error' as const;
    case 'warning':
      return 'warning' as const;
    case 'info':
    default:
      return 'default' as const;
  }
}

function getToastClickHandler(router: ReturnType<typeof useRouter>, n: Notification) {
  const d = (n.data || {}) as any;

  if (d.chatId) {
    const chatId = String(d.chatId);
    return () => router.push(`/dashboard?tab=MainAgent&chatId=${encodeURIComponent(chatId)}`);
  }

  if (d.taskId) {
    // If you have a dedicated task route later, replace this.
    const taskId = String(d.taskId);
    return () => router.push(`/dashboard?tab=Schedules&taskId=${encodeURIComponent(taskId)}`);
  }

  if (d.scheduleId) {
    const scheduleId = String(d.scheduleId);
    return () => router.push(`/dashboard?tab=Schedules&scheduleId=${encodeURIComponent(scheduleId)}`);
  }

  if (d.fileUrl) {
    const fileUrl = String(d.fileUrl);
    return () => window.open(fileUrl, '_blank', 'noopener,noreferrer');
  }

  return undefined;
}

export default function RealtimeToastBridge() {
  const router = useRouter();
  const { notifications } = useSocket();
  const { showToast } = useToast();

  const lastSeenIndexRef = useRef(0);
  const pendingRef = useRef<
    Map<
      string,
      { count: number; last: Notification; timer: ReturnType<typeof setTimeout> | null }
    >
  >(new Map());

  // Cleanup any pending timers on unmount
  useEffect(() => {
    return () => {
      for (const entry of pendingRef.current.values()) {
        if (entry.timer) clearTimeout(entry.timer);
      }
      pendingRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const prev = lastSeenIndexRef.current;
    const next = notifications.length;
    if (next <= prev) {
      lastSeenIndexRef.current = next;
      return;
    }

    const newItems = notifications.slice(prev);
    lastSeenIndexRef.current = next;

    if (isToastDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.debug('[ToastDebug] Socket notifications received', { prev, next, newItems });
    }

    for (const n of newItems) {
      const key = notificationDedupeKey(n);
      const existing = pendingRef.current.get(key);

      if (existing) {
        existing.count += 1;
        existing.last = n;
        if (existing.timer) clearTimeout(existing.timer);
        existing.timer = setTimeout(() => {
          const pending = pendingRef.current.get(key);
          if (!pending) return;
          pendingRef.current.delete(key);

          const toastVariant = toToastVariant(pending.last.type);
          const duration = toastVariant === 'error' ? 5000 : 4000;
          const onClick = getToastClickHandler(router, pending.last);

          const msg =
            pending.count > 1
              ? `${pending.last.message} (+${pending.count - 1} more)`
              : pending.last.message;

          if (isToastDebugEnabled()) {
            // eslint-disable-next-line no-console
            console.debug('[ToastDebug] Emitting debounced toast (socket)', { key, toastVariant, msg, data: pending.last.data });
          }

          showToast({
            title: pending.last.title,
            message: msg,
            variant: toastVariant,
            duration,
            onClick,
          });
        }, TOAST_DEBOUNCE_MS);
      } else {
        const entry = {
          count: 1,
          last: n,
          timer: setTimeout(() => {
            const pending = pendingRef.current.get(key);
            if (!pending) return;
            pendingRef.current.delete(key);

            const toastVariant = toToastVariant(pending.last.type);
            const duration = toastVariant === 'error' ? 5000 : 4000;
            const onClick = getToastClickHandler(router, pending.last);

            if (isToastDebugEnabled()) {
              // eslint-disable-next-line no-console
              console.debug('[ToastDebug] Emitting toast (socket)', { key, toastVariant, message: pending.last.message, data: pending.last.data });
            }

            showToast({
              title: pending.last.title,
              message: pending.last.message,
              variant: toastVariant,
              duration,
              onClick,
            });
          }, TOAST_DEBOUNCE_MS),
        };

        if (isToastDebugEnabled()) {
          // eslint-disable-next-line no-console
          console.debug('[ToastDebug] Queue notification (socket)', { key, notification: n });
        }

        pendingRef.current.set(key, entry);
      }
    }
  }, [notifications, router, showToast]);

  return null;
}


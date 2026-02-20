'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import Toaster, { type ToasterProps, type ToasterRef } from '@/components/ui/toast';

interface ToastContextValue {
  showToast: (props: ToasterProps) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function isToastDebugEnabled() {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem('polaris_toast_debug') === '1';
  } catch {
    return false;
  }
}

export function ToastProvider({
  children,
  defaultPosition = 'bottom-right',
}: {
  children: React.ReactNode;
  defaultPosition?: ToasterProps['position'];
}) {
  const toasterRef = useRef<ToasterRef | null>(null);

  const showToast = useCallback((props: ToasterProps) => {
    if (isToastDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.debug('[ToastDebug] showToast() called', props);
      if (!toasterRef.current) {
        // eslint-disable-next-line no-console
        console.debug('[ToastDebug] toasterRef.current is null (Toaster not mounted yet?)');
      }
    }
    toasterRef.current?.show(props);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  useEffect(() => {
    if (!isToastDebugEnabled()) return;
    // eslint-disable-next-line no-console
    console.debug('[ToastDebug] ToastProvider mounted');
    // One-time sanity test toast to confirm rendering works
    toasterRef.current?.show({
      title: 'Toast debug enabled',
      message: 'If you see this, rendering works. Now reproduce the action.',
      variant: 'default',
      duration: 5000,
    });
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster ref={toasterRef} defaultPosition={defaultPosition} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}


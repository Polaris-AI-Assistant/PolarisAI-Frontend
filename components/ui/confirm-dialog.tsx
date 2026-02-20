'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = React.useRef<(value: boolean) => void>();

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setOptions(opts);
      setOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    setOpen(false);
    setOptions(null);
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    setOpen(false);
    setOptions(null);
  }, []);

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={open} onOpenChange={(o) => !o && handleCancel()}>
        <DialogContent
          className="left-[50%] top-[15%] translate-x-[-50%] translate-y-0 sm:max-w-md bg-[#171717] border-[#404040] text-white"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <DialogTitle className="text-lg font-semibold text-white">
                {options?.title || 'Confirm'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-left text-white/70">
              {options?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-[#404040] bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              {options?.cancelLabel || 'Cancel'}
            </Button>
            <Button
              variant={options?.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              className={
                options?.variant === 'destructive'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-primary hover:bg-primary/90'
              }
            >
              {options?.confirmLabel || 'OK'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmDialogProvider');
  return ctx;
}

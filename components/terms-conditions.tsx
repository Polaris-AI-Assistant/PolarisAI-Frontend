"use client";

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import TermsContent from '@/components/terms-content';

export default function TocDialog() {
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const content = contentRef.current;
    if (!content) return;

    const scrollPercentage =
      content.scrollTop / (content.scrollHeight - content.clientHeight);
    if (scrollPercentage >= 0.99 && !hasReadToBottom) {
      setHasReadToBottom(true);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-white underline hover:text-gray-300 cursor-pointer">
          Terms & Conditions
        </button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[min(640px,80vh)] sm:max-w-lg [&>button:last-child]:top-3.5 bg-neutral-900 border-neutral-700">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b border-neutral-700 px-6 py-4 text-base text-white">
            Terms & Conditions
          </DialogTitle>
          <div
            ref={contentRef}
            onScroll={handleScroll}
            className="overflow-y-auto bg-neutral-900 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-neutral-800 [&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-neutral-500"
          >
            <DialogDescription asChild>
              <TermsContent />
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="border-t border-neutral-700 bg-neutral-900 px-6 py-4 sm:items-center">
          {!hasReadToBottom && (
            <span className="text-gray-500 grow text-xs max-sm:text-center">
              Read all terms before accepting.
            </span>
          )}
          <DialogClose asChild>
            <Button type="button" variant="outline" className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" disabled={!hasReadToBottom} className="bg-white text-black hover:bg-gray-200 disabled:opacity-50">
              I agree
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

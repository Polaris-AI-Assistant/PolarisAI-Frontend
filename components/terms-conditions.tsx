'use client';

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
              <div className="px-6 py-4">
                <div className="[&_strong]:text-white space-y-4 [&_strong]:font-semibold text-gray-300">
                  <p className="text-sm text-gray-500">Last Updated: November 27, 2025</p>
                  
                  <p>
                    Welcome to Polaris AI. By creating an account or using our services, you agree to the following Terms and Conditions. Please read them carefully before continuing.
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p>
                        <strong>1. Acceptance of Terms</strong>
                      </p>
                      <p>
                        By accessing or using Polaris AI, you agree to comply with and be bound by these Terms. If you do not agree, please do not use the service.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p>
                        <strong>2. Description of Service</strong>
                      </p>
                      <p>
                        Polaris AI provides an intelligent productivity and memory assistant that helps users organize information, automate tasks, and access data across supported applications.
                        Our platform connects to third-party apps via secure OAuth integrations.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p>
                        <strong>3. User Responsibilities</strong>
                      </p>
                      <p>You agree that:</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>All information you provide is accurate and lawful.</li>
                        <li>You will not use Polaris AI for harmful, illegal, or unauthorized purposes.</li>
                        <li>You are responsible for maintaining the confidentiality of your account login details.</li>
                        <li>You will comply with all applicable laws when using connected third-party services.</li>
                      </ul>
                    </div>

                    <div className="space-y-1">
                      <p>
                        <strong>4. Third-Party Integrations</strong>
                      </p>
                      <p>
                        Polaris AI may connect with external apps and platforms (e.g., email, calendars, storage apps).
                        By enabling these integrations:
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>You grant us permission to access specific data solely for the purpose of providing requested features.</li>
                        <li>Polaris AI does not store or use any external app data beyond what is required to fulfill your requests.</li>
                        <li>Each third-party service is governed by its own terms and privacy policies.</li>
                      </ul>
                    </div>

                    <div className="space-y-1">
                      <p>
                        <strong>5. Data Usage & Privacy</strong>
                      </p>
                      <p>Your privacy is important to us.</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>We only access and process the data necessary to operate the service.</li>
                        <li>We never sell user data.</li>
                        <li>All data handling follows industry-standard security practices.</li>
                        <li>For full details, please review our Privacy Policy.</li>
                      </ul>
                    </div>

                    <div className="space-y-1">
                      <p>
                        <strong>6. Intellectual Property</strong>
                      </p>
                      <p>
                        All content, branding, and technology of Polaris AI are protected by copyright, trademark, and intellectual property laws.
                        You may not copy, modify, distribute, or reverse-engineer any part of the platform.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p>
                        <strong>7. Service Changes & Availability</strong>
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>We may update, modify, or temporarily suspend features from time to time.</li>
                        <li>We are not liable for service interruptions caused by maintenance, upgrades, or third-party issues.</li>
                      </ul>
                    </div>

                    <div className="space-y-1">
                      <p>
                        <strong>8. Termination</strong>
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>We reserve the right to suspend or terminate accounts that violate these Terms or engage in harmful activities.</li>
                        <li>You may stop using the service at any time.</li>
                      </ul>
                    </div>

                    <div className="space-y-1">
                      <p>
                        <strong>9. Limitation of Liability</strong>
                      </p>
                      <p>To the maximum extent permitted by law:</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Polaris AI is provided "as is" and "as available".</li>
                        <li>We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.</li>
                        <li>We do not guarantee accuracy or uninterrupted availability.</li>
                      </ul>
                    </div>

                    <div className="space-y-1">
                      <p>
                        <strong>10. Governing Law</strong>
                      </p>
                      <p>
                        These Terms are governed by the laws of your jurisdiction unless otherwise specified.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p>
                        <strong>11. Contact</strong>
                      </p>
                      <p>
                        For questions about these Terms, contact us at:{' '}
                        <a href="mailto:support@polarisai.app" className="text-primary underline">
                          support@polarisai.app
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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

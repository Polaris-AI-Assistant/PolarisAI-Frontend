'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { CallbackWrapper } from '@/components/ui/callback-wrapper';

function GitHubCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      if (!isAuthenticated()) {
        router.replace('/auth/signin');
        return;
      }

      const success = searchParams.get('success');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        const msg = errorDescription || error;
        router.replace(`/dashboard?connectError=github&connectErrorMsg=${encodeURIComponent(msg)}`);
        return;
      }

      if (success === 'true') {
        localStorage.setItem('github_connected', 'true');
        router.replace('/dashboard?connectSuccess=github');
        return;
      }

      router.replace(`/dashboard?connectError=github&connectErrorMsg=${encodeURIComponent('GitHub connection failed for unknown reason')}`);
    } catch (err) {
      console.error('GitHub callback error:', err);
      router.replace(`/dashboard?connectError=github&connectErrorMsg=${encodeURIComponent('An unexpected error occurred')}`);
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/30 border-t-white"></div>
    </div>
  );
}

export default function GitHubCallback() {
  return (
    <CallbackWrapper>
      <GitHubCallbackContent />
    </CallbackWrapper>
  );
}
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CallbackWrapper } from '@/components/ui/callback-wrapper';

function MeetCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      const msg = errorDescription || error;
      router.replace(`/dashboard?connectError=meet&connectErrorMsg=${encodeURIComponent(msg)}`);
      return;
    }

    if (success === 'true') {
      localStorage.setItem('meet_connected', 'true');
      router.replace('/dashboard?connectSuccess=meet');
      return;
    }

    router.replace(`/dashboard?connectError=meet&connectErrorMsg=${encodeURIComponent('Unexpected response from Meet OAuth')}`);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/30 border-t-white"></div>
    </div>
  );
}

export default function MeetCallback() {
  return (
    <CallbackWrapper>
      <MeetCallbackContent />
    </CallbackWrapper>
  );
}

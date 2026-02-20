'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CallbackWrapper } from '@/components/ui/callback-wrapper';

function CalendarCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      const msg = errorDescription || error;
      router.replace(`/dashboard?connectError=calendar&connectErrorMsg=${encodeURIComponent(msg)}`);
      return;
    }

    if (success === 'true') {
      localStorage.setItem('calendar_connected', 'true');
      router.replace('/dashboard?connectSuccess=calendar');
      return;
    }

    router.replace(`/dashboard?connectError=calendar&connectErrorMsg=${encodeURIComponent('Unexpected response from Calendar OAuth')}`);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/30 border-t-white"></div>
    </div>
  );
}

export default function CalendarCallback() {
  return (
    <CallbackWrapper>
      <CalendarCallbackContent />
    </CallbackWrapper>
  );
}

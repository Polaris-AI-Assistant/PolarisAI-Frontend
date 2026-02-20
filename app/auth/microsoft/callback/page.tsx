'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function MicrosoftCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const app = searchParams.get('app');

    if (error) {
      const msg = errorDescription || error;
      const appKey = app ? `microsoft_${app}` : 'microsoft';
      router.replace(`/dashboard?connectError=${appKey}&connectErrorMsg=${encodeURIComponent(msg)}`);
      return;
    }

    if (success === 'true') {
      localStorage.setItem('microsoft_connected', 'true');
      const appKey = app ? `microsoft_${app}` : 'microsoft';
      router.replace(`/dashboard?connectSuccess=${appKey}`);
      return;
    }

    router.replace(`/dashboard?connectError=microsoft&connectErrorMsg=${encodeURIComponent('Unexpected response from Microsoft OAuth')}`);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/30 border-t-white"></div>
    </div>
  );
}

export default function MicrosoftCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      <MicrosoftCallbackContent />
    </Suspense>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MainAgentPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard with MainAgent tab
    router.replace('/dashboard?tab=MainAgent');
  }, [router]);

  return (
    <div className="flex h-screen bg-black items-center justify-center">
      <div className="text-white">Redirecting to Dashboard...</div>
    </div>
  );
}

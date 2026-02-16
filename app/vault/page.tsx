'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Vault is now a dashboard tab — redirect there
export default function VaultRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);
  return null;
}

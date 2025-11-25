'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuthData } from '../../../lib/auth';

export default function ClearAuthPage() {
  const [cleared, setCleared] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Clear all auth data
    clearAuthData();
    
    // Clear all cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    setCleared(true);
  }, []);

  const handleRedirect = () => {
    router.push('/');
  };

  if (!cleared) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Clearing authentication data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900 flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="mb-6">
          <svg 
            className="mx-auto h-20 w-20 text-green-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">
          Authentication Data Cleared!
        </h1>
        
        <p className="text-gray-300 mb-8">
          All authentication tokens and user data have been cleared from your browser. 
          You can now start fresh with a clean session.
        </p>
        
        <button
          onClick={handleRedirect}
          className="px-8 py-3 rounded-lg font-semibold bg-white text-black hover:bg-gray-200 transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}

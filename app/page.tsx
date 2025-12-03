'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getAuthToken, getRefreshToken } from '../lib/auth';
import Hero from './landing_page/hero';
import { Footer } from "@/components/ui/footer";
import IntegrationsSection from './landing_page/integrations';

const syncAuthToCookies = () => {
  const authToken = getAuthToken();
  const refreshToken = getRefreshToken();
  
  if (authToken) {
    const cookieOptions = `path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    document.cookie = `auth_token=${authToken}; ${cookieOptions}`;
    if (refreshToken) {
      document.cookie = `refresh_token=${refreshToken}; ${cookieOptions}`;
    }
  }
};

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check authentication on client side
    const checkAuth = () => {
      if (isAuthenticated()) {
        // Sync auth tokens to cookies for middleware
        syncAuthToCookies();
        router.push('/dashboard');
      } else {
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, [router]);         

  const handleSignIn = () => {
    router.push('/signin');
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  // Show loading state while checking auth to prevent flash
  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <>
      <Hero />
      <div className="bg-black w-full">
        <IntegrationsSection/>
        <Footer />
      </div>
    </>
  );
}






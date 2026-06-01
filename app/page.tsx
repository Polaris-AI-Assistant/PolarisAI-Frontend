'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getAuthToken, getRefreshToken } from '../lib/auth';
import Hero from './landing_page/hero';
import { Footer } from "@/components/ui/footer";
import IntegrationsSection from './landing_page/integrations';
import BentoGridShowcaseDemo from './landing_page/bentogrid_demo';
import PricingSection from './landing_page/PricingSection';
import CTASection from './landing_page/CTASection';
import Pricing from '@/components/ui/demo-pricing';
import PolarisImpactSection from './landing_page/impact';
import LongTermMemorySection from './landing_page/longterm_memory';
import SecurityTrustSection from './landing_page/security_trust';
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

// Handle OAuth tokens from URL hash (for Google OAuth redirect)
const handleOAuthTokensFromHash = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token')) return false;
  
  try {
    const hashParams = new URLSearchParams(hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const expiresIn = hashParams.get('expires_in');
    
    if (!accessToken || !refreshToken) return false;
    
    console.log('OAuth tokens found in URL hash, processing...');
    
    // Store tokens in localStorage
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    
    // Set cookies for middleware
    const expiresInSeconds = expiresIn ? parseInt(expiresIn) : 60 * 60 * 24 * 30;
    const cookieOptions = `path=/; max-age=${expiresInSeconds}; SameSite=Lax`;
    document.cookie = `auth_token=${accessToken}; ${cookieOptions}`;
    document.cookie = `refresh_token=${refreshToken}; ${cookieOptions}`;
    
    // Try to get user data
    try {
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        localStorage.setItem('user_data', JSON.stringify(userData.user));
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
    
    // Clear the hash from URL
    window.history.replaceState(null, '', window.location.pathname);
    
    return true;
  } catch (err) {
    console.error('Error processing OAuth tokens:', err);
    return false;
  }
};

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check for OAuth tokens in URL hash first (Google OAuth redirect)
    const checkAuthAndTokens = async () => {
      // First, check if there are OAuth tokens in the URL hash
      const hasOAuthTokens = await handleOAuthTokensFromHash();
      
      if (hasOAuthTokens) {
        // OAuth login successful — redirect to dashboard
        router.push('/dashboard');
        return;
      }
      
      // Otherwise, check if already authenticated
      if (isAuthenticated()) {
        // Sync auth tokens to cookies for middleware
        syncAuthToCookies();
        router.push('/dashboard');
      } else {
        setIsChecking(false);
      }
    };
    
    checkAuthAndTokens();
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
       
        <LongTermMemorySection />
        <SecurityTrustSection/>
         <IntegrationsSection/>
        <BentoGridShowcaseDemo/>
        <PolarisImpactSection/>
        <PricingSection/>
        <CTASection/>
    
        <Footer />
      </div>
    </>
  );
}






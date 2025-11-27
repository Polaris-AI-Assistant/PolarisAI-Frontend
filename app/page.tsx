'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../lib/auth';

import Hero from './landing_page/hero';
import { Footer } from "@/components/ui/footer";
import IntegrationsSection from './landing_page/integrations';
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard if authenticated
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSignIn = () => {
    router.push('/auth/signin');
  };

  const handleSignUp = () => {
    router.push('/auth/signup');
  };

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






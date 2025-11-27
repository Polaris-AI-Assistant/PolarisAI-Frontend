"use client";

import { SignInPage, Testimonial } from "../landing_page/signin";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../lib/auth';

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/57.jpg",
    name: "Sarah Chen",
    handle: "@sarahdigital",
    text: "Polaris AI has transformed how I manage my workflow. It's like having a personal assistant that actually understands me!"
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/64.jpg",
    name: "Marcus Johnson",
    handle: "@marcustech",
    text: "The integration with all my apps is seamless. Polaris AI keeps everything connected and organized."
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "David Martinez",
    handle: "@davidcreates",
    text: "I've tried many AI assistants, but Polaris AI stands out with its context awareness and reliability."
  },
];

const SignInPageDemo = () => {
  const router = useRouter();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const rememberMe = formData.get('rememberMe') === 'on';

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      // Store session data
      if (data.session) {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('auth_token', data.session.access_token);
        storage.setItem('refresh_token', data.session.refresh_token);
        storage.setItem('user_data', JSON.stringify(data.user));

        // Set cookies for middleware (so server can see auth)
        const cookieOptions = [
          `path=/`,
          rememberMe ? `max-age=${60 * 60 * 24 * 30}` : '', // 30 days if rememberMe
          'SameSite=Lax',
        ].filter(Boolean).join('; ');
        document.cookie = `auth_token=${data.session.access_token}; ${cookieOptions}`;
        document.cookie = `refresh_token=${data.session.refresh_token}; ${cookieOptions}`;
      }

      // Redirect to the intended page or dashboard
      const redirectTo = searchParams?.get('redirect') || '/dashboard';
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please try again.');
      alert(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      
      // Request OAuth URL from backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/google`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate Google sign-in');
      }

      // Redirect to Google OAuth URL
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No OAuth URL received');
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      alert(err.message || 'Failed to sign in with Google. Please try again.');
      setIsLoading(false);
    }
  };
  
  const handleResetPassword = () => {
    router.push('/auth/reset-password');
  }

  const handleCreateAccount = () => {
    router.push('/signup');
  }

  return (
    <div className="bg-black text-white">
      <SignInPage
        title={<span className="font-light text-white tracking-tighter">Welcome to Polaris AI</span>}
        description="Sign in to access your AI-powered workspace"
        heroImageSrc="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=2160&q=80"
        testimonials={sampleTestimonials}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
      />
    </div>
  );
};

export default SignInPageDemo;
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../lib/auth';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-6xl font-bold text-white mb-4">
          Welcome to FYP
        </h1>
        <p className="text-xl text-gray-300 mb-12">
          Your intelligent assistant for managing emails and GitHub
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleSignIn}
            className="w-full sm:w-auto px-8 py-3 rounded-lg font-semibold bg-white text-black hover:bg-gray-200 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={handleSignUp}
            className="w-full sm:w-auto px-8 py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Sign Up
          </button>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="bg-gray-800/50 p-6 rounded-lg backdrop-blur-sm">
            <div className="text-3xl mb-3">📧</div>
            <h3 className="text-lg font-semibold text-white mb-2">Gmail Integration</h3>
            <p className="text-gray-400 text-sm">Connect your Gmail and manage emails effortlessly</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-lg backdrop-blur-sm">
            <div className="text-3xl mb-3">💻</div>
            <h3 className="text-lg font-semibold text-white mb-2">GitHub Access</h3>
            <p className="text-gray-400 text-sm">Manage your repositories and projects</p>
          </div>
        </div>
      </div>
    </div>
  );
}

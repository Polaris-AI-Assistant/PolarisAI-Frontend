'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { CallbackWrapper } from '@/components/ui/callback-wrapper';

function GitHubCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Processing GitHub connection...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if user is authenticated
        if (!isAuthenticated()) {
          setStatus('error');
          setMessage('Authentication required. Please sign in first.');
          setTimeout(() => router.push('/auth/signin'), 3000);
          return;
        }

        const success = searchParams.get('success');
        const username = searchParams.get('username');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle OAuth errors
        if (error) {
          setStatus('error');
          setMessage(`GitHub OAuth error: ${errorDescription || error}`);
          setTimeout(() => router.push('/dashboard'), 5000);
          return;
        }

        // Check if we have success
        if (success === 'true') {
          setStatus('success');
          setMessage(`GitHub connected successfully! ${username ? `Connected as: ${username}` : ''}`);
          
          // Redirect to dashboard after success
          setTimeout(() => router.push('/dashboard'), 3000);
          return;
        }

        // If we get here, something went wrong
        setStatus('error');
        setMessage('GitHub connection failed for unknown reason');
        setTimeout(() => router.push('/dashboard'), 5000);

      } catch (error) {
        console.error('GitHub callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during GitHub connection');
        setTimeout(() => router.push('/dashboard'), 5000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* GitHub Logo */}
          <div className="w-16 h-16 mx-auto mb-6 bg-white rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </div>

          {/* Status Content */}
          {status === 'loading' && (
            <>
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-white mb-2">Connecting GitHub</h2>
              <p className="text-gray-400">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-green-400 mb-2">Success!</h2>
              <p className="text-gray-300 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-400 mb-2">Connection Failed</h2>
              <p className="text-gray-300 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
            </>
          )}

          {/* Manual Navigation */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GitHubCallback() {
  return (
    <CallbackWrapper>
      <GitHubCallbackContent />
    </CallbackWrapper>
  );
}
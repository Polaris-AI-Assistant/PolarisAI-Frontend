'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CallbackWrapper } from '@/components/ui/callback-wrapper';

function SheetsCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Google Sheets authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      const success = searchParams.get('success');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const encodedEmail = searchParams.get('email');
      
      // Decode the email parameter
      const email = encodedEmail ? decodeURIComponent(encodedEmail) : null;
      
      console.log('Sheets callback params:', { success, error, errorDescription, email });

      if (error) {
        setStatus('error');
        setMessage(`Authentication failed: ${errorDescription || error}`);
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
        return;
      }

      if (success === 'true') {
        setStatus('success');
        setMessage(`Google Sheets connected successfully!${email ? ` (${email})` : ''} You can now access your spreadsheets from the dashboard.`);
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
        return;
      }

      // If we get here, something unexpected happened
      setStatus('error');
      setMessage('Unexpected response from Sheets OAuth. Please try again.');
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-[#171717] p-8 rounded-lg max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-white mb-2">Connecting Google Sheets</h2>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-green-400 mb-2">Success!</h2>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
            </>
          )}
          
          <p className="text-gray-300">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default function SheetsCallback() {
  return (
    <CallbackWrapper>
      <SheetsCallbackContent />
    </CallbackWrapper>
  );
}

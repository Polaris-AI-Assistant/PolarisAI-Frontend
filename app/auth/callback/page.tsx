'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for tokens in URL hash (Supabase implicit flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const expiresIn = hashParams.get('expires_in');
        const tokenType = hashParams.get('token_type');
        
        // Check for error in hash
        const errorHash = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        
        // Check for error in query params
        const queryParams = new URLSearchParams(window.location.search);
        const errorQuery = queryParams.get('error');
        const errorDescriptionQuery = queryParams.get('error_description');

        if (errorHash || errorQuery) {
          const errorMsg = errorDescription || errorDescriptionQuery || errorHash || errorQuery;
          console.error('OAuth error:', errorMsg);
          setError(`Authentication failed: ${errorMsg}`);
          setTimeout(() => router.push('/signin'), 2000);
          return;
        }

        // If we have access token directly in hash (implicit flow)
        if (accessToken && refreshToken) {
          console.log('Using implicit flow tokens from URL hash');
          
          // Store session data
          localStorage.setItem('auth_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);

          // Set cookies for middleware
          const expiresInSeconds = expiresIn ? parseInt(expiresIn) : 60 * 60 * 24 * 30;
          const cookieOptions = [
            `path=/`,
            `max-age=${expiresInSeconds}`,
            'SameSite=Lax',
          ].join('; ');
          
          document.cookie = `auth_token=${accessToken}; ${cookieOptions}`;
          document.cookie = `refresh_token=${refreshToken}; ${cookieOptions}`;

          // Get user data using the access token
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

          // Redirect to dashboard
          router.push('/dashboard');
          return;
        }

        // Check for authorization code (PKCE flow)
        const code = queryParams.get('code');
        
        if (!code && !accessToken) {
          console.error('No authorization code or access token received');
          setError('Authentication failed: No authorization data received');
          setTimeout(() => router.push('/signin'), 2000);
          return;
        }

        if (code) {
          console.log('Using PKCE flow with authorization code');
          
          // Exchange the code for a session via our backend
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/callback?code=${code}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to authenticate');
          }

          // Store session data
          if (data.session) {
            localStorage.setItem('auth_token', data.session.access_token);
            localStorage.setItem('refresh_token', data.session.refresh_token);
            localStorage.setItem('user_data', JSON.stringify(data.user));

            // Set cookies for middleware
            const cookieOptions = [
              `path=/`,
              `max-age=${60 * 60 * 24 * 30}`, // 30 days
              'SameSite=Lax',
            ].join('; ');
            
            document.cookie = `auth_token=${data.session.access_token}; ${cookieOptions}`;
            document.cookie = `refresh_token=${data.session.refresh_token}; ${cookieOptions}`;
          }

          // Redirect to dashboard
          router.push('/dashboard');
        }
      } catch (err: any) {
        console.error('Callback error:', err);
        setError(err.message || 'Authentication failed. Please try again.');
        setTimeout(() => router.push('/signin'), 2000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500 mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-400 text-lg">{error}</p>
            <p className="text-gray-400 text-sm mt-2">Redirecting to sign in...</p>
          </>
        ) : (
          <>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
            <p className="text-white text-lg">Completing authentication...</p>
            <p className="text-gray-400 text-sm mt-2">Please wait while we sign you in</p>
          </>
        )}
      </div>
    </div>
  );
}

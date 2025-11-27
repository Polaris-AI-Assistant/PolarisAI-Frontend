'use client'

import { SignUpPage } from '../landing_page/signup';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignUpPageWrapper() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [signupData, setSignupData] = useState<any>(null);

  // Step 1-2: Send OTP (after user enters name, email, and password)
  const handleSendOtp = async (data: { fullName: string; email: string; password: string; confirmPassword: string }) => {
    try {
      setIsLoading(true);

      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        alert('Passwords do not match');
        setIsLoading(false);
        return { success: false, error: 'Passwords do not match' };
      }

      // Call API to send OTP
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/signup/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send OTP');
      }

      // Store data for later use
      setSignupData(data);
      setIsLoading(false);
      
      return { success: true, data: result };
    } catch (err: any) {
      console.error('Send OTP error:', err);
      alert(err.message || 'Failed to send OTP. Please try again.');
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Step 3: Verify OTP and complete signup
  const handleVerifyOtp = async (verificationCode: string, metadata: any) => {
    try {
      setIsLoading(true);

      if (!signupData) {
        throw new Error('Signup data not found');
      }

      // Call API to verify OTP
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/signup/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: signupData.email,
          token: verificationCode,
          metadata: {
            fullName: signupData.fullName,
            useCases: metadata.useCases || [],
            userType: metadata.userType || null,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Invalid OTP');
      }

      // Store session data
      if (result.session) {
        localStorage.setItem('auth_token', result.session.access_token);
        localStorage.setItem('refresh_token', result.session.refresh_token);
        localStorage.setItem('user_data', JSON.stringify(result.user));

        // Set cookies for middleware
        const expiresInSeconds = result.session.expires_in || 60 * 60 * 24 * 30;
        const cookieOptions = [
          `path=/`,
          `max-age=${expiresInSeconds}`,
          'SameSite=Lax',
        ].join('; ');
        
        document.cookie = `auth_token=${result.session.access_token}; ${cookieOptions}`;
        document.cookie = `refresh_token=${result.session.refresh_token}; ${cookieOptions}`;
      }

      setIsLoading(false);
      
      return { success: true, data: result };
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      alert(err.message || 'Failed to verify OTP. Please try again.');
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    try {
      if (!signupData) {
        throw new Error('Signup data not found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/signup/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: signupData.email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend OTP');
      }

      alert('OTP resent successfully!');
      return { success: true };
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      alert(err.message || 'Failed to resend OTP. Please try again.');
      return { success: false, error: err.message };
    }
  };

  const handleGoogleSignUp = async () => {
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
        throw new Error(data.error || 'Failed to initiate Google sign-up');
      }

      // Redirect to Google OAuth URL
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No OAuth URL received');
      }
    } catch (err: any) {
      console.error('Google sign-up error:', err);
      alert(err.message || 'Failed to sign up with Google. Please try again.');
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/signin');
  };

  const handleCompleteSignup = () => {
    router.push('/dashboard');
  };

  return (
    <SignUpPage
      onSendOtp={handleSendOtp}
      onVerifyOtp={handleVerifyOtp}
      onResendOtp={handleResendOtp}
      onGoogleSignUp={handleGoogleSignUp}
      onLogin={handleLogin}
      onComplete={handleCompleteSignup}
      isLoading={isLoading}
    />
  );
}

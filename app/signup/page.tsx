'use client'

import { SignUpPage } from '../landing_page/signup';
import { useRouter } from 'next/navigation';

export default function SignUpPageWrapper() {
  const router = useRouter();

  const handleSignUp = async (data: any) => {
    // TODO: Implement signup API call
    console.log('Sign up data:', data);
    // router.push('/dashboard');
  };

  const handleGoogleSignUp = () => {
    // TODO: Implement Google OAuth signup
    console.log('Google signup');
  };

  const handleLogin = () => {
    router.push('/landing_page/signin');
  };

  return (
    <SignUpPage
      onSignUp={handleSignUp}
      onGoogleSignUp={handleGoogleSignUp}
      onLogin={handleLogin}
    />
  );
}

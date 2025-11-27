'use client'
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import IntegrationsSection from './int_signin_demo';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C37.023 33.804 42 28.715 42 23.086c0-1.341-.138-2.65-.389-3.003z" />
    </svg>
);


// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border-2 border-neutral-700/50 bg-neutral-900/30 backdrop-blur-sm transition-all duration-200 focus-within:border-blue-500/70 focus-within:bg-blue-500/5 focus-within:shadow-lg focus-within:shadow-blue-500/20">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-neutral-900/60 backdrop-blur-xl border border-neutral-700 p-5 w-64`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium text-white">{testimonial.name}</p>
      <p className="text-gray-400">{testimonial.handle}</p>
      <p className="mt-1 text-gray-300">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-white tracking-tighter">Welcome</span>,
  description = "Access your account and continue your journey with us",
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw] bg-black">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8 bg-black relative overflow-hidden">
        {/* Subtle gradient accents */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="flex flex-col gap-6">
            {/* Welcome badge */}
            <div className="inline-flex w-fit items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
              <span className="text-xs font-medium text-blue-300">Welcome back</span>
            </div>
            
            <h1 className="animate-element animate-delay-100 text-5xl md:text-5xl font-bold leading-tight bg-gradient-to-br from-white via-white to-gray-400 bg-clip-text text-transparent">Sign In</h1>
            <p className="animate-element animate-delay-200 text-gray-400 text-base">Enter your credentials to access your Polaris AI workspace</p>

            <form className="space-y-5 mt-8" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-semibold text-gray-300 mb-2 block">Email Address</label>
                <GlassInputWrapper>
                  <input name="email" type="email" placeholder="name@company.com" className="w-full bg-transparent text-sm text-white placeholder:text-gray-500 p-4 rounded-2xl focus:outline-none" />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-semibold text-gray-300 mb-2 block">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full bg-transparent text-sm text-white placeholder:text-gray-500 p-4 pr-12 rounded-2xl focus:outline-none" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center group">
                      {showPassword ? <EyeOff className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" /> : <Eye className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" name="rememberMe" className="w-4 h-4 rounded border-gray-600 bg-neutral-800 text-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-0" />
                  <span className="text-gray-300 group-hover:text-white transition-colors">Keep me signed in</span>
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); onResetPassword?.(); }} className="font-medium text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</a>
              </div>

              <button type="submit" className="animate-element animate-delay-600 w-full rounded-2xl bg-white py-4 font-semibold text-black hover:bg-gray-100 hover:shadow-lg hover:shadow-white/20 hover:scale-[1.02] transition-all duration-200">
                <span className="relative z-10">Sign In to Polaris</span>
              </button>
            </form>

            <div className="animate-element animate-delay-700 relative flex items-center justify-center my-6">
              <span className="w-full border-t border-neutral-800"></span>
              <span className="px-4 text-xs font-medium text-gray-500 bg-black absolute uppercase tracking-wider">Or</span>
            </div>

            <button onClick={onGoogleSignIn} className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border-2 border-neutral-700/50 rounded-2xl py-4 hover:border-neutral-600 hover:bg-neutral-900/50 transition-all group">
                <GoogleIcon />
                <span className="text-white font-medium group-hover:text-blue-400 transition-colors">Continue with Google</span>
            </button>

            <p className="animate-element animate-delay-900 text-center text-sm text-gray-400 mt-6">
              Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); onCreateAccount?.(); }} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Sign up</a>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: Beautiful integration visualization */}
      <section className="hidden md:flex flex-1 relative overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-black items-end justify-center pb-12">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Integration component - scaled larger */}
        <div className="relative z-10 w-full scale-110">
          <IntegrationsSection />
        </div>
      </section>
    </div>
  );
};  
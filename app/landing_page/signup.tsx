'use client'
import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Check, Mail, User, Shield, Sparkles } from 'lucide-react';
import SignUpIllustration from './signup_illustration';
import TocDialog from '@/components/terms-conditions';

// --- HELPER COMPONENTS ---

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C37.023 33.804 42 28.715 42 23.086c0-1.341-.138-2.65-.389-3.003z" />
    </svg>
);

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border-2 border-neutral-700/50 bg-neutral-900/30 backdrop-blur-sm transition-all duration-200 focus-within:border-white/50 focus-within:bg-white/5 focus-within:shadow-lg focus-within:shadow-white/10">
    {children}
  </div>
);

const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div className="flex items-center gap-2 mb-8">
    {Array.from({ length: totalSteps }).map((_, index) => (
      <div
        key={index}
        className={`h-1.5 rounded-full transition-all duration-300 ${
          index < currentStep
            ? 'bg-white w-12'
            : index === currentStep
            ? 'bg-white w-16'
            : 'bg-neutral-700 w-12'
        }`}
      />
    ))}
  </div>
);

interface SignUpPageProps {
  onSendOtp?: (data: { fullName: string; email: string; password: string; confirmPassword: string }) => Promise<{ success: boolean; error?: string; data?: any }>;
  onVerifyOtp?: (verificationCode: string, metadata: any) => Promise<{ success: boolean; error?: string; data?: any }>;
  onResendOtp?: () => Promise<{ success: boolean; error?: string }>;
  onGoogleSignUp?: () => void;
  onLogin?: () => void;
  onComplete?: () => void;
  isLoading?: boolean;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({
  onSendOtp,
  onVerifyOtp,
  onResendOtp,
  onGoogleSignUp,
  onLogin,
  onComplete,
  isLoading = false,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    verificationCode: '',
    useCases: [] as string[],
    userType: '',
    termsAccepted: false,
    privacyAccepted: false,
    dataConsentAccepted: false,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleUseCase = (useCase: string) => {
    setFormData(prev => ({
      ...prev,
      useCases: prev.useCases.includes(useCase)
        ? prev.useCases.filter(uc => uc !== useCase)
        : [...prev.useCases, useCase]
    }));
  };

  // Step 1: Basic Account Details (Name & Email only)
  const Step1 = React.useMemo(() => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">Create Account</h2>
        <p className="text-gray-400">Join Polaris and supercharge your productivity</p>
      </div>

      <div className="space-y-4 mt-8">
        <div>
          <label className="text-sm font-semibold text-gray-300 mb-2 block">Full Name</label>
          <GlassInputWrapper>
            <input
              type="text"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="w-full bg-transparent text-sm text-white placeholder:text-gray-500 p-4 rounded-2xl focus:outline-none"
            />
          </GlassInputWrapper>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-300 mb-2 block">Email Address</label>
          <GlassInputWrapper>
            <input
              type="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full bg-transparent text-sm text-white placeholder:text-gray-500 p-4 rounded-2xl focus:outline-none"
            />
          </GlassInputWrapper>
        </div>
      </div>

      <button
        onClick={() => setCurrentStep(1)}
        disabled={!formData.fullName || !formData.email}
        className="w-full rounded-2xl bg-white py-4 font-semibold text-black hover:bg-gray-100 hover:shadow-lg hover:shadow-white/20 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        Continue
        <ArrowRight className="w-5 h-5" />
      </button>

      <div className="relative flex items-center justify-center my-6">
        <span className="w-full border-t border-neutral-800"></span>
        <span className="px-4 text-xs font-medium text-gray-500 bg-black absolute uppercase tracking-wider">Or</span>
      </div>

      <button
        onClick={onGoogleSignUp}
        className="w-full flex items-center justify-center gap-3 border-2 border-neutral-700/50 rounded-2xl py-4 hover:border-neutral-600 hover:bg-neutral-900/50 transition-all group"
      >
        <GoogleIcon />
        <span className="text-white font-medium group-hover:text-white transition-colors">Continue with Google</span>
      </button>

      <p className="text-center text-sm text-gray-400 mt-6">
        Already have an account?{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); onLogin?.(); }} className="text-white hover:text-gray-300 font-semibold transition-colors">
          Log in
        </a>
      </p>
    </div>
  ), [formData.fullName, formData.email, onGoogleSignUp, onLogin]);

  // Step 2: Password Setup
  const Step2 = React.useMemo(() => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-4xl md:text-4xl font-bold text-white mb-3">Create Password</h2>
        <p className="text-gray-400">Secure your account with a strong password</p>
      </div>

      <div className="space-y-4 mt-8">
        <div>
          <label className="text-sm font-semibold text-gray-300 mb-2 block">Password</label>
          <GlassInputWrapper>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder:text-gray-500 p-4 pr-12 rounded-2xl focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center group"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                )}
              </button>
            </div>
          </GlassInputWrapper>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-300 mb-2 block">Confirm Password</label>
          <GlassInputWrapper>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder:text-gray-500 p-4 pr-12 rounded-2xl focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-3 flex items-center group"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                )}
              </button>
            </div>
          </GlassInputWrapper>
        </div>
      </div>

      <button
        onClick={async () => {
          if (!formData.password || !formData.confirmPassword) {
            alert('Please enter both password fields');
            return;
          }
          if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match');
            return;
          }
          
          // Send OTP
          if (onSendOtp) {
            const result = await onSendOtp({
              fullName: formData.fullName,
              email: formData.email,
              password: formData.password,
              confirmPassword: formData.confirmPassword,
            });
            
            if (result.success) {
              setCurrentStep(2); // Move to OTP verification step
            }
          } else {
            setCurrentStep(2);
          }
        }}
        disabled={!formData.password || !formData.confirmPassword || isLoading}
        className="w-full rounded-2xl bg-white py-4 font-semibold text-black hover:bg-gray-100 hover:shadow-lg hover:shadow-white/20 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isLoading ? (
          <>
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
            Sending OTP...
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  ), [formData.password, formData.confirmPassword, isLoading, onSendOtp, formData.fullName, formData.email, showPassword, showConfirmPassword]);

  // Step 3: Email Verification
  const Step3 = React.useMemo(() => (
    <div className="space-y-6">
      <div className="flex items-center justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
          <Mail className="w-8 h-8 text-white" />
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-4xl md:text-4xl font-bold text-white mb-3">Verify Your Email</h2>
        <p className="text-gray-400">We've sent a 6-digit verification code to</p>
        <p className="text-white font-semibold mt-1">{formData.email}</p>
      </div>

      <div className="mt-8">
        <label className="text-sm font-semibold text-gray-300 mb-2 block text-center">Enter Verification Code</label>
        <GlassInputWrapper>
          <input
            type="text"
            placeholder="000000"
            maxLength={6}
            value={formData.verificationCode}
            onChange={(e) => handleInputChange('verificationCode', e.target.value)}
            className="w-full bg-transparent text-2xl text-white placeholder:text-gray-500 p-4 rounded-2xl focus:outline-none text-center tracking-widest"
          />
        </GlassInputWrapper>
      </div>

      <div className="flex items-center justify-center gap-6 text-sm">
        <button 
          onClick={async () => {
            if (onResendOtp) {
              await onResendOtp();
            }
          }}
          disabled={isLoading}
          className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          Resend Code
        </button>
        <span className="text-gray-600">•</span>
        <button 
          onClick={() => setCurrentStep(0)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          Change Email
        </button>
      </div>

      <button
        onClick={async () => {
          if (!formData.verificationCode || formData.verificationCode.length !== 6) {
            alert('Please enter a valid 6-digit code');
            return;
          }
          
          // Verify OTP
          if (onVerifyOtp) {
            const result = await onVerifyOtp(formData.verificationCode, {
              useCases: formData.useCases,
              userType: formData.userType,
            });
            
            if (result.success) {
              setCurrentStep(3); // Move to use cases step
            }
          } else {
            setCurrentStep(3);
          }
        }}
        disabled={!formData.verificationCode || formData.verificationCode.length !== 6 || isLoading}
        className="w-full rounded-2xl bg-white py-4 font-semibold text-black hover:bg-gray-100 hover:shadow-lg hover:shadow-white/20 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isLoading ? (
          <>
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
            Verifying...
          </>
        ) : (
          <>
            Verify & Continue
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  ), [formData.verificationCode, formData.email, isLoading, onVerifyOtp, onResendOtp, formData.useCases, formData.userType]);

  // Step 4: Use Cases (First Personalization Question)
  const Step4 = React.useMemo(() => {
    const useCases = [
      'Manage tasks & projects',
      'Personal productivity',
      'Remembering important things across apps',
      'Work organization',
      'Notes & knowledge management',
      'Research + learning',
    ];

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl md:text-3xl font-bold text-white mb-3">What will you mostly use Polaris for?</h2>
          <p className="text-gray-400">Select all that apply</p>
        </div>

        <div className="grid grid-cols-1 gap-2 mt-8">
          {useCases.map((useCase) => (
            <button
              key={useCase}
              onClick={() => toggleUseCase(useCase)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                formData.useCases.includes(useCase)
                  ? 'border-white bg-white/10 text-white'
                  : 'border-neutral-700/50 bg-neutral-900/30 text-gray-300 hover:border-neutral-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{useCase}</span>
                {formData.useCases.includes(useCase) && (
                  <Check className="w-5 h-5 text-white" />
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentStep(4)}
          disabled={formData.useCases.length === 0}
          className="w-full rounded-2xl bg-white py-4 font-semibold text-black hover:bg-gray-100 hover:shadow-lg hover:shadow-white/20 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }, [formData.useCases, toggleUseCase]);

  // Step 5: User Type (Second Personalization Question)
  const Step5 = React.useMemo(() => {
    const userTypes = [
      { value: 'student', label: 'Student', icon: '🎓' },
      { value: 'professional', label: 'Professional', icon: '💼' },
      { value: 'founder', label: 'Founder / Entrepreneur', icon: '🚀' },
      { value: 'researcher', label: 'Researcher', icon: '🔬' },
    ];

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl md:text-3xl font-bold text-white mb-3">What best describes you?</h2>
          <p className="text-gray-400">Help us personalize your experience</p>
        </div>

        <div className="grid grid-cols-1 gap-3 mt-8">
          {userTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handleInputChange('userType', type.value)}
              className={`p-5 rounded-xl border-2 text-left transition-all ${
                formData.userType === type.value
                  ? 'border-white bg-white/10 text-white'
                  : 'border-neutral-700/50 bg-neutral-900/30 text-gray-300 hover:border-neutral-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{type.icon}</span>
                <span className="text-sm font-medium">{type.label}</span>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentStep(5)}
          disabled={!formData.userType}
          className="w-full rounded-2xl bg-white py-4 font-semibold text-black hover:bg-gray-100 hover:shadow-lg hover:shadow-white/20 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }, [formData.userType, handleInputChange]);

  // Step 6: Terms & Privacy
  const Step6 = React.useMemo(() => (
    <div className="space-y-6">
      <div className="flex items-center justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
          <Shield className="w-8 h-8 text-white" />
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl md:text-3xl font-bold text-white mb-3">Review Our Policies</h2>
        <p className="text-gray-400">Before creating your Polaris AI account, please review and accept our policies</p>
      </div>

      <div className="space-y-4 my-8">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.termsAccepted}
            onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-gray-600 bg-neutral-800 text-white focus:ring-2 focus:ring-white/50 focus:ring-offset-0"
          />
          <span className="text-gray-300 group-hover:text-white transition-colors flex-1">
            I agree to the{' '}
            <span className="inline-block" onClick={(e) => e.preventDefault()}>
              <TocDialog />
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.privacyAccepted}
            onChange={(e) => handleInputChange('privacyAccepted', e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-gray-600 bg-neutral-800 text-white focus:ring-2 focus:ring-white/50 focus:ring-offset-0"
          />
          <span className="text-gray-300 group-hover:text-white transition-colors flex-1">
            I agree to the{' '}
            <a href="#" className="text-white underline hover:text-gray-300">Privacy Policy</a>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.dataConsentAccepted}
            onChange={(e) => handleInputChange('dataConsentAccepted', e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-gray-600 bg-neutral-800 text-white focus:ring-2 focus:ring-white/50 focus:ring-offset-0"
          />
          <span className="text-gray-300 group-hover:text-white transition-colors flex-1">
            I consent to data usage for providing personalized AI features
          </span>
        </label>
      </div>

      <button
        onClick={() => setCurrentStep(6)}
        disabled={!formData.termsAccepted || !formData.privacyAccepted || !formData.dataConsentAccepted}
        className="w-full rounded-2xl bg-white py-4 font-semibold text-black hover:bg-gray-100 hover:shadow-lg hover:shadow-white/20 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        Accept & Continue
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  ), [formData.termsAccepted, formData.privacyAccepted, formData.dataConsentAccepted, handleInputChange]);

  // Step 7: Welcome Screen
  const Step7 = React.useMemo(() => (
    <div className="space-y-6 text-center">
      <div className="flex items-center justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center animate-pulse">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
      </div>

      <div>
        <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">Your Polaris workspace is ready!</h2>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Let's give you a quick walkthrough of how Polaris can help you stay productive across apps
        </p>
      </div>

      <div className="flex flex-col gap-3 mt-12">
        <button
          onClick={() => {
            if (onComplete) {
              onComplete();
            }
          }}
          className="w-full rounded-2xl bg-white py-4 font-semibold text-black hover:bg-gray-100 hover:shadow-lg hover:shadow-white/20 hover:scale-[1.02] transition-all duration-200"
        >
          Go to Dashboard
        </button>

        <button
          onClick={() => {
            if (onComplete) {
              onComplete();
            }
          }}
          className="w-full rounded-2xl border-2 border-neutral-700/50 py-4 font-semibold text-white hover:border-neutral-600 hover:bg-neutral-900/50 transition-all"
        >
          Skip for now
        </button>
      </div>
    </div>
  ), [onComplete]);

  const steps = React.useMemo(() => [Step1, Step2, Step3, Step4, Step5, Step6, Step7], [Step1, Step2, Step3, Step4, Step5, Step6, Step7]);

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw] bg-black">
      {/* Left column: AI Illustration */}
      <section className="hidden md:flex flex-1 relative overflow-hidden bg-black items-center justify-center">
        <SignUpIllustration />
      </section>

      {/* Right column: sign-up form */}
      <section className="flex-1 flex items-center justify-center p-8 bg-black relative overflow-hidden">
        {/* Subtle gradient accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        
        <div className="w-full max-w-md relative z-10">
          {currentStep < 6 && (
            <StepIndicator currentStep={currentStep} totalSteps={6} />
          )}
          {steps[currentStep]}
        </div>
      </section>
    </div>
  );
};

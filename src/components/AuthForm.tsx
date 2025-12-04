import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, Mail, Lock, User, Sparkles, Zap, CheckCircle2, ArrowRight, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "./ui/input-otp";

interface AuthFormProps {
  onAuthSuccess: () => void;
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Signup OTP state
  const [signupStep, setSignupStep] = useState<'details' | 'otp'>('details');
  const [pendingSignup, setPendingSignup] = useState<{
    email: string;
    password: string;
    name: string;
    generatedOtp?: string; // For demo display
  } | null>(null);

  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError('');
      
      if (!email || !password) {
        setError('Please fill in all fields');
        toast.error('Please fill in all fields');
        return;
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setError(error.message);
        toast.error(`Sign in failed: ${error.message}`);
        return;
      }
      
      toast.success('Welcome back! 🎉');
      onAuthSuccess();
    } catch (err) {
      const errorMsg = 'Failed to sign in. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpInitiate = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError('');
      
      if (!email || !password || !name) {
        setError('Please fill in all fields');
        toast.error('Please fill in all fields');
        return;
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        toast.error('Password must be at least 6 characters');
        return;
      }

      // Generate OTP via server
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-bd6686dd/generate-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to send verification code');
        toast.error('Failed to send verification code');
        return;
      }

      // Store pending signup info (including OTP for demo display)
      setPendingSignup({ 
        email, 
        password, 
        name,
        generatedOtp: result.otp // Only for demo purposes
      });
      setSignupStep('otp');
      toast.success(`🔐 Verification code generated!`);
      
    } catch (err) {
      const errorMsg = 'Failed to initiate signup. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Signup initiation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async (otp: string) => {
    if (!pendingSignup) {
      toast.error('Invalid signup session');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Verify OTP via server
      const verifyResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-bd6686dd/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email: pendingSignup.email,
          otp: otp,
        }),
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResponse.ok) {
        setError(verifyResult.error || 'Invalid verification code');
        toast.error(verifyResult.error || 'Invalid verification code');
        return;
      }

      // OTP verified, now create the user account
      const signupResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-bd6686dd/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email: pendingSignup.email,
          password: pendingSignup.password,
          name: pendingSignup.name,
        }),
      });
      
      const signupResult = await signupResponse.json();
      
      if (!signupResponse.ok) {
        const errorMsg = signupResult.error || 'Failed to create account';
        setError(errorMsg);
        toast.error(`Account creation failed: ${errorMsg}`);
        return;
      }
      
      toast.success('✨ Account created successfully! Signing you in...');
      
      // Sign in the user
      await handleSignIn(pendingSignup.email, pendingSignup.password);
      
      // Reset state
      setPendingSignup(null);
      setSignupStep('details');
      
    } catch (err) {
      const errorMsg = 'Failed to verify OTP. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('OTP verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!pendingSignup) return;

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-bd6686dd/generate-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email: pendingSignup.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error('Failed to resend code');
        return;
      }

      // Update the generated OTP for demo display
      setPendingSignup({
        ...pendingSignup,
        generatedOtp: result.otp
      });

      toast.success('New verification code sent! 📧');
    } catch (err) {
      toast.error('Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDetails = () => {
    setSignupStep('details');
    setPendingSignup(null);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-emerald-50">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 text-5xl energy-float text-cyan-400 opacity-30">⚡</div>
        <div className="absolute top-40 right-32 text-4xl energy-float text-emerald-400 opacity-30" style={{ animationDelay: '1s' }}>🌱</div>
        <div className="absolute bottom-32 left-16 text-5xl energy-float text-blue-400 opacity-30" style={{ animationDelay: '2s' }}>💡</div>
        <div className="absolute bottom-20 right-20 text-4xl energy-float text-green-400 opacity-30" style={{ animationDelay: '0.5s' }}>🔋</div>
        <div className="absolute top-1/3 left-1/4 text-3xl energy-float text-purple-400 opacity-30" style={{ animationDelay: '2.5s' }}>🌟</div>
        <div className="absolute top-1/2 right-1/4 text-4xl energy-float text-pink-400 opacity-30" style={{ animationDelay: '1.5s' }}>🔌</div>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 backdrop-blur-xl relative z-10 overflow-hidden">
        {/* Header Section */}
        <div className="relative bg-gradient-to-br from-cyan-500 via-blue-500 to-emerald-500 p-8 text-white overflow-hidden">
          {/* Animated background shapes */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full filter blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
          
          <div className="relative z-10 text-center">
            <div className="mb-4 flex justify-center">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                <Zap className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Smart Energy Dashboard</h1>
            <p className="text-cyan-100">Track, analyze & optimize your energy consumption with AI</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8">
          {/* Mode Toggle */}
          {signupStep === 'details' && (
            <div className="flex gap-2 mb-6 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => {
                  setMode('signin');
                  setError('');
                }}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                  mode === 'signin'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  Sign In
                </div>
              </button>
              <button
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                  mode === 'signup'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Sign Up
                </div>
              </button>
            </div>
          )}

          {/* Forms */}
          {mode === 'signin' ? (
            <SignInForm 
              onSubmit={handleSignIn} 
              loading={loading} 
              error={error}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
          ) : signupStep === 'details' ? (
            <SignUpForm 
              onSubmit={handleSignUpInitiate} 
              loading={loading} 
              error={error}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
          ) : (
            <OTPVerificationForm
              email={pendingSignup?.email || ''}
              generatedOtp={pendingSignup?.generatedOtp}
              onVerify={handleOTPVerification}
              onResend={handleResendOTP}
              onBack={handleBackToDetails}
              loading={loading}
              error={error}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-6">
          <div className="text-center text-sm text-gray-500">
            <p>Powered by AI • Secure & Encrypted</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SignInForm({ 
  onSubmit, 
  loading, 
  error,
  showPassword,
  setShowPassword 
}: {
  onSubmit: (email: string, password: string) => void;
  loading: boolean;
  error: string;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="signin-email" className="text-gray-700">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="signin-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-11 py-6 bg-gray-50 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500 transition-all"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signin-password" className="text-gray-700">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="signin-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-11 pr-11 py-6 bg-gray-50 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500 transition-all"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Signing In...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span>Sign In</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        )}
      </Button>
    </form>
  );
}

function SignUpForm({ 
  onSubmit, 
  loading, 
  error,
  showPassword,
  setShowPassword 
}: {
  onSubmit: (email: string, password: string, name: string) => void;
  loading: boolean;
  error: string;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password, name);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="signup-name" className="text-gray-700">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="signup-name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-11 py-6 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-gray-700">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-11 py-6 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-gray-700">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-11 pr-11 py-6 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white py-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Sending Verification Code...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span>Continue</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        )}
      </Button>
    </form>
  );
}

function OTPVerificationForm({
  email,
  generatedOtp,
  onVerify,
  onResend,
  onBack,
  loading,
  error
}: {
  email: string;
  generatedOtp?: string;
  onVerify: (otp: string) => void;
  onResend: () => void;
  onBack: () => void;
  loading: boolean;
  error: string;
}) {
  const [otp, setOtp] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      onVerify(otp);
    }
  };

  const handleCopyOTP = () => {
    if (generatedOtp) {
      navigator.clipboard.writeText(generatedOtp);
      setCopied(true);
      toast.success('OTP copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="bg-gradient-to-br from-emerald-500 to-green-500 p-4 rounded-2xl">
            <Mail className="w-8 h-8 text-white" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Verify Your Email</h3>
        <p className="text-sm text-gray-600">
          Enter the 6-digit code for<br />
          <span className="font-semibold text-emerald-600">{email}</span>
        </p>
      </div>

      {/* Demo OTP Display */}
      {generatedOtp && (
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-emerald-700">DEMO MODE</span>
            </div>
            <button
              onClick={handleCopyOTP}
              className="text-emerald-600 hover:text-emerald-700 transition-colors"
              type="button"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-600 mb-2">Your verification code:</p>
          <div className="flex items-center justify-center gap-1 bg-white rounded-lg p-3">
            {generatedOtp.split('').map((digit, idx) => (
              <div key={idx} className="w-10 h-12 bg-emerald-100 rounded flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-700">{digit}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            💡 In production, this would be sent via email
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* OTP Input */}
        <div className="flex justify-center">
          <InputOTP 
            maxLength={6} 
            value={otp} 
            onChange={setOtp}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="w-12 h-14 text-lg border-gray-300" />
              <InputOTPSlot index={1} className="w-12 h-14 text-lg border-gray-300" />
              <InputOTPSlot index={2} className="w-12 h-14 text-lg border-gray-300" />
              <InputOTPSlot index={3} className="w-12 h-14 text-lg border-gray-300" />
              <InputOTPSlot index={4} className="w-12 h-14 text-lg border-gray-300" />
              <InputOTPSlot index={5} className="w-12 h-14 text-lg border-gray-300" />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Verify Button */}
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white py-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
          disabled={loading || otp.length !== 6}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Verifying...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Verify & Create Account</span>
            </div>
          )}
        </Button>

        {/* Resend & Back */}
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            disabled={loading}
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={onResend}
            className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            disabled={loading}
          >
            Resend Code
          </button>
        </div>
      </form>

      {/* Info */}
      <div className="text-center text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        💡 Code expires in 10 minutes
      </div>
    </div>
  );
}

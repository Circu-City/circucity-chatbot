'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Handshake, Loader2, CheckCircle, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';

function SetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError('No verification token found. Check your email for the correct link.');
    } else {
      setTokenValid(true);
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/partner/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        setVerified(true);
        setTimeout(() => router.push(data.redirect || '/partner/dashboard'), 2000);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-[#0A1428] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-[#A3E635]/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[#A3E635]" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3">Welcome to the Team!</h1>
          <p className="text-gray-400 mb-6">Your account is set up. Redirecting you to your partner dashboard...</p>
          <Loader2 className="w-5 h-5 animate-spin text-[#A3E635] mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1428] flex">
      {/* Left branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#0A1428] via-[#111d35] to-[#0A1428] items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-72 h-72 bg-[#A3E635] rounded-full blur-[128px]" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#A3E635] rounded-full blur-[128px]" />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="w-16 h-16 bg-[#A3E635] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#A3E635]/20">
            <Handshake className="w-8 h-8 text-[#0A1428]" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4">
            CircuCity AI<br />
            <span className="text-[#A3E635]">Partner Program</span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Earn commissions by referring businesses to CircuCity AI.
            Share your referral link, track conversions, and get paid.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 bg-[#A3E635] rounded-xl flex items-center justify-center">
              <Handshake className="w-5 h-5 text-[#0A1428]" />
            </div>
            <span className="text-xl font-bold text-white">Partner Program</span>
          </div>

          {tokenValid === false ? (
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-3">Invalid Link</h1>
              <p className="text-gray-400 mb-6">{error}</p>
              <Link
                href="/partners/apply"
                className="inline-flex items-center gap-2 bg-[#A3E635] text-[#0A1428] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#8DC92E] transition-all"
              >
                Apply Again <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Set Your Password</h1>
              <p className="text-gray-400 text-sm mb-8">
                Verify your email and create a password to access your partner dashboard.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-gray-300 mb-1.5 block">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/40 focus:border-[#A3E635]/40 placeholder-gray-600"
                      placeholder="At least 6 characters"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/40 focus:border-[#A3E635]/40 placeholder-gray-600"
                      placeholder="Repeat your password"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#A3E635] text-[#0A1428] py-3.5 rounded-xl font-bold text-sm hover:bg-[#8DC92E] transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {loading ? 'Setting up...' : 'Verify & Create Account'}
                </button>

                <p className="text-center text-gray-500 text-xs">
                  Already have an account?{' '}
                  <Link href="/sign-in" className="text-[#A3E635] hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PartnerSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A1428] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#A3E635]" />
      </div>
    }>
      <SetupForm />
    </Suspense>
  );
}

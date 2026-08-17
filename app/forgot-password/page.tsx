"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/auth";
import { Zap } from "lucide-react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await requestPasswordReset({ email });
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-navy flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-lemon-gradient rounded-xl flex items-center justify-center shadow-lemon">
              <Zap className="w-6 h-6 text-dark-navy fill-current" />
            </div>
            <span className="text-2xl font-bold text-white">
              CircuCity{' '}<span className="text-lemon-green">AI</span>
            </span>
          </Link>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
          {sent ? (
            <>
              <h1 className="text-2xl font-bold text-white text-center mb-2">Check your email</h1>
              <p className="text-gray-400 text-center text-sm mb-8">
                If an account exists for <span className="text-gray-200">{email}</span>, a password
                reset link has been sent. It expires in 30 minutes.
              </p>
              <div className="text-center">
                <Link href="/sign-in" className="text-lemon-green hover:underline font-medium text-sm">
                  Back to sign in
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white text-center mb-2">Forgot password</h1>
              <p className="text-gray-400 text-center text-sm mb-8">
                Enter your account email and we'll send you a reset link
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-dark-navy border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lemon-green focus:ring-1 focus:ring-lemon-green transition-colors"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-lemon-gradient text-dark-navy font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                  Remembered it?{" "}
                  <Link href="/sign-in" className="text-lemon-green hover:underline font-medium">
                    Back to sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/actions/auth";
import { Zap } from "lucide-react";
import Link from "next/link";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn(form);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Priority: 1. Explicit redirect param (from middleware), 2. Role-based redirect
      const redirectTo = searchParams.get("redirect");

      if (redirectTo) {
        router.push(redirectTo);
      } else if (result.user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
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
          <h1 className="text-2xl font-bold text-white text-center mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-center text-sm mb-8">Sign in to manage your AI agent</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-dark-navy border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lemon-green focus:ring-1 focus:ring-lemon-green transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{" "}
              <Link href="/sign-up" className="text-lemon-green hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-navy flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
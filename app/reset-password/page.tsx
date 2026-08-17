"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/actions/auth";
import { Zap } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const result = await resetPassword({ token, password: form.password });
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setDone(true);
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
          {done ? (
            <>
              <h1 className="text-2xl font-bold text-white text-center mb-2">Password updated</h1>
              <p className="text-gray-400 text-center text-sm mb-8">
                Your password has been changed. You can now sign in with your new password.
              </p>
              <button
                onClick={() => router.push("/sign-in")}
                className="w-full py-3 bg-lemon-gradient text-dark-navy font-bold rounded-lg hover:opacity-90 transition-all"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white text-center mb-2">Choose a new password</h1>
              <p className="text-gray-400 text-center text-sm mb-8">
                Enter a new password for your account
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1.5">New Password</label>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-dark-navy border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lemon-green focus:ring-1 focus:ring-lemon-green transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Re-enter your password"
                    required
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
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
                  disabled={loading || !token}
                  className="w-full py-3 bg-lemon-gradient text-dark-navy font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-navy flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

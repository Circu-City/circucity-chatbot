'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Application Error]', error.message, error.digest);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h1>
        <p className="text-gray-500 mb-8">An unexpected error occurred. Please try again. If the problem persists, contact support.</p>
        <button
          onClick={reset}
          className="inline-flex items-center px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

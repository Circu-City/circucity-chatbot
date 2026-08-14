'use client';

import { Suspense } from 'react';
import Dashboard from '@/components/dashboard/Dashboard';

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
        <Dashboard />
      </Suspense>
    </div>
  );
}
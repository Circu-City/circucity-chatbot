'use client';

import Header from '@/components/marketing/Header';
import Footer from '@/components/marketing/Footer';

export default function MarketingShell({
  children,
  darkHero = false,
}: {
  children: React.ReactNode;
  darkHero?: boolean;
}) {
  return (
    <div className="min-h-screen bg-white">
      <Header darkHero={darkHero} />
      {children}
      <Footer />
    </div>
  );
}

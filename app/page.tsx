import type { Metadata } from "next";
import LandingPage from '@/components/marketing/LandingPage';

// Canonical belongs on the page, not the root layout: putting it in the layout
// makes every child inherit a canonical pointing at the homepage.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main>
      <LandingPage />
    </main>
  );
}

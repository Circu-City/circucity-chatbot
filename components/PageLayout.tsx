'use client';

import Link from 'next/link';
import { Bot } from 'lucide-react';

export default function PageLayout({ children, bg = 'bg-white' }: { children: React.ReactNode; bg?: string }) {
  return (
    <div className={`min-h-screen ${bg}`}>
      <nav className="py-4 bg-[#FAFAFA] border-b border-gray-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#A3E635] rounded-xl flex items-center justify-center shadow-sm">
              <Bot className="text-[#0A1428] w-5 h-5" />
            </div>
            <span className="text-lg font-extrabold text-[#0A1428]">CircuCity <span className="text-[#A3E635]">AI</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/features" className="text-sm text-gray-600 hover:text-[#0A1428] font-medium transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-[#0A1428] font-medium transition-colors">Pricing</Link>
            <Link href="/docs" className="text-sm text-gray-600 hover:text-[#0A1428] font-medium transition-colors">Docs</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm text-gray-600 hover:text-[#0A1428] font-medium transition-colors">Sign in</Link>
            <Link href="/sign-up" className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl px-5 py-2 text-sm transition-all shadow-sm">
              Start free trial
            </Link>
          </div>
        </div>
      </nav>
      {children}
      <footer className="bg-[#0A1428] text-gray-400 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <h4 className="text-white font-semibold mb-3">Product</h4>
            <Link href="/features" className="block hover:text-white mb-1 transition-colors">Features</Link>
            <Link href="/pricing" className="block hover:text-white mb-1 transition-colors">Pricing</Link>
            <Link href="/docs" className="block hover:text-white mb-1 transition-colors">Documentation</Link>
            <Link href="/api-docs" className="block hover:text-white transition-colors">API</Link>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Company</h4>
            <Link href="/about" className="block hover:text-white mb-1 transition-colors">About</Link>
            <Link href="/blog" className="block hover:text-white mb-1 transition-colors">Blog</Link>
            <Link href="/careers" className="block hover:text-white mb-1 transition-colors">Careers</Link>
            <Link href="/contact" className="block hover:text-white transition-colors">Contact</Link>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Legal</h4>
            <Link href="/privacy" className="block hover:text-white mb-1 transition-colors">Privacy</Link>
            <Link href="/terms" className="block hover:text-white mb-1 transition-colors">Terms</Link>
            <Link href="/gdpr" className="block hover:text-white mb-1 transition-colors">GDPR</Link>
            <Link href="/security" className="block hover:text-white transition-colors">Security</Link>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Resources</h4>
            <Link href="/blog" className="block hover:text-white mb-1 transition-colors">Blog</Link>
            <Link href="/docs" className="block hover:text-white mb-1 transition-colors">Docs</Link>
            <Link href="/api-docs" className="block hover:text-white mb-1 transition-colors">API Reference</Link>
            <Link href="https://circucity.com" className="block hover:text-white transition-colors">CircuCity Store</Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-gray-800 text-center text-xs">
          &copy; 2026 CircuCity AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

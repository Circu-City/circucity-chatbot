import Link from 'next/link';
import { Bot } from 'lucide-react';

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Industries', href: '/industries' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Documentation', href: '/docs' },
      { label: 'API Reference', href: '/api-docs' },
      { label: 'Developer Guide', href: '/docs/developer-guide' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
      { label: 'Partner Programs', href: '/partners' },
      { label: 'Security', href: '/security' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'GDPR Compliance', href: '/gdpr' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#060E1E] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-[#A3E635] rounded-lg flex items-center justify-center">
                <Bot className="text-[#0A1428] w-4 h-4" />
              </div>
              <span className="text-lg font-extrabold text-white">
                CircuCity <span className="text-[#A3E635]">AI</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Cira-powered AI support for e-commerce, SaaS, and service businesses.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
              <div className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <Link key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">&copy; 2026 CircuCity AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-300">Privacy</Link>
            <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-300">Terms</Link>
            <Link href="/gdpr" className="text-xs text-gray-500 hover:text-gray-300">GDPR</Link>
            <Link href="/security" className="text-xs text-gray-500 hover:text-gray-300">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

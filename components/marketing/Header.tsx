'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Menu, X, ChevronDown, Zap, ArrowRight, Sparkles, PhoneCall, Layers, Play } from 'lucide-react';

// Grouped so the menu teaches the product line: two brands, then everything that
// belongs to neither. The flat PRODUCT_LINKS below is derived from this for the
// mobile list, where there are no section headers to carry the brand name.
const PRODUCT_GROUPS = [
  {
    brand: 'Cira',
    tagline: 'AI commerce agent',
    links: [
      { label: 'Overview', href: '/ai-agent', desc: 'Autonomous customer sales & support' },
      { label: 'Live Chat', href: '/live-chat', desc: 'Real-time conversations' },
      { label: 'Help Desk', href: '/help-desk', desc: 'Ticketing & workflows' },
      { label: 'Voice Calling', href: '/call', desc: 'On-prem conversational voice calls' },
      { label: 'Revenue Map', href: '/revenue-map', desc: 'Commerce graph & revenue leaks' },
    ],
  },
  {
    brand: 'Gavriel',
    tagline: 'visual listing AI',
    links: [
      { label: 'Overview', href: '/gavriel-listing-ai', desc: 'Visual catalog inspection & pricing' },
    ],
  },
  {
    brand: null as string | null,
    tagline: 'Explore',
    links: [
      { label: 'Instant 30s Demo', href: '/demo/instant', desc: 'Scan any store and talk to Cira' },
      { label: 'Integrations', href: '/integrations', desc: 'Shopify, WooCommerce, Etsy & eBay' },
    ],
  },
];

const PRODUCT_LINKS = PRODUCT_GROUPS.flatMap((g) =>
  g.links.map((l) => ({
    ...l,
    label: g.brand ? `${g.brand} — ${l.label}` : l.label,
  })),
);

const RESOURCE_LINKS = [
  { label: 'All Features', href: '/features', desc: 'Everything in one place' },
  { label: 'Docs & Help Center', href: '/docs', desc: 'Guides and API reference' },
  { label: 'Blog', href: '/blog', desc: 'Product news and playbooks' },
  { label: 'About', href: '/about', desc: 'Who we are' },
  { label: 'Contact', href: '/contact', desc: 'Talk to a human' },
];

// Flat bar carries only what is NOT a product or a resource. Keeping these
// disjoint is the whole point: previously four destinations appeared in both
// the dropdown and the bar under different labels.
const NAV_LINKS = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Partners', href: '/partners' },
];

export default function Header({ darkHero = false }: { darkHero?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [resourceOpen, setResourceOpen] = useState(false);
  const productRef = useRef<HTMLDivElement>(null);
  const resourceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (productRef.current && !productRef.current.contains(e.target as Node)) {
        setProductOpen(false);
      }
      if (resourceRef.current && !resourceRef.current.contains(e.target as Node)) {
        setResourceOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDark = darkHero && !scrolled;

  return (
    <motion.nav
      initial={false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8"
    >
      <motion.div
        layout
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`mx-auto max-w-7xl transition-all duration-400 ${
          scrolled
            ? 'mt-3 rounded-2xl bg-white/90 backdrop-blur-xl shadow-lg shadow-black/5 border border-gray-100/80'
            : darkHero
              ? 'mt-5 rounded-2xl bg-[#0A1428]/80 backdrop-blur-xl border border-white/15'
              : 'mt-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-100/80'
        }`}
      >
        <div className="flex items-center justify-between h-14 px-5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-9 h-9 bg-[#A3E635] rounded-xl flex items-center justify-center shadow-lg shadow-[#A3E635]/20"
            >
              <Zap className="text-[#0A1428] w-5 h-5 fill-current" />
            </motion.div>
            <span className={`text-lg font-bold tracking-tight transition-colors ${
              isDark ? 'text-white' : 'text-[#0A1428]'
            }`}>
              CircuCity{' '}<span className="text-[#A3E635]">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            <div ref={productRef} className="relative">
              <button
                onClick={() => setProductOpen(!productOpen)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'text-gray-200 hover:text-white hover:bg-white/10'
                    : 'text-gray-600 hover:text-[#0A1428] hover:bg-gray-100'
                }`}
              >
                Products
                <motion.div
                  animate={{ rotate: productOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              </button>
              <AnimatePresence>
                {productOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-full left-0 mt-2 w-[620px] rounded-2xl bg-white border border-gray-100 shadow-2xl shadow-black/10 p-3 text-dark-navy grid grid-cols-2 gap-x-2"
                  >
                    {PRODUCT_GROUPS.map((group) => (
                      <div key={group.tagline} className={group.brand === 'Cira' ? 'row-span-2' : ''}>
                        <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          {group.brand ? `${group.brand} · ${group.tagline}` : group.tagline}
                        </p>
                        {group.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setProductOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                          >
                            <div className="w-8 h-8 shrink-0 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-[#A3E635]/10 transition-colors">
                              <Zap className="w-4 h-4 text-[#A3E635]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#0A1428]">{link.label}</p>
                              <p className="text-xs text-gray-500 truncate">{link.desc}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'text-gray-200 hover:text-white hover:bg-white/10'
                    : 'text-gray-600 hover:text-[#0A1428] hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div ref={resourceRef} className="relative">
              <button
                onClick={() => setResourceOpen(!resourceOpen)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'text-gray-200 hover:text-white hover:bg-white/10'
                    : 'text-gray-600 hover:text-[#0A1428] hover:bg-gray-100'
                }`}
              >
                Resources
                <motion.div
                  animate={{ rotate: resourceOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              </button>
              <AnimatePresence>
                {resourceOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-white border border-gray-100 shadow-2xl shadow-black/10 p-2 text-dark-navy"
                  >
                    {RESOURCE_LINKS.map((link, i) => (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setResourceOpen(false)}
                          className="flex flex-col px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all duration-200"
                        >
                          <span className="text-sm font-semibold text-[#0A1428]">{link.label}</span>
                          <span className="text-xs text-gray-500">{link.desc}</span>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/sign-in"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'text-gray-200 hover:text-white'
                  : 'text-gray-600 hover:text-[#0A1428]'
              }`}
            >
              Sign In
            </Link>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/sign-up"
                className="px-5 py-2 rounded-xl bg-[#A3E635] text-[#0A1428] text-sm font-bold hover:bg-[#8DC92E] transition-all duration-200 shadow-lg shadow-[#A3E635]/20 inline-flex items-center gap-2 group"
              >
                Start free trial
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden p-2 rounded-xl transition-colors ${
              isDark
                ? 'text-white hover:bg-white/10'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`overflow-hidden border-t ${
                isDark ? 'border-white/10 bg-[#0A1428]/95' : 'border-gray-100 bg-white'
              }`}
            >
              <div className="px-5 py-4 flex flex-col gap-1">
                {[...PRODUCT_LINKS.map(l => ({ ...l, isProduct: true })), ...NAV_LINKS.map(l => ({ ...l, isProduct: false })), ...RESOURCE_LINKS.map(l => ({ ...l, isProduct: false }))].map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700"
                    >
                      {'isProduct' in link && link.isProduct && (
                        <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                          <Zap className="w-3.5 h-3.5 text-[#A3E635]" />
                        </div>
                      )}
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <hr className="my-3 border-gray-100" />
                <Link href="/sign-in" onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-gray-700">
                  Sign In
                </Link>
                <Link href="/sign-up" onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-xl bg-[#A3E635] text-[#0A1428] text-sm font-bold text-center">
                  Start free trial
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.nav>
  );
}

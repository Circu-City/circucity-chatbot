'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Menu, X, ChevronDown, Zap, ArrowRight } from 'lucide-react';

const PRODUCT_LINKS = [
  { label: 'AI Agent', href: '/ai-agent', desc: 'Automated AI customer support' },
  { label: 'Live Chat', href: '/live-chat', desc: 'Real-time conversations' },
  { label: 'Help Desk', href: '/help-desk', desc: 'Ticketing & workflows' },
  { label: 'Integrations', href: '/integrations', desc: 'Connect your tools' },
];

const NAV_LINKS = [
  { label: 'Gavriel Listing AI', href: '/gavriel-listing-ai' },
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
  { label: 'Partners', href: '/partners' },
];

export default function Header({ darkHero = false }: { darkHero?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const productRef = useRef<HTMLDivElement>(null);

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
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-4"
    >
      <motion.div
        layout
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`mx-auto max-w-7xl transition-all duration-400 ${
          scrolled
            ? 'mt-3 rounded-2xl bg-white/90 backdrop-blur-xl shadow-lg shadow-black/5 border border-gray-100/80'
            : darkHero
              ? 'mt-5 rounded-2xl bg-[#0A1428]/60 backdrop-blur-xl border border-white/10'
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
              <Bot className="text-[#0A1428] w-5 h-5" />
            </motion.div>
            <span className="text-lg font-bold tracking-tight text-[#0A1428] dark-nav:text-white">
              CircuCity
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            <div ref={productRef} className="relative">
              <button
                onClick={() => setProductOpen(!productOpen)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-[#0A1428] hover:bg-gray-100 transition-all duration-200"
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
                    className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-white border border-gray-100 shadow-2xl shadow-black/10 p-2"
                  >
                    {PRODUCT_LINKS.map((link, i) => (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setProductOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-[#A3E635]/10 transition-colors">
                            <Zap className="w-4 h-4 text-[#A3E635]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#0A1428]">{link.label}</p>
                            <p className="text-xs text-gray-500">{link.desc}</p>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-[#0A1428] hover:bg-gray-100 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/sign-in"
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-[#0A1428] transition-all duration-200"
            >
              Sign In
            </Link>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/sign-up"
                className="px-5 py-2 rounded-xl bg-[#A3E635] text-[#0A1428] text-sm font-bold hover:bg-[#8DC92E] transition-all duration-200 shadow-lg shadow-[#A3E635]/20 inline-flex items-center gap-2 group"
              >
                Start Free
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
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
              className="overflow-hidden border-t border-gray-100"
            >
              <div className="px-5 py-4 flex flex-col gap-1">
                {[...PRODUCT_LINKS.map(l => ({ ...l, isProduct: true })), ...NAV_LINKS.map(l => ({ ...l, isProduct: false }))].map((link, i) => (
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
                  Start Free
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.nav>
  );
}

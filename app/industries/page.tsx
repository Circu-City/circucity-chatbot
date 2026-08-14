'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import MarketingShell from '@/components/marketing/MarketingShell';
import { industries, industryCategories } from '@/lib/industries';

const iconMap: Record<string, string> = {
  shirt: '\u{1F455}',
  sparkles: '\u{1F484}',
  home: '\u{1F3E0}',
  'utensils-crossed': '\u{1F957}',
  'heart-pulse': '\u{1F48A}',
  'monitor-smartphone': '\u{1F4BB}',
  'rotate-3d': '\u{1F4E6}',
  'dollar-sign': '\u{1F4B3}',
  'book-open': '\u{1F4DA}',
  plane: '\u{2708}\u{FE0F}',
  briefcase: '\u{1F4BC}',
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const industryImages: Record<string, string> = {
  ecommerce: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
  services: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800',
  education: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800',
  finance: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800',
  saas: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
  travel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
};

export default function IndustriesPage() {
  const bySlug = Object.fromEntries(industries.map((i) => [i.slug, i]));

  const catImages: Record<string, string> = {
    ecommerce: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80',
    services: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80',
    education: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80',
    finance: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&q=80',
    saas: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80',
    travel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80',
  };

  function getCategoryDesc(label: string): string {
    const descs: Record<string, string> = {
      Ecommerce: "Streamline sales, support, and service across your entire online store.",
      BusinessSaaS: "Deliver expert onboarding, billing, and feature guidance — automatically.",
      Specialized: "Provide trusted, compliance-aware support for highly regulated and niche markets.",
    };
    return descs[label.replace(/ & /g, '')] || `Specialized support flows for ${label.toLowerCase()} businesses.`;
  }

  return (
    <MarketingShell darkHero>
      <section className="relative pt-32 pb-24 bg-[#0A1428] text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A1428] via-[#0D1A35] to-[#112240]" />
        <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-[#A3E635]/3 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
                <span className="text-sm text-white/80">Smart AI built for your industry — product-aware by design</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
                AI support built for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3E635] to-[#9EF01A]">
                  your industry
                </span>
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed max-w-xl mb-10">
                Cira adapts to your catalog, policies, and customer expectations. No generic chatbot —
                tailored AI trained on your verified business data.
              </p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex flex-wrap gap-8"
              >
                {[
                  { value: '73%', label: 'avg auto-resolution' },
                  { value: '< 2s', label: 'response time' },
                  { value: '13+', label: 'industry templates' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-3xl font-extrabold text-[#A3E635]">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-[32px] overflow-hidden shadow-2xl border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=700"
                  alt="Industry solutions"
                  className="w-full h-[450px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1428]/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <p className="text-sm text-white/90">"Cira handles 73% of our support automatically. Game changer for our team."</p>
                    <p className="text-xs text-white/60 mt-2">— Sarah Chen, Nordic Boutique</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {industryCategories.map((cat, catIdx) => (
        <section key={cat.label} className={catIdx === 0 ? 'py-20 bg-white' : 'py-20 bg-gray-50/50'}>
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
              className="mb-12"
            >
              <motion.h2 variants={fadeUp} className="text-3xl font-bold text-[#0A1428] mb-2">{cat.label}</motion.h2>
              <motion.p variants={fadeUp} className="text-gray-500 text-sm">{getCategoryDesc(cat.label)}</motion.p>
            </motion.div>
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {cat.slugs.map((slug, i) => {
                const industry = bySlug[slug];
                if (!industry) return null;
                const img = industry.heroImage || industryImages[industry.slug] || '';
                return (
                  <motion.div key={industry.slug} variants={fadeUp}>
                    <Link
                      href={`/industries/${industry.slug}`}
                      className="group block rounded-[24px] overflow-hidden border border-gray-200/70 bg-white hover:border-[#A3E635]/40 hover:shadow-xl hover:shadow-[#A3E635]/5 transition-all duration-300"
                    >
                      {img && (
                        <div className="h-40 overflow-hidden">
                          <img
                            src={img}
                            alt={industry.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="text-3xl mb-3">{iconMap[industry.icon] || '\u{1F6CD}\u{FE0F}'}</div>
                        <h3 className="text-xl font-bold text-[#0A1428] mb-2 group-hover:text-[#8DC92E] transition-colors">
                          {industry.name}
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed mb-4">{industry.description}</p>
                        <span className="text-sm font-semibold text-[#A3E635] group-hover:translate-x-1 inline-block transition-transform">
                          Explore solution →
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      ))}

      <section className="py-20 bg-[#0A1428] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#A3E635]/3 rounded-full blur-[150px]" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">Not seeing your industry?</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Cira works with any online business. Connect your store, crawl your site, and go live in under 2 minutes.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center px-8 py-4 bg-[#A3E635] text-[#0A1428] font-bold rounded-xl hover:bg-[#8DC92E] transition-colors shadow-lg shadow-[#A3E635]/20"
            >
              Start free trial →
            </Link>
          </motion.div>
        </div>
      </section>
    </MarketingShell>
  );
}

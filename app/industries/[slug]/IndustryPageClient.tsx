'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import MarketingShell from '@/components/marketing/MarketingShell';
import { industries, getIndustry } from '@/lib/industries';

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const industryHeroImages: Record<string, string> = {
  ecommerce: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900',
  services: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900',
  education: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900',
  finance: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=900',
  saas: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900',
  travel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900',
};

export default function IndustryPageClient({ slug }: { slug: string }) {
  const industry = getIndustry(slug);
  const others = industries.filter((i) => i.slug !== slug).slice(0, 3);
  const heroImg = industry?.heroImage || industryHeroImages[slug] || '';

  return (
    <MarketingShell darkHero>
      <section className="relative pt-32 pb-24 bg-[#0A1428] text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A1428] via-[#0D1A35] to-[#112240]" />
        <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-[#A3E635]/3 rounded-full blur-[120px]" />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <Link href="/industries" className="inline-flex items-center text-sm text-gray-400 hover:text-[#A3E635] mb-8 transition-colors">
              ← All industries
            </Link>
          </motion.div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">
                {industry?.name}
              </span>
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
                {industry?.heroTitle}
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed mb-10">{industry?.heroSubtitle}</p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex flex-wrap gap-4 mb-10"
              >
                {industry?.stats.map((stat: { label: string; value: string }) => (
                  <div
                    key={stat.label}
                    className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center min-w-[140px] hover:border-[#A3E635]/30 transition-colors"
                  >
                    <div className="text-2xl font-bold text-[#A3E635]">{stat.value}</div>
                    <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
              <Link
                href="/sign-up"
                className="inline-flex items-center px-8 py-4 bg-[#A3E635] text-[#0A1428] font-bold rounded-xl hover:bg-[#8DC92E] transition-colors shadow-lg shadow-[#A3E635]/20"
              >
                Start free trial for {industry?.name} →
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              {heroImg && (
                <div className="rounded-[32px] overflow-hidden shadow-2xl border border-white/10">
                  <img src={heroImg} alt={industry?.name} className="w-full h-[450px] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A1428]/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                      <p className="text-sm text-white/90">{industry?.valueProp}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="initial" whileInView="animate" viewport={{ once: true, margin: '-80px' }} variants={stagger}
            className="mb-16 text-center"
          >
            <motion.h2 variants={fadeUp} className="text-3xl font-extrabold text-[#0A1428] mb-4">
              What Cira does for {industry?.name}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 text-lg max-w-2xl mx-auto">{industry?.valueProp}</motion.p>
          </motion.div>
          <motion.div
            initial="initial" whileInView="animate" viewport={{ once: true, margin: '-80px' }} variants={stagger}
            className="grid md:grid-cols-3 gap-6"
          >
            {industry?.useCases.map((useCase: { title: string; desc: string }, idx: number) => (
              <motion.div
                key={idx} variants={fadeUp}
                className="p-8 rounded-[24px] border border-gray-200/70 hover:border-[#A3E635]/30 hover:shadow-lg transition-all bg-white group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#A3E635] to-[#8DC92E] flex items-center justify-center mb-5 text-lg font-bold text-[#0A1428] group-hover:scale-110 transition-transform">
                  {idx + 1}
                </div>
                <h3 className="text-xl font-bold text-[#0A1428] mb-3">{useCase.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{useCase.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-3xl font-bold text-[#0A1428] text-center mb-12"
          >
            Pain points we eliminate
          </motion.h2>
          <motion.div
            initial="initial" whileInView="animate" viewport={{ once: true, margin: '-80px' }} variants={stagger}
            className="grid sm:grid-cols-2 gap-4"
          >
            {industry?.painPoints.map((point: string) => (
              <motion.div
                key={point} variants={fadeUp}
                className="flex items-start gap-3 p-5 bg-white rounded-2xl border border-gray-200/70 hover:border-[#A3E635]/30 hover:shadow-md transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-[#A3E635]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#A3E635] text-sm font-bold">✓</span>
                </div>
                <span className="text-[#0A1428] font-medium text-sm">{point}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-[#0A1428]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-2xl font-bold text-white mb-8 text-center"
          >
            Explore other industries
          </motion.h2>
          <motion.div
            initial="initial" whileInView="animate" viewport={{ once: true, margin: '-80px' }} variants={stagger}
            className="grid md:grid-cols-3 gap-5"
          >
            {others.map((o: { slug: string; name: string; description: string }) => (
              <motion.div key={o.slug} variants={fadeUp}>
                <Link
                  href={`/industries/${o.slug}`}
                  className="block p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#A3E635]/30 hover:bg-white/10 transition-all"
                >
                  <h3 className="font-bold text-white mb-2">{o.name}</h3>
                  <p className="text-gray-400 text-sm">{o.description}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </MarketingShell>
  );
}


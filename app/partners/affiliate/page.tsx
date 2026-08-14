'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import MarketingShell from '@/components/marketing/MarketingShell';
import { ArrowRight, ThumbsUp, Users, TrendingUp, Star, Quote, ShoppingCart, Zap, Monitor, Globe } from 'lucide-react';

const steps = [
  { icon: ThumbsUp, title: 'Join the program', desc: 'Register for free as an affiliate and wait to be approved.' },
  { icon: Users, title: 'Promote CircuCity AI', desc: 'Advertise our products on your website and social media.' },
  { icon: TrendingUp, title: 'Earn money', desc: 'Get up to 30% commissions in monthly payments.' },
];

const whoCanJoin = [
  { title: 'Bloggers', items: ['Articles', 'Tutorials', 'Guides', 'Reviews', 'Case studies', 'Banners'] },
  { title: 'YouTubers', items: ['Video reviews', 'Step-by-step tutorials', 'Live streaming', 'Giveaways', 'Social media content'] },
  { title: 'Web Design Studios', items: ['Showcases', 'Themes and templates', 'Website examples', 'Resources page'] },
  { title: 'Connected Services', items: ['Landing pages', 'Email newsletters', 'Social media content', 'Articles and podcasts'] },
];

const reviews = [
  { name: 'Finn R', role: 'Consultant', text: 'Tidio is undoubtedly one of those who meet the list of best LiveChats pleasing us from the beginning its very easy installation and its great design.', rating: 5 },
  { name: 'Alexandra L', role: 'Business Administration', text: 'The most helpful is receiving instant chat messages of your customers, so that you can solve all of their doubts and try to sell them your product.', rating: 5 },
  { name: 'Donna T', role: 'Co-Founder', text: 'I love how easy Tidio is to set up. I was up and running in less than 10 minutes AND that included chatting with their amazing tech support.', rating: 5 },
];

export default function AffiliatePage() {
  return (
    <MarketingShell>
      <section className="py-24 px-6 bg-gradient-to-b from-[#FAFAFA] to-white text-center">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">Affiliate Program</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0A1428] leading-tight mb-4">
            Join Affiliate Program.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3E635] to-[#9EF01A]">Get up to 30% commission</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
            Become an affiliate and enjoy easy, substantial commissions from one of the best programs available.
          </p>
          <Link href="/partners/apply?program=affiliate"
            className="inline-flex items-center gap-2 bg-[#0A1428] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#1a2744] transition-all">
            Become an Affiliate <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="py-20 bg-[#FAFAFA] px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#0A1428] mb-12 text-center">How does it work?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => {
              const SIcon = s.icon;
              return (
                <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="bg-white rounded-[20px] p-8 border border-gray-200 text-center"
                >
                  <div className="w-14 h-14 bg-[#A3E635]/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <SIcon className="w-7 h-7 text-[#0A1428]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0A1428] mb-2">{i + 1}. {s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#0A1428] mb-12 text-center">Who can join?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whoCanJoin.map((w, i) => (
              <motion.div key={w.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.08 }}
                className="bg-white rounded-[20px] p-6 border border-gray-200"
              >
                <h3 className="font-bold text-[#0A1428] mb-4">{w.title}</h3>
                <ul className="space-y-2">
                  {w.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#FAFAFA] px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#0A1428] mb-12 text-center">What our partners say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
              <motion.div key={r.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.1 }}
                className="bg-white rounded-[20px] p-6 border border-gray-200"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[#A3E635] text-[#A3E635]" />
                  ))}
                </div>
                <Quote className="w-5 h-5 text-[#A3E635]/50 mb-2" />
                <p className="text-sm text-gray-600 leading-relaxed mb-4">&ldquo;{r.text}&rdquo;</p>
                <div>
                  <p className="font-bold text-[#0A1428] text-sm">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0A1428] relative overflow-hidden px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#A3E635]/3 rounded-full blur-[120px]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
            Start earning today
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">Join our affiliate program and start earning up to 30% commission on every sale you refer.</p>
          <Link href="/partners/apply?program=affiliate"
            className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl h-12 px-8 text-base shadow-xl shadow-[#A3E635]/20 transition-all inline-flex items-center">
            Become an Affiliate <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}


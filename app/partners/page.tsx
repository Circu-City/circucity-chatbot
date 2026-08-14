'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import MarketingShell from '@/components/marketing/MarketingShell';
import { ArrowRight, Group, Handshake, Megaphone, TrendingUp, HeadphonesIcon, BookOpen, ShieldCheck, Quote } from 'lucide-react';

const programs = [
  { slug: 'agency', title: 'Agency Partners', icon: Group, desc: 'Ideal for ecommerce, web development, marketing, and AI implementation agencies who refer, implement, or resell CircuCity AI for their clients.', revenue: 'Up to 25% revenue share', link: '/partners/agency' },
  { slug: 'affiliate', title: 'Affiliate Partners', icon: Megaphone, desc: 'Tailor made for influencers, content creators, bloggers, or businesses that want to promote CircuCity AI within their communities or followers.', revenue: 'Up to 30% commission', link: '/partners/affiliate' },
  { slug: 'ambassador', title: 'Ambassadors', icon: Handshake, desc: 'The simplest way for existing users to refer friends and earn a flat reward - no affiliate links or extra marketing required.', revenue: 'Up to $3,000 per referral', link: '/partners/ambassador' },
];

const benefits = [
  { icon: TrendingUp, title: 'Earn generous commissions', desc: 'Start earning immediately on any clients you refer. Recurring revenue that grows with you.' },
  { icon: HeadphonesIcon, title: 'Sales support', desc: 'Tap into new growth opportunities and sell with the CircuCity AI team by your side.' },
  { icon: BookOpen, title: 'Go-to-market resources', desc: 'Access partner specific training, co-marketing initiatives, and sales collateral to close more deals.' },
  { icon: ShieldCheck, title: 'Enterprise-level security', desc: "Your data and your clients' data are fully protected with enterprise-grade, SOC 2-examined security." },
];

export default function PartnersPage() {
  return (
    <MarketingShell>
      <section className="py-24 px-6 bg-gradient-to-b from-[#FAFAFA] to-white text-center">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">Partner Programs</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0A1428] leading-tight mb-4">
            Become a CircuCity <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3E635] to-[#9EF01A]">Partner</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">Find new clients, add new revenue streams, and get exclusive access to special offers and training.</p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {programs.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div key={p.slug} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="bg-white rounded-[24px] p-8 border border-gray-200 hover:shadow-lg hover:border-[#A3E635]/30 transition-all group flex flex-col"
                >
                  <div className="w-14 h-14 bg-[#A3E635]/15 rounded-2xl flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-[#0A1428]" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#0A1428] mb-3">{p.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-1">{p.desc}</p>
                  <p className="text-[#A3E635] font-bold text-sm mb-6">{p.revenue}</p>
                  <Link href={p.link} className="inline-flex items-center justify-center gap-2 bg-[#0A1428] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#1a2744] transition-all w-full">
                    Become a Partner <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#FAFAFA] border-t border-gray-100 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-[#0A1428] mb-3">Why partner with CircuCity AI?</h2>
            <p className="text-gray-500 text-sm">Join 300,000+ businesses and grow your revenue.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => {
              const BIcon = b.icon;
              return (
                <motion.div key={b.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.08 }}
                  className="bg-white rounded-[20px] p-6 border border-gray-200"
                >
                  <div className="w-10 h-10 bg-[#A3E635]/15 rounded-xl flex items-center justify-center mb-4">
                    <BIcon className="w-5 h-5 text-[#0A1428]" />
                  </div>
                  <h3 className="font-bold text-[#0A1428] mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#FAFAFA] rounded-[24px] p-8 md:p-12 border border-gray-200">
            <Quote className="w-8 h-8 text-[#A3E635] mb-4" />
            <p className="text-lg md:text-xl text-[#0A1428] leading-relaxed font-medium mb-6">
              &ldquo;The CircuCity AI team is an important strategic partner to our business. They deliver innovative AI-driven customer engagement solutions that help save our clients money while improving their overall experience.&rdquo;
            </p>
            <div>
              <p className="font-bold text-[#0A1428]">Denys Panchuk</p>
              <p className="text-sm text-gray-500">Customer Success Lead</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0A1428] relative overflow-hidden px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#A3E635]/3 rounded-full blur-[120px]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
            Finally, a partner program that truly feels like a partnership
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">Easy to join, easy to grow. Have questions? Our team is here to help.</p>
          <Link href="/partners/apply" className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl h-12 px-8 text-base shadow-xl shadow-[#A3E635]/20 transition-all inline-flex items-center">
            Apply now <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}


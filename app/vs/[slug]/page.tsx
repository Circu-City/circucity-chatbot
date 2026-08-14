'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, X, ArrowLeft, ArrowRight, Bot, ChevronDown, Star } from 'lucide-react';

type ComparisonData = {
  name: string;
  tagline: string;
  description: string;
  website: string;
  verdict: string;
  rating: number;
  categories: {
    name: string;
    rows: { feature: string; us: string; them: string; winner: 'us' | 'them' | 'tie' }[];
  }[];
  pricing: { us: string; them: string; note?: string };
};

const COMPARE: Record<string, ComparisonData> = {
  intercom: {
    name: 'Intercom',
    tagline: 'Enterprise chatbot for sales and support',
    description: 'Intercom is a customer communication platform designed for enterprise businesses. It combines chatbots, help desk, and sales tools in one platform ??? but at a premium price.',
    website: 'intercom.com',
    verdict: 'Intercom is powerful but overkill for most e-commerce stores. CircuCity AI delivers comparable AI support capabilities at a fraction of the cost, with built-in e-commerce features that Intercom lacks.',
    rating: 3,
    categories: [
      {
        name: 'AI Support',
        rows: [
          { feature: 'Product catalog understanding', us: 'Real-time inventory sync', them: 'Generic knowledge base', winner: 'us' },
          { feature: 'AI training on your data', us: 'Product docs, FAQs, policies', them: 'Help center articles only', winner: 'us' },
          { feature: 'Product recommendations', us: 'Context-aware, from live catalog', them: 'Manual rules only', winner: 'us' },
          { feature: 'Human handoff', us: 'Seamless with full context', them: 'Seamless', winner: 'tie' },
          { feature: 'Multi-language', us: 'Built-in, auto-detect', them: 'Per-language bot setup', winner: 'us' },
        ],
      },
      {
        name: 'E-commerce Features',
        rows: [
          { feature: 'Cart recovery', us: 'Proactive exit-intent', them: 'Not available', winner: 'us' },
          { feature: 'Product sync', us: 'Real-time API sync', them: 'Manual import', winner: 'us' },
          { feature: 'Unanswered question insights', us: 'Dashboard with AI suggestions', them: 'Basic reporting', winner: 'us' },
          { feature: 'Multi-store support', us: 'Up to unlimited stores', them: 'Not designed for multi-store', winner: 'us' },
        ],
      },
      {
        name: 'Pricing & Value',
        rows: [
          { feature: 'Starting price', us: 'Free plan available', them: '$74/mo (Essential)', winner: 'us' },
          { feature: 'AI conversations included', us: 'Included in all plans', them: 'Add-on at extra cost', winner: 'us' },
          { feature: 'Free trial', us: '14 days, no credit card', them: '14 days, credit card required', winner: 'us' },
          { feature: 'Setup time', us: 'Under 30 minutes', them: 'Days to weeks', winner: 'us' },
        ],
      },
    ],
    pricing: { us: 'From $0/mo', them: 'From $74/mo', note: 'Intercom charges extra for AI features' },
  },

  zendesk: {
    name: 'Zendesk',
    tagline: 'Enterprise help desk with AI add-ons',
    description: 'Zendesk is a leading customer service platform focused on ticketing and help desk functionality. Its AI features come as expensive add-ons, and it lacks native e-commerce capabilities.',
    website: 'zendesk.com',
    verdict: 'Zendesk is built for IT service desks, not e-commerce. CircuCity AI is purpose-built for online stores, with product catalog understanding, cart recovery, and e-commerce analytics that Zendesk simply doesn\'t offer.',
    rating: 2,
    categories: [
      {
        name: 'AI Support',
        rows: [
          { feature: 'Product catalog understanding', us: 'Real-time inventory sync', them: 'Not available', winner: 'us' },
          { feature: 'AI training on your data', us: 'Product docs, FAQs, policies', them: 'Zendesk AI add-on ($50+/mo)', winner: 'us' },
          { feature: 'Product recommendations', us: 'Context-aware, from live catalog', them: 'Not available', winner: 'us' },
          { feature: 'Human handoff', us: 'Seamless with full context', them: 'Ticketing system', winner: 'tie' },
          { feature: 'Multi-language', us: 'Built-in, auto-detect', them: 'Add-on feature', winner: 'us' },
        ],
      },
      {
        name: 'E-commerce Features',
        rows: [
          { feature: 'Cart recovery', us: 'Proactive exit-intent', them: 'Not available', winner: 'us' },
          { feature: 'Product sync', us: 'Real-time API sync', them: 'Not available', winner: 'us' },
          { feature: 'Unanswered question insights', us: 'Dashboard with AI suggestions', them: 'Basic analytics', winner: 'us' },
          { feature: 'Multi-store support', us: 'Up to unlimited stores', them: 'Separate instances needed', winner: 'us' },
        ],
      },
      {
        name: 'Pricing & Value',
        rows: [
          { feature: 'Starting price', us: 'Free plan available', them: '$55/mo (Team)', winner: 'us' },
          { feature: 'AI conversations included', us: 'Included in all plans', them: 'Add-on: $50+/mo per agent', winner: 'us' },
          { feature: 'Setup time', us: 'Under 30 minutes', them: 'Days to weeks', winner: 'us' },
          { feature: 'Built for e-commerce', us: 'Purpose-built', them: 'Generic ticketing', winner: 'us' },
        ],
      },
    ],
    pricing: { us: 'From $0/mo', them: 'From $55/mo + AI add-on', note: 'Zendesk AI costs extra per agent' },
  },

  gorgias: {
    name: 'Gorgias',
    tagline: 'E-commerce help desk for Shopify stores',
    description: 'Gorgias is a customer service platform built specifically for e-commerce, with deep Shopify integration. However, it focuses on ticketing and automation rules, not conversational AI.',
    website: 'gorgias.com',
    verdict: 'Gorgias is a solid help desk for Shopify stores, but its AI capabilities are limited to rule-based automation. CircuCity AI offers true conversational AI that understands your products and customers ??? not just keyword triggers.',
    rating: 4,
    categories: [
      {
        name: 'AI Support',
        rows: [
          { feature: 'Product catalog understanding', us: 'Real-time inventory sync', them: 'Order lookup only', winner: 'us' },
          { feature: 'AI training on your data', us: 'Product docs, FAQs, policies', them: 'Rule-based macros', winner: 'us' },
          { feature: 'Product recommendations', us: 'Context-aware, from live catalog', them: 'Not available', winner: 'us' },
          { feature: 'Human handoff', us: 'Seamless with full context', them: 'Ticketing system', winner: 'tie' },
          { feature: 'Conversational AI', us: 'LLM-powered, natural conversations', them: 'Keyword-triggered macros', winner: 'us' },
        ],
      },
      {
        name: 'E-commerce Features',
        rows: [
          { feature: 'Cart recovery', us: 'Proactive exit-intent', them: 'Basic abandoned cart', winner: 'us' },
          { feature: 'Product sync', us: 'Real-time API sync', them: 'Shopify integration', winner: 'tie' },
          { feature: 'Unanswered question insights', us: 'AI-suggested FAQ improvements', them: 'Macro analytics', winner: 'us' },
          { feature: 'Platform support', us: 'Any platform via API', them: 'Shopify-focused', winner: 'us' },
        ],
      },
      {
        name: 'Pricing & Value',
        rows: [
          { feature: 'Starting price', us: 'Free plan available', them: '$50/mo (Basic)', winner: 'us' },
          { feature: 'AI conversations included', us: 'Included in all plans', them: 'Not available native', winner: 'us' },
          { feature: 'Free trial', us: '14 days, no credit card', them: '7 days, credit card required', winner: 'us' },
          { feature: 'Setup time', us: 'Under 30 minutes', them: 'Hours to days', winner: 'us' },
        ],
      },
    ],
    pricing: { us: 'From $0/mo', them: 'From $50/mo', note: 'Gorgias charges per ticket, not per conversation' },
  },

  'tawk-to': {
    name: 'Tawk.to',
    tagline: 'Free live chat with basic automation',
    description: 'Tawk.to is a popular free live chat solution. While the price is right, its AI capabilities are extremely limited and it has no e-commerce-specific features like product understanding or cart recovery.',
    website: 'tawk.to',
    verdict: 'Tawk.to is great for simple live chat at zero cost, but it is not an AI chatbot. CircuCity AI offers true conversational AI, product understanding, cart recovery, and analytics ??? features Tawk.to simply cannot match. For an extra $49/mo, you get 10x the capability.',
    rating: 2,
    categories: [
      {
        name: 'AI Support',
        rows: [
          { feature: 'Product catalog understanding', us: 'Real-time inventory sync', them: 'Not available', winner: 'us' },
          { feature: 'AI training on your data', us: 'Product docs, FAQs, policies', them: 'Basic canned responses', winner: 'us' },
          { feature: 'Product recommendations', us: 'Context-aware, from live catalog', them: 'Not available', winner: 'us' },
          { feature: 'Human handoff', us: 'Seamless with full context', them: 'Live chat only', winner: 'us' },
          { feature: 'Conversational AI', us: 'LLM-powered, natural conversations', them: 'Keyword triggers only', winner: 'us' },
        ],
      },
      {
        name: 'E-commerce Features',
        rows: [
          { feature: 'Cart recovery', us: 'Proactive exit-intent', them: 'Not available', winner: 'us' },
          { feature: 'Product sync', us: 'Real-time API sync', them: 'Not available', winner: 'us' },
          { feature: 'Analytics', us: 'Detailed dashboards', them: 'Basic chat logs', winner: 'us' },
          { feature: 'Widget customization', us: 'Full brand control', them: 'Limited', winner: 'us' },
        ],
      },
      {
        name: 'Pricing & Value',
        rows: [
          { feature: 'Starting price', us: 'Free plan available', them: 'Free', winner: 'tie' },
          { feature: 'AI conversations', us: 'Included', them: 'Not available', winner: 'us' },
          { feature: 'Branding', us: 'Remove branding on paid plans', them: 'Tawk.to branding on free', winner: 'us' },
          { feature: 'Support', us: 'Email & priority support', them: 'Community only on free', winner: 'us' },
        ],
      },
    ],
    pricing: { us: 'From $0/mo', them: 'Free', note: 'Tawk.to is free but lacks AI entirely' },
  },

  drift: {
    name: 'Drift',
    tagline: 'Enterprise conversational marketing platform',
    description: 'Drift (now part of Salesloft) is a conversational marketing and sales platform focused on B2B lead generation. It is expensive, enterprise-focused, and not designed for e-commerce product support.',
    website: 'drift.com',
    verdict: 'Drift is built for B2B sales conversations, not e-commerce support. CircuCity AI is purpose-built for online stores with product catalog understanding, cart recovery, and multi-store support ??? capabilities Drift doesn\'t offer at any price.',
    rating: 3,
    categories: [
      {
        name: 'AI Support',
        rows: [
          { feature: 'Product catalog understanding', us: 'Real-time inventory sync', them: 'Not available', winner: 'us' },
          { feature: 'AI training on your data', us: 'Product docs, FAQs, policies', them: 'Playbook-based only', winner: 'us' },
          { feature: 'Product recommendations', us: 'Context-aware, from live catalog', them: 'Not available', winner: 'us' },
          { feature: 'Human handoff', us: 'Seamless with full context', them: 'Routing to sales reps', winner: 'tie' },
          { feature: 'Multi-language', us: 'Built-in, auto-detect', them: 'English only', winner: 'us' },
        ],
      },
      {
        name: 'E-commerce Features',
        rows: [
          { feature: 'Cart recovery', us: 'Proactive exit-intent', them: 'Not available', winner: 'us' },
          { feature: 'Product sync', us: 'Real-time API sync', them: 'CRM integration', winner: 'us' },
          { feature: 'Analytics dashboard', us: 'E-commerce-specific metrics', them: 'B2B sales metrics', winner: 'us' },
          { feature: 'Multi-store support', us: 'Up to unlimited stores', them: 'Not available', winner: 'us' },
        ],
      },
      {
        name: 'Pricing & Value',
        rows: [
          { feature: 'Starting price', us: 'Free plan available', them: '$400/mo (Premium)', winner: 'us' },
          { feature: 'AI conversations included', us: 'Included in all plans', them: 'Add-on pricing', winner: 'us' },
          { feature: 'Target audience', us: 'E-commerce stores', them: 'B2B sales teams', winner: 'us' },
          { feature: 'Setup time', us: 'Under 30 minutes', them: 'Weeks with implementation', winner: 'us' },
        ],
      },
    ],
    pricing: { us: 'From $0/mo', them: 'From $400/mo', note: 'Drift requires annual contracts' },
  },
};

function Rating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= count ? 'fill-[#A3E635] text-[#A3E635]' : 'text-gray-300'}`} />
      ))}
    </div>
  );
}

export default function VsPage({ params }: { params: { slug: string } }) {
  const competitor = COMPARE[params.slug];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (!competitor) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-extrabold text-[#0A1428] mb-2">Comparison not found</h1>
          <p className="text-gray-500 text-sm mb-4">We haven\'t written a comparison for this tool yet.</p>
          <Link href="/pricing" className="text-[#A3E635] font-semibold text-sm hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to pricing
          </Link>
        </div>
      </div>
    );
  }

  const { name, tagline, description, website, verdict, rating, categories, pricing } = competitor;
  const slug = params.slug;

  return (
    <div className="min-h-screen bg-white">
      {/* ??????????????? NAV ??????????????? */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#A3E635] rounded-lg flex items-center justify-center">
              <Bot className="text-[#0A1428] w-4 h-4" />
            </div>
            <span className="text-lg font-extrabold text-[#0A1428]">CircuCity <span className="text-[#A3E635]">AI</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-[#0A1428] transition-colors">Pricing</Link>
            <Link href="/sign-up" className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl px-5 py-2 text-sm transition-all shadow-sm">
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ??????????????? HERO ??????????????? */}
      <section className="py-16 bg-gradient-to-b from-white to-[#FAFAFA] border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/pricing" className="text-sm text-gray-400 hover:text-[#0A1428] inline-flex items-center gap-1 mb-6 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to pricing
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0A1428]">
                  CircuCity AI vs{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3E635] to-[#9EF01A]">{name}</span>
                </h1>
              </div>
              <p className="text-gray-500 max-w-2xl">{tagline}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-gray-400">Our rating:</span>
              <Rating count={rating} />
            </div>
          </div>
        </div>
      </section>

      {/* ??????????????? PRICING COMPARISON ??????????????? */}
      <section className="py-12 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-5">
            <div className="rounded-[20px] border-2 border-[#A3E635] bg-[#A3E635]/5 p-6 relative">
              <div className="absolute -top-3 left-6 bg-[#A3E635] text-[#0A1428] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Winner</div>
              <div className="text-sm font-semibold text-gray-500 mb-1">CircuCity AI</div>
              <div className="text-3xl font-extrabold text-[#0A1428]">{pricing.us}</div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle2 className="w-3.5 h-3.5 text-[#A3E635]" /> AI conversations included</div>
                <div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle2 className="w-3.5 h-3.5 text-[#A3E635]" /> No credit card required</div>
                <div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle2 className="w-3.5 h-3.5 text-[#A3E635]" /> 14-day free trial</div>
              </div>
            </div>

            <div className="rounded-[20px] border border-gray-200 p-6 bg-white flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
                  <X className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-lg font-bold text-[#0A1428] mb-1">{name}</p>
                <p className="text-sm text-gray-400">{pricing.them}</p>
                {pricing.note && <p className="text-xs text-gray-400 mt-1">{pricing.note}</p>}
              </div>
            </div>

            <div className="rounded-[20px] border border-gray-200 p-6 bg-[#FAFAFA]">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">The difference</div>
              <div className="text-3xl font-extrabold text-[#A3E635] mb-1">Save up to 100%</div>
              <div className="text-sm text-gray-500">on AI support costs with CircuCity AI vs {name}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ??????????????? HEAD-TO-HEAD COMPARISON ??????????????? */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-[#0A1428] mb-10">Head-to-head comparison</h2>

          {categories.map((cat, ci) => (
            <div key={ci} className="mb-12">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">{cat.name}</h3>
              <div className="overflow-hidden rounded-[20px] border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3.5 px-5 w-[34%]">
                        <span className="text-xs font-semibold text-gray-500">Feature</span>
                      </th>
                      <th className="py-3.5 px-5 w-[33%]">
                        <span className="text-xs font-semibold text-[#A3E635]">CircuCity AI</span>
                      </th>
                      <th className="py-3.5 px-5 w-[33%]">
                        <span className="text-xs font-semibold text-gray-500">{name}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.rows.map((row, ri) => (
                      <tr key={ri} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-5">
                          <span className="text-sm text-gray-700 font-medium">{row.feature}</span>
                        </td>
                        <td className={`py-4 px-5 text-center ${row.winner === 'us' ? 'bg-[#A3E635]/5' : ''}`}>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-sm text-gray-600">{row.us}</span>
                            {row.winner === 'us' && <CheckCircle2 className="w-3.5 h-3.5 text-[#A3E635] shrink-0" />}
                          </div>
                        </td>
                        <td className={`py-4 px-5 text-center ${row.winner === 'them' ? 'bg-red-50/50' : ''}`}>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-sm text-gray-500">{row.them}</span>
                            {row.winner === 'them' && <CheckCircle2 className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ??????????????? VERDICT ??????????????? */}
      <section className="py-16 bg-gradient-to-b from-[#FAFAFA] to-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-[#A3E635]/10 border border-[#A3E635]/20 rounded-full px-4 py-1.5 mb-6">
            <Star className="w-4 h-4 text-[#A3E635]" />
            <span className="text-xs font-semibold text-[#0A1428]">Our Verdict</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A1428] leading-tight mb-6">
            Why CircuCity AI wins over {name}
          </h2>
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto mb-8">{verdict}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl h-12 px-8 text-base shadow-lg shadow-[#A3E635]/20 transition-all inline-flex items-center"
            >
              Try CircuCity AI free
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link
              href={`https://${website}`}
              target="_blank"
              className="border border-gray-200 text-gray-600 hover:border-gray-300 rounded-xl h-12 px-8 text-base inline-flex items-center transition-all"
            >
              Visit {name}
            </Link>
          </div>
        </div>
      </section>

      {/* ??????????????? OTHER COMPARISONS ??????????????? */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-lg font-bold text-[#0A1428] mb-6">More comparisons</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(COMPARE).filter(([k]) => k !== slug).map(([key, comp]) => (
              <Link
                key={key}
                href={`/vs/${key}`}
                className="border border-gray-200 rounded-[16px] p-5 hover:border-[#A3E635]/40 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-[#0A1428]">vs {comp.name}</h4>
                  <Rating count={comp.rating} />
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{comp.tagline}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ??????????????? CTA ??????????????? */}
      <section className="py-20 bg-[#0A1428] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#A3E635]/3 rounded-full blur-[120px]" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
            See the difference for yourself
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">
            Start your 14-day free trial. No credit card. No risk.
          </p>
          <Link
            href="/sign-up"
            className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl h-12 px-8 text-base shadow-xl shadow-[#A3E635]/20 transition-all inline-flex items-center"
          >
            Start free trial
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="bg-[#060E1E] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#A3E635] rounded-lg flex items-center justify-center">
              <Bot className="text-[#0A1428] w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-extrabold text-white">CircuCity <span className="text-[#A3E635]">AI</span></span>
          </div>
          <p className="text-xs text-gray-500">&copy; 2026 CircuCity AI. All rights reserved.</p>
          <Link href="/pricing" className="text-xs text-gray-500 hover:text-gray-300">Pricing</Link>
        </div>
      </footer>
    </div>
  );
}


'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, X, HelpCircle, ChevronDown, ArrowRight, Bot, Star, ShieldCheck } from 'lucide-react';
import MarketingShell from '@/components/marketing/MarketingShell';

const plans = [
  {
    name: 'Starter',
    desc: 'Get started with essential AI support for your store.',
    monthlyPrice: 0,
    annualPrice: 0,
    popular: false,
    cta: 'Start free',
    href: '/sign-up?plan=starter',
    features: [
      '1,000 messages/mo',
      '1 store integration',
      'Basic AI product training',
      'Widget embed',
      'Email support',
    ],
  },
  {
    name: 'Growth',
    desc: 'Scale AI support across multiple stores with advanced insights.',
    monthlyPrice: 49,
    annualPrice: 39,
    popular: true,
    cta: 'Try 14 days free',
    href: '/sign-up?plan=growth',
    features: [
      '10,000 messages/mo',
      '3 store integrations',
      'Advanced AI product training',
      'Real-time product sync',
      'Proactive cart recovery',
      'Detailed analytics dashboard',
      'Priority support',
    ],
  },
  {
    name: 'Scale',
    desc: 'Custom AI training and dedicated support for growing teams.',
    monthlyPrice: 149,
    annualPrice: 119,
    popular: false,
    cta: 'Try 14 days free',
    href: '/sign-up?plan=scale',
    features: [
      '50,000 messages/mo',
      '10 store integrations',
      'Custom LLM training on your data',
      'Multi-language support',
      'Human handoff API',
      'Unanswered question insights',
      'Custom reporting',
      'Dedicated account manager',
    ],
  },
  {
    name: 'Enterprise',
    desc: 'Unlimited everything. White-label, SSO, and custom SLAs.',
    monthlyPrice: null,
    annualPrice: null,
    popular: false,
    cta: 'Contact sales',
    href: '/contact',
    features: [
      'Unlimited messages',
      'Unlimited stores',
      'Custom model fine-tuning',
      'White-label widget',
      'SSO / SAML',
      'Custom integrations',
      '99.99% SLA',
      'Dedicated success manager',
    ],
  },
];

const allFeatures = [
  {
    category: 'Messages & Stores',
    rows: [
      { name: 'Messages per month', free: '1,000', growth: '10,000', scale: '50,000', enterprise: 'Unlimited' },
      { name: 'Store integrations', free: '1', growth: '3', scale: '10', enterprise: 'Unlimited' },
    ],
  },
  {
    category: 'AI Capabilities',
    rows: [
      { name: 'Product catalog training', free: '✓', growth: '✓', scale: '✓', enterprise: '✓' },
      { name: 'Real-time inventory sync', free: '—', growth: '✓', scale: '✓', enterprise: '✓' },
      { name: 'Custom LLM fine-tuning', free: '—', growth: '—', scale: '✓', enterprise: '✓' },
      { name: 'Multi-language support', free: '—', growth: '—', scale: '✓', enterprise: '✓' },
    ],
  },
  {
    category: 'Sales & Conversion',
    rows: [
      { name: 'Widget embed', free: '✓', growth: '✓', scale: '✓', enterprise: '✓' },
      { name: 'Proactive cart recovery', free: '—', growth: '✓', scale: '✓', enterprise: '✓' },
      { name: 'Exit-intent triggers', free: '—', growth: '—', scale: '✓', enterprise: '✓' },
      { name: 'Custom chat flows', free: '—', growth: '—', scale: '✓', enterprise: '✓' },
    ],
  },
  {
    category: 'Support & Analytics',
    rows: [
      { name: 'Analytics dashboard', free: 'Basic', growth: 'Detailed', scale: 'Custom', enterprise: 'Custom' },
      { name: 'Unanswered question insights', free: '—', growth: '✓', scale: '✓', enterprise: '✓' },
      { name: 'Human handoff API', free: '—', growth: '—', scale: '✓', enterprise: '✓' },
      { name: 'Email support', free: '✓', growth: 'Priority', scale: 'Priority', enterprise: 'Dedicated' },
      { name: 'Dedicated account manager', free: '—', growth: '—', scale: '✓', enterprise: '✓' },
    ],
  },
  {
    category: 'Enterprise',
    rows: [
      { name: 'White-label widget', free: '—', growth: '—', scale: '—', enterprise: '✓' },
      { name: 'SSO / SAML', free: '—', growth: '—', scale: '—', enterprise: '✓' },
      { name: '99.99% SLA', free: '—', growth: '—', scale: '—', enterprise: '✓' },
      { name: 'Custom integrations', free: '—', growth: '—', scale: '✓', enterprise: '✓' },
    ],
  },
];

const faqs = [
  {
    q: 'What counts as a "message"?',
    a: 'Any customer message sent to the chatbot counts as one message. AI responses are unlimited. You only pay for incoming customer messages.',
  },
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes. Upgrade or downgrade at any time. Changes take effect immediately, and we prorate billing.',
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'Yes. All paid plans come with a 14-day free trial. No credit card required. Cancel anytime.',
  },
  {
    q: 'What if I need more messages or stores?',
    a: 'The Scale plan handles up to 50k messages across 10 stores. Beyond that, our Enterprise plan offers unlimited usage. Contact sales for a custom quote.',
  },
  {
    q: 'Do you offer discounts for annual billing?',
    a: 'Yes. Annual billing saves you roughly 20% compared to monthly billing. The pricing shown reflects both options.',
  },
  {
    q: 'Can I train the AI on my own product data?',
    a: 'Yes. Every plan includes product catalog training. The AI learns your inventory, categories, pricing, and policies — making recommendations accurate and context-aware. Scale and Enterprise plans add custom LLM fine-tuning.',
  },
];

function CheckMark() { return <CheckCircle2 className="w-4 h-4 text-[#A3E635]" />; }
function CrossMark() { return <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center"><X className="w-2.5 h-2.5 text-gray-300" /></div>; }

function FeatureValue({ val }: { val: string }) {
  if (val === '✓') return <CheckMark />;
  if (val === '—') return <CrossMark />;
  return <span className="text-sm text-gray-600">{val}</span>;
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const planKeys = ['free', 'growth', 'scale', 'enterprise'] as const;

  return (
    <MarketingShell>
      {/* ───── NAV ───── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#A3E635] rounded-lg flex items-center justify-center">
              <Bot className="text-[#0A1428] w-4 h-4" />
            </div>
            <span className="text-lg font-extrabold text-[#0A1428]">
              CircuCity <span className="text-[#A3E635]">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm text-gray-500 hover:text-[#0A1428] transition-colors">Sign in</Link>
            <Link href="/sign-up" className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl px-5 py-2 text-sm transition-all shadow-sm">
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── HERO ───── */}
      <section className="py-20 text-center px-6 bg-gradient-to-b from-white to-[#FAFAFA]">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">Pricing</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0A1428] leading-tight mb-4">
            Simple, transparent{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3E635] to-[#9EF01A]">pricing</span>
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-lg">
            Start for free. Scale as you grow. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      {/* ───── BILLING TOGGLE ───── */}
      <div className="flex items-center justify-center gap-4 pt-4 pb-10">
        <span className={`text-sm font-medium ${!annual ? 'text-[#0A1428]' : 'text-gray-400'}`}>Monthly</span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative w-14 h-7 rounded-full transition-colors ${annual ? 'bg-[#A3E635]' : 'bg-gray-200'}`}
        >
          <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${annual ? 'left-[calc(100%_-_1.625rem)]' : 'left-0.5'}`} />
        </button>
        <span className={`text-sm font-medium ${annual ? 'text-[#0A1428]' : 'text-gray-400'}`}>Annual</span>
        {annual && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Save ~20%</span>
        )}
      </div>

      {/* ───── PLAN CARDS ───── */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-4 gap-5">
          {plans.map((p, i) => {
            const price = annual ? p.annualPrice : p.monthlyPrice;
            return (
              <div
                key={i}
                className={`relative flex flex-col rounded-[24px] transition-all duration-300 ${
                  p.popular
                    ? 'bg-[#0A1428] text-white scale-[1.03] shadow-2xl ring-2 ring-[#A3E635] z-10'
                    : 'bg-white text-[#0A1428] border border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300'
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#A3E635] text-[#0A1428] text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                    Most Popular
                  </div>
                )}
                <div className="p-7 flex-1 flex flex-col">
                  <div className="mb-6">
                    <h3 className={`text-lg font-bold mb-1 ${p.popular ? 'text-white' : 'text-[#0A1428]'}`}>{p.name}</h3>
                    <p className={`text-sm ${p.popular ? 'text-gray-400' : 'text-gray-500'}`}>{p.desc}</p>
                  </div>

                  {price !== null ? (
                    <div className="mb-6">
                      <span className={`text-4xl font-extrabold ${p.popular ? 'text-white' : 'text-[#0A1428]'}`}>
                        ${price}
                      </span>
                      <span className={`text-sm ml-1 ${p.popular ? 'text-gray-400' : 'text-gray-500'}`}>
                        /mo
                      </span>
                      {annual && price > 0 && (
                        <div className={`text-xs mt-0.5 ${p.popular ? 'text-[#A3E635]' : 'text-emerald-600'}`}>
                          ${p.monthlyPrice}/mo billed annually
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-6">
                      <span className={`text-3xl font-extrabold ${p.popular ? 'text-white' : 'text-[#0A1428]'}`}>Custom</span>
                    </div>
                  )}

                  <ul className="space-y-3 mb-8 flex-1">
                    {p.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${p.popular ? 'text-[#A3E635]' : 'text-[#A3E635]'}`} />
                        <span className={`text-sm ${p.popular ? 'text-gray-300' : 'text-gray-600'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {p.href === '/contact' ? (
                    <Link
                      href={p.href}
                      className={`block text-center py-3.5 rounded-xl font-semibold text-sm transition-all ${
                        p.popular
                          ? 'bg-[#A3E635] text-[#0A1428] hover:bg-[#8DC92E] shadow-lg shadow-[#A3E635]/20'
                          : 'bg-[#0A1428] text-white hover:bg-[#1a2744]'
                      }`}
                    >
                      {p.cta}
                    </Link>
                  ) : (
                    <Link
                      href={p.href}
                      className={`block text-center py-3.5 rounded-xl font-semibold text-sm transition-all ${
                        p.popular
                          ? 'bg-[#A3E635] text-[#0A1428] hover:bg-[#8DC92E] shadow-lg shadow-[#A3E635]/20'
                          : 'bg-gray-100 text-[#0A1428] hover:bg-gray-200'
                      }`}
                    >
                      {p.cta}
                      <ArrowRight className="inline ml-1.5 w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ───── GUARANTEE BANNER ───── */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="bg-gradient-to-r from-[#A3E635]/10 to-emerald-50 rounded-[24px] p-8 text-center border border-[#A3E635]/20">
          <div className="flex items-center justify-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-[#0A1428]">14-Day Free Trial</span>
          </div>
          <p className="text-sm text-gray-500 max-w-lg mx-auto">
            Every paid plan comes with a full 14-day free trial. No credit card required. 
            Cancel anytime with one click. If CircuCity AI isn't the right fit, we'll help 
            you export your data.
          </p>
        </div>
      </div>

      {/* ───── FEATURE COMPARISON TABLE ───── */}
      <section className="py-20 bg-[#FAFAFA] border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-[#0A1428] mb-3">Compare plans in detail</h2>
            <p className="text-gray-500 text-sm">Every feature across every plan. No smoke and mirrors.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 pr-6 w-[220px]">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Feature</span>
                  </th>
                  {plans.map((p, i) => (
                    <th key={i} className={`py-4 px-4 text-center ${p.popular ? 'bg-[#0A1428]/5' : ''}`}>
                      <span className={`text-sm font-bold ${p.popular ? 'text-[#A3E635]' : 'text-[#0A1428]'}`}>{p.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((section, si) => (
                  <>
                    <tr key={`cat-${si}`} className="border-b border-gray-100">
                      <td colSpan={5} className="py-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{section.category}</span>
                      </td>
                    </tr>
                    {section.rows.map((row, ri) => (
                      <tr key={`row-${si}-${ri}`} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 pr-6">
                          <span className="text-sm text-gray-700">{row.name}</span>
                        </td>
                        {planKeys.map((key, pi) => (
                          <td key={pi} className={`py-3.5 px-4 text-center ${plans[pi].popular ? 'bg-[#0A1428]/5' : ''}`}>
                            <div className="flex justify-center">
                              <FeatureValue val={row[key]} />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-[#0A1428] mb-3">Pricing FAQ</h2>
            <p className="text-gray-500 text-sm">Everything you need to know about our plans and billing.</p>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-[16px] overflow-hidden hover:border-gray-300 transition-colors">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-semibold text-[#0A1428] text-sm">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                    openFaq === i ? 'rotate-180' : ''
                  }`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="py-20 bg-[#0A1428] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#A3E635]/3 rounded-full blur-[120px]" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
            Ready to transform your e-commerce support?
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">
            Join your favourite e-commerce brands using CircuCity AI. Start free, no credit card needed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl h-12 px-8 text-base shadow-xl shadow-[#A3E635]/20 transition-all inline-flex items-center"
            >
              Start free trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="border border-white/20 text-white hover:bg-white/10 rounded-xl h-12 px-8 text-base inline-flex items-center transition-all"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </section>

    </MarketingShell>
  );
}

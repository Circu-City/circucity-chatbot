import MarketingShell from '@/components/marketing/MarketingShell';
import {
  Bot, Camera, Cable, Check, Globe2, LayoutDashboard, Rocket, ShoppingBag, Sparkles, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

const PILLARS = [
  {
    icon: ShoppingBag,
    title: 'CircuCity Marketplace',
    tag: 'Free to join',
    pricing: 'Fees only — if you sell',
    points: [
      'Create a store in minutes',
      'List products and sell to CircuCity customers',
      'Buyer protection, featured listings, shipping & ads',
    ],
    href: 'https://circucity.se/',
    cta: 'Explore',
  },
  {
    icon: Camera,
    title: 'Gavriel Listing AI',
    tag: 'Live product',
    pricing: 'From €29/month',
    points: [
      'Photograph stock — AI drafts the listing',
      'Title, category, condition, price & weight from real market data',
      'Publish straight to Shopify, WooCommerce, eBay, Etsy or your webhook',
    ],
    href: '/dashboard/listing',
    cta: 'Open the Listings app',
    secondaryHref: '/demo/listing',
    secondaryCta: 'Try the free test desk',
  },
  {
    icon: Bot,
    title: 'Cira Assistant',
    tag: 'Premium SaaS',
    pricing: 'Subscription',
    points: [
      'One AI answering customers on your store',
      'Learns your catalog, pages, FAQs and policies',
      'Works on any platform, in minutes',
    ],
    href: '/features',
    cta: 'Explore',
  },
];

const TIERS = [
  {
    name: 'Free',
    price: '0',
    unit: '/month',
    blurb: 'Sell on the CircuCity Marketplace.',
    features: ['Sell on CircuCity Marketplace', 'Basic listings', 'Buyer protection', 'Marketplace customers'],
    cta: 'Open a store',
    href: 'https://circucity.se/',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '€29',
    unit: '/month',
    blurb: 'One store, AI listing generation.', 
    features: ['Connect one external store', 'Bulk AI listing generation', 'AI pricing suggestions', 'Publish to Shopify, WooCommerce, eBay or Etsy', 'CSV / JSON listing export'],
    cta: 'Open the Listings app',
    href: '/dashboard/listing',
    highlight: true,
  },
  {
    name: 'Professional',
    price: '€79',
    unit: '/month',
    blurb: 'Multi-store hub with cross-platform publishing.',
    features: ['Unlimited connected stores', 'Cross-platform publishing', 'Advanced analytics & demand forecasting', 'CO₂ & sustainability reporting', 'Team accounts'],
    cta: 'Contact us',
    href: '/contact',
    highlight: false,
  },
  {
    name: 'Enterprise',
    price: '€199+',
    unit: '/month',
    blurb: 'Volume sellers, agencies and marketplaces.',
    features: ['Volume AI analysis', 'Dedicated support', 'Custom integrations', 'SLA & onboarding'],
    cta: 'Talk to sales',
    href: '/contact',
    highlight: false,
  },
];

const CONNECTORS = [
  { name: 'Shopify', via: 'OAuth — publishes drafts to your store' },
  { name: 'WooCommerce', via: 'REST API key — publishes live products' },
  { name: 'eBay', via: 'OAuth — creates inventory items & offers' },
  { name: 'Etsy', via: 'OAuth — creates drafts with your photos' },
  { name: 'Webhook / API', via: 'Signed HTTP push to any endpoint' },
];

export default function GavrielListingAIPage() {
  return (
    <MarketingShell darkHero>
      <section className="py-28 bg-dark-navy text-white text-center px-6">
        <div className="mx-auto max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-lemon-green/10 px-4 py-1.5 text-sm font-bold text-lemon-green">
            <Rocket className="h-4 w-4" /> Gavriel Listing AI
          </span>
          <h1 className="mt-6 text-4xl lg:text-6xl font-extrabold leading-tight">
            Photograph it.
            <br />
            AI lists it. <span className="text-lemon-green">Publish everywhere.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            Gavriel Listing AI turns a photo of any item into a complete, market-priced
            listing — title, category, condition, price and weight — then publishes it as a
            real draft to the stores you already sell on: Shopify, WooCommerce, eBay, Etsy
            or your own webhook.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/dashboard/listing">
              <span className="inline-flex h-12 items-center gap-2 rounded-xl bg-lemon-gradient px-8 font-black text-dark-navy hover:opacity-90 transition">
                <Camera className="h-5 w-5" /> Open the Listings app
              </span>
            </Link>
            <Link href="/demo/listing">
              <span className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/20 px-8 font-bold text-white hover:bg-white/10 transition">
                <Sparkles className="h-5 w-5" /> Try the free test desk — no account
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-black uppercase tracking-[0.24em] text-gray-400">Three products, one upgrade path</p>
          <h2 className="mt-2 text-center text-3xl lg:text-4xl font-extrabold text-dark-navy">The Source of <span className="text-[#66711a]">customers</span> becomes the source of your SaaS</h2>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div key={pillar.title} className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <span className="rounded-2xl bg-lemon-green/15 p-3"><pillar.icon className="h-6 w-6 text-[#52650c]" /></span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">{pillar.tag}</span>
                </div>
                <h3 className="mt-5 text-xl font-extrabold text-dark-navy">{pillar.title}</h3>
                <p className="mt-1 text-sm font-bold text-gray-400">{pillar.pricing}</p>
                <ul className="mt-5 space-y-2.5 text-sm text-gray-600">
                  {pillar.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#52650c]" /> {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap items-baseline gap-4">
                  <Link href={pillar.href} className="inline-flex items-center gap-1.5 text-sm font-bold text-dark-navy hover:text-[#52650c]">
                    {pillar.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                  {pillar.secondaryHref && (
                    <Link href={pillar.secondaryHref} className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-[#52650c]">
                      {pillar.secondaryCta}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-dark-navy px-6 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-lemon-green">The upgrade path</p>
            <h2 className="mt-2 text-3xl lg:text-4xl font-extrabold">Free marketplace → Gavriel Listing AI</h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              Sellers invest in a complete system that helps them grow — real publishing to the
              channels they already sell on.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((tier) => (
              <div key={tier.name} className={`rounded-3xl p-6 ${tier.highlight ? 'bg-lemon-gradient text-dark-navy shadow-2xl shadow-lemon-green/20' : 'bg-white/5 border border-white/10'}`}>
                <h3 className={`text-lg font-extrabold ${tier.highlight ? 'text-dark-navy' : 'text-white'}`}>{tier.name}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className={`text-4xl font-black ${tier.highlight ? 'text-dark-navy' : 'text-white'}`}>{tier.price}</span>
                  <span className={`text-sm font-medium ${tier.highlight ? 'text-dark-navy/60' : 'text-gray-400'}`}>{tier.unit}</span>
                </div>
                <p className={`mt-2 text-sm ${tier.highlight ? 'text-dark-navy/70' : 'text-gray-400'}`}>{tier.blurb}</p>
                <ul className={`mt-5 space-y-2.5 text-sm ${tier.highlight ? 'text-dark-navy/80' : 'text-gray-300'}`}>
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${tier.highlight ? 'text-dark-navy' : 'text-lemon-green'}`} /> {feature}
                    </li>
                  ))}
                </ul>
                <Link href={tier.href}>
                  <span className={`mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl font-black transition ${tier.highlight ? 'bg-dark-navy text-lemon-green hover:opacity-90' : 'bg-lemon-gradient text-dark-navy hover:opacity-90'}`}>
                    {tier.cta}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-black uppercase tracking-[0.24em] text-gray-400">Connectors</p>
          <h2 className="mt-2 text-center text-3xl lg:text-4xl font-extrabold text-dark-navy">Publish real drafts to your <span className="text-[#66711a]">existing stores</span></h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CONNECTORS.map((connector) => (
              <div key={connector.name} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-dark-navy">
                  <Cable className="h-4 w-4 text-[#52650c]" /> {connector.name}
                </div>
                <p className="mt-1.5 text-sm text-gray-500">{connector.via}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">
            The public test desk uses generated sample data with a daily cap. Sign in, connect your store,
            and the same desk publishes real drafts to your live channels.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl rounded-3xl bg-lemon-gradient p-10 text-center text-dark-navy">
          <h2 className="text-3xl font-extrabold">See 200 listings become 200 published drafts.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-dark-navy/70">
            Capture a few photos in the test desk to watch Gavriel AI write every listing — then
            sign in, connect your store, and publish for real.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="/dashboard/listing">
              <span className="inline-flex h-12 items-center gap-2 rounded-xl bg-dark-navy px-8 font-black text-lemon-green hover:opacity-90 transition">
                <Camera className="h-5 w-5" /> Open the Listings app
              </span>
            </Link>
            <Link href="/demo/listing">
              <span className="inline-flex h-12 items-center gap-2 rounded-xl border-2 border-dark-navy/30 px-8 font-bold text-dark-navy hover:bg-dark-navy/10 transition">
                <Sparkles className="h-5 w-5" /> Try the free test desk
              </span>
            </Link>
            <Link href="/api-docs">
              <span className="inline-flex h-12 items-center gap-2 rounded-xl border-2 border-dark-navy/30 px-8 font-bold text-dark-navy hover:bg-dark-navy/10 transition">
                <LayoutDashboard className="h-5 w-5" /> Read the Listing API
              </span>
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
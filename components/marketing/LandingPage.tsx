'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, Zap, ShieldCheck, BarChart3, Globe,
  ShoppingBag, Bot, MessageSquare, Play, Sparkles, ChevronDown, HeadphonesIcon,
  Star, Quote, TrendingUp, Clock, Users, RefreshCw, Search, ShoppingCart,
  DollarSign, ThumbsUp, Layers, Smartphone, Mail, Camera, Cable
} from 'lucide-react';
import Header from '@/components/marketing/Header';
import Footer from '@/components/marketing/Footer';
import { Button } from '@/components/ui/button';
import { industries } from '@/lib/industries';

const featuredIndustries = industries.slice(0, 6);

const platformStats = [
  { value: '73%', label: 'avg auto-resolution' },
  { value: '< 2s', label: 'response time' },
  { value: '13+', label: 'industry templates' },
  { value: '24/7', label: 'always-on support' },
];

const integrations = [
  { name: 'Shopify', icon: 'https://cdn.simpleicons.org/shopify/0A1428' },
  { name: 'WooCommerce', icon: 'https://cdn.simpleicons.org/woocommerce/0A1428' },
  { name: 'Stripe', icon: 'https://cdn.simpleicons.org/stripe/0A1428' },
  { name: 'Slack', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/slack.svg' },
  { name: 'Zapier', icon: 'https://cdn.simpleicons.org/zapier/0A1428' },
  { name: 'REST API', icon: 'https://cdn.simpleicons.org/swagger/0A1428' },
];

const industryIcons: Record<string, string> = {
  shirt: '👕',
  sparkles: '💄',
  home: '🏠',
  'utensils-crossed': '🥗',
  'heart-pulse': '💊',
  'monitor-smartphone': '💻',
  'rotate-3d': '📦',
  'dollar-sign': '💳',
  'book-open': '📚',
  plane: '✈️',
  briefcase: '💼',
};

const testimonials = [
  {
    quote: "CircuCity AI handles 73% of our support tickets automatically. Our team went from drowning in repetitive questions to focusing on high-value customer conversations.",
    author: 'Sarah Chen',
    role: 'Customer Success Lead, Nordic Boutique',
    stat: '73%',
    statLabel: 'auto-resolution rate',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1765005204227-bf58bcdd4449?w=100&q=80',
  },
  {
    quote: "We were skeptical about AI support, but the product understanding is uncanny. It recommends the right products, answers fit questions, and the handoff to humans is seamless.",
    author: 'Marcus Johansson',
    role: 'CEO, TechStyle Sweden',
    stat: '2.8x',
    statLabel: 'ROI in first 90 days',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
  },
  {
    quote: "Installation took 10 minutes. Within a week, our response time dropped from 4 hours to under 30 seconds. Our CSAT score went up 22 points.",
    author: 'Elena Rodriguez',
    role: 'Operations Director, CasaVida',
    stat: '22pts',
    statLabel: 'CSAT improvement',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80',
  },
];

const features = [
  {
    icon: Bot,
    title: 'AI That Knows Your Catalog',
    desc: 'Connects to your product database in real time. Understands inventory, categories, variants, and pricing. No more hallucinated recommendations.',
    color: 'bg-gradient-to-br from-[#A3E635]/20 to-[#A3E635]/5',
    iconColor: 'text-[#A3E635]',
  },
  {
    icon: MessageSquare,
    title: 'Humanlike Conversations',
    desc: 'Understands context, asks clarifying questions, and adapts to each customer\'s tone. Customers can\'t tell they\'re talking to AI.',
    color: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    iconColor: 'text-blue-600',
  },
  {
    icon: HeadphonesIcon,
    title: 'Instant Human Handoff',
    desc: 'When the AI reaches its limit, it transfers context, history, and intent to a human agent — no repetition, no frustration.',
    color: 'bg-gradient-to-br from-amber-50 to-orange-50',
    iconColor: 'text-amber-600',
  },
  {
    icon: BarChart3,
    title: 'Business Intelligence Dashboard',
    desc: 'See which questions go unanswered, track sentiment trends, and get AI-suggested FAQ improvements. Turn data into better service.',
    color: 'bg-gradient-to-br from-purple-50 to-pink-50',
    iconColor: 'text-purple-600',
  },
  {
    icon: ShoppingCart,
    title: 'Proactive Cart Recovery',
    desc: 'Detects cart abandonment intent and triggers recovery messages with personalized discounts. Recovers up to 15% of abandoned carts.',
    color: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Globe,
    title: 'Multi-Store, Multi-Language',
    desc: 'Runs across all your stores and markets. Detects customer language automatically and responds in kind. Scales globally out of the box.',
    color: 'bg-gradient-to-br from-sky-50 to-cyan-50',
    iconColor: 'text-sky-600',
  },
];

const caseStudies = [
  {
    brand: 'Nordic Boutique',
    result: '73%',
    metric: 'auto-resolution rate',
    desc: 'Cut support response time from 6 hours to 12 seconds. Team re-focused on VIP customer relationships.',
    gradient: 'from-emerald-600 to-teal-700',
  },
  {
    brand: 'TechStyle Sweden',
    result: '2.8x',
    metric: 'ROI in first quarter',
    desc: 'Product recommendation accuracy hit 94%. Average order value increased 34% through AI-driven cross-sell.',
    gradient: 'from-blue-600 to-indigo-700',
  },
  {
    brand: 'CasaVida Home',
    result: '22pts',
    metric: 'CSAT increase',
    desc: 'Resolution time dropped 97%. Customer satisfaction went from 68% to 90% within two weeks of launch.',
    gradient: 'from-amber-600 to-orange-700',
  },
  {
    brand: 'Stockholm Style',
    result: '15%',
    metric: 'cart recovery rate',
    desc: 'AI detected exit intent and triggered personalized offers. Recovered $47K in abandoned carts in month one.',
    gradient: 'from-purple-600 to-pink-700',
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Connect Your Store',
    desc: 'Install our widget with one line of code. Connects to Shopify, WooCommerce, or any platform via REST API.',
    img: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&q=80',
  },
  {
    step: '02',
    title: 'Auto-Trains Instantly',
    desc: 'Connect your store once. CircuCity AI automatically ingests your product catalog, policies, and real-time inventory — training itself on your business in seconds.',
    img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80',
  },
  {
    step: '03',
    title: 'Go Live & Grow',
    desc: 'Launch in under 2 minutes, not weeks. Monitor unanswered questions, refine your knowledge base, and watch resolution rates climb.',
    img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80',
  },
];

const faqItems = [
  {
    q: "Will the AI make mistakes with my customers?",
    a: "CircuCity AI is trained exclusively on your verified data — your product catalog, FAQs, and support docs. It knows what it knows and hands off when it doesn't. You control the knowledge base and can review every conversation.",
  },
  {
    q: "Do I need a technical team to set it up?",
    a: "No. One line of JavaScript on your site, and you're live. The AI trains itself on your existing content. If you need custom integrations, our API is fully documented.",
  },
  {
    q: "Can customers tell they're talking to AI?",
    a: "Most can't. CircuCity AI understands context, tone, and intent. It asks clarifying questions naturally and adapts to each shopper's style. When a human needs to step in, the transition is seamless.",
  },
  {
    q: "How is this different from ChatGPT on my site?",
    a: "ChatGPT doesn't know your products or policies. CircuCity AI connects to your live inventory, understands your category structure, and answers based on verified data — not general internet knowledge.",
  },
];

interface SlideCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

function SlideCard({ children, className = '', delay = 0 }: SlideCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-[#A3E635] text-[#A3E635]" />
      ))}

    </div>
  );
}

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setVideoPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header darkHero />
      

      {/* ───── HERO ───── */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center bg-[#0A1428] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A1428] via-[#0D1A35] to-[#112240]" />
        <div className="absolute top-40 right-20 w-[600px] h-[600px] bg-[#A3E635]/3 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
                <Sparkles className="w-4 h-4 text-[#A3E635]" />
                <span className="text-sm text-white/80">Trusted by your favourite e-commerce brands</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
                More sales, less{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3E635] to-[#9EF01A]">
                  "let me transfer you"
                </span>
              </h1>

              <p className="text-lg text-gray-300 leading-relaxed mb-8 max-w-lg">
                Meet <strong className="text-white">Cira</strong> — CircuCity AI&apos;s consultative assistant that understands your products,
                your customers, and your brand voice. She resolves 73% of support questions instantly,
                recovers abandoned carts, and hands off to humans seamlessly.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-8">
                <Button onClick={() => window.location.href = '/sign-up'} className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl h-12 px-8 text-base shadow-xl shadow-[#A3E635]/25 hover:shadow-[#A3E635]/40 transition-all group w-full sm:w-auto">
                  Start free trial
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-xl h-12 px-8 text-base w-full sm:w-auto">
                  <Play className="mr-2 w-4 h-4" />
                  Watch demo
                </Button>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#A3E635]" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#A3E635]" />
                  <span>Setup in under 2 minutes</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative"
            >
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-[32px] p-1 shadow-2xl">
                <div className="bg-gradient-to-br from-[#0A1428] to-[#1a2744] rounded-[28px] p-6 overflow-hidden">
                  {/* Widget mockup */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                      <span className="text-[10px] text-gray-500 ml-2 font-mono">circucity.com</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <div className="w-8 h-8 rounded-full bg-[#A3E635] flex items-center justify-center">
                        <Bot className="text-[#0A1428] w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Cira</p>
                        <p className="text-[10px] text-gray-500">CircuCity AI · Online</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start max-w-[80%]">
                      <div className="w-7 h-7 rounded-full bg-[#A3E635] flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="text-[#0A1428] w-3.5 h-3.5" />
                      </div>
                      <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                        <p className="text-sm text-white/90">Hi! I&apos;m Cira. I can help you find products, check stock, or answer questions about your order — what are you looking for?</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start max-w-[75%] ml-auto">
                      <div className="bg-[#A3E635]/20 rounded-2xl rounded-tr-sm px-4 py-3">
                        <p className="text-sm text-white/90">I&apos;m looking for a leather jacket under 2000 SEK</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start max-w-[80%]">
                      <div className="w-7 h-7 rounded-full bg-[#A3E635] flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="text-[#0A1428] w-3.5 h-3.5" />
                      </div>
                      <div className="bg-[#A3E635]/10 rounded-2xl rounded-tl-sm px-4 py-3 border border-[#A3E635]/20">
                        <p className="text-sm text-white/90">I would suggest the <strong className="text-[#A3E635]">Urban Bomber</strong> at 1 790 SEK or the <strong className="text-[#A3E635]">Classic Racer</strong> at 1 490 SEK — both in stock in sizes S–XL. Here&apos;s a quick comparison:</p>
                        <div className="mt-2 p-2 bg-white/5 rounded-lg text-xs space-y-1">
                          <div className="flex justify-between"><span>Urban Bomber</span><span className="text-[#A3E635] font-semibold">1 790 SEK</span></div>
                          <div className="flex justify-between"><span>Classic Racer</span><span className="text-[#A3E635] font-semibold">1 490 SEK</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <span className="text-xs bg-gray-700/50 text-gray-300 px-3 py-1.5 rounded-full">Show me the Urban Bomber</span>
                      <span className="text-xs bg-gray-700/50 text-gray-300 px-3 py-1.5 rounded-full">Compare both</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating metric */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-2xl p-4 border border-gray-100 hidden md:block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <ThumbsUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-lg font-extrabold text-[#0A1428]">73%</div>
                    <div className="text-xs text-gray-500">auto-resolution rate</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───── STATS BAR ───── */}
      <section className="py-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {platformStats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold text-[#0A1428]">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── GAVRIEL LISTING AI ───── */}
      <section className="py-24 bg-[#0A1428] relative overflow-hidden">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#A3E635]/3 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <SlideCard>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">Gavriel Listing AI</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-6">
                Photograph stock. Gavriel writes the listing. Publish everywhere.
              </h2>
              <p className="text-gray-400 leading-relaxed mb-8">
                Take one photo per item and Gavriel Listing AI drafts the title, description,
                category, condition, price and weight from real market data — then publishes
                real drafts to your existing stores, from the same dashboard you already use.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Camera, text: 'AI listing generation from a single photo' },
                  { icon: DollarSign, text: 'Price grounded in real market data' },
                  { icon: Cable, text: 'Publish to Shopify, WooCommerce, eBay or Etsy' },
                  { icon: Globe, text: 'Signed webhook / API push to any endpoint' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#A3E635]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-[#A3E635]" />
                    </div>
                    <span className="text-gray-300 text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </SlideCard>
            <SlideCard delay={0.15}>
              <div className="relative">
                <div className="rounded-[32px] overflow-hidden shadow-2xl border border-white/10">
                  <div className="bg-gradient-to-br from-[#0D1A35] to-[#1a2744] p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#A3E635] flex items-center justify-center">
                          <Camera className="w-4 h-4 text-[#0A1428]" />
                        </div>
                        <div>
                          <div className="text-white font-bold text-sm">Gavriel Listing AI</div>
                          <div className="text-gray-500 text-xs">Draft queue · 0 of 10 free</div>
                        </div>
                      </div>
                      <span className="rounded-full bg-[#A3E635]/15 px-3 py-1 text-xs font-bold text-[#A3E635]">Live</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { t: 'Vintage leather satchel — cognac', s: 'Ready to publish · €89 grounded', ready: true },
                        { t: 'Wool overcoat, size 48', s: 'Ready to publish · €129 grounded', ready: true },
                        { t: 'Nordic ceramic vase — hand-thrown', s: 'Awaiting review', ready: false },
                      ].map((d, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                          <div>
                            <div className="text-white text-sm font-semibold">{d.t}</div>
                            <div className="text-gray-500 text-xs mt-0.5">{d.s}</div>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${d.ready ? 'bg-[#A3E635]/15 text-[#A3E635]' : 'bg-amber-500/15 text-amber-400'}`}>
                            {d.ready ? 'Ready' : 'Review'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 grid grid-cols-4 gap-2">
                      {['Shopify', 'Woo', 'eBay', 'Etsy'].map((p) => (
                        <div key={p} className="text-center rounded-lg bg-white/5 border border-white/10 py-2 text-[10px] font-bold text-gray-400">{p}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </SlideCard>
          </div>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={() => window.location.href = '/dashboard/listing'} className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl h-12 px-8 shadow-xl shadow-[#A3E635]/25 transition-all group">
              Open the Listings app
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/demo/listing'} className="border-white/20 text-white hover:bg-white/10 rounded-xl h-12 px-8">
              Try the free test desk — no account
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/gavriel-listing-ai'} className="border-white/20 text-white hover:bg-white/10 rounded-xl h-12 px-8">
              See pricing
            </Button>
          </div>
        </div>
      </section>

      {/* ───── INDUSTRIES PREVIEW ───── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <SlideCard>
            <div className="text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">Industries</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A1428] leading-tight mb-4">
                Smart AI for your industry — product-aware by design
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Cira adapts to your catalog, policies, and customer expectations. Pick a template and go live in under 2 minutes.
              </p>
            </div>
          </SlideCard>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {featuredIndustries.map((ind, i) => (
              <SlideCard key={ind.slug} delay={i * 0.05}>
                <Link
                  href={`/industries/${ind.slug}`}
                  className="group block p-7 rounded-[24px] border border-gray-200/70 bg-white hover:border-[#A3E635]/40 hover:shadow-xl hover:shadow-[#A3E635]/5 transition-all duration-300"
                >
                  <div className="w-full h-36 mb-4 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                    {ind.heroImage ? (
                      <img src={ind.heroImage} alt={ind.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="text-3xl">{industryIcons[ind.icon] || '🛍️'}</div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-[#0A1428] mb-2 group-hover:text-[#8DC92E] transition-colors">{ind.name}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{ind.description}</p>
                  <span className="text-sm font-semibold text-[#A3E635] mt-4 inline-block group-hover:translate-x-1 transition-transform">
                    Explore solution →
                  </span>
                </Link>
              </SlideCard>
            ))}
          </div>
          <SlideCard delay={0.2}>
            <div className="text-center">
              <Link href="/industries">
                <Button variant="outline" className="border-[#0A1428]/20 text-[#0A1428] hover:bg-gray-50 rounded-xl h-12 px-8 font-semibold">
                  View all 13+ industries
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </SlideCard>
        </div>
      </section>

      {/* ───── INTEGRATIONS STRIP ───── */}
      <section className="py-14 bg-gray-50/80 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 mb-2">Integrations</p>
              <p className="text-lg font-semibold text-[#0A1428]">Connects to the tools you already use</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {integrations.map((int) => (
                <div
                  key={int.name}
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm hover:border-[#A3E635]/30 transition-colors"
                >
                  <img
                    src={int.icon}
                    alt={int.name}
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-sm font-medium text-gray-700">{int.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── RESOLUTION GUARANTEE ───── */}
      <section className="py-20 bg-[#0A1428] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#A3E635]/5 blur-[100px] rounded-full" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <SlideCard>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-[#A3E635]/10 border border-[#A3E635]/20 rounded-full px-4 py-1.5 mb-6">
                <ShieldCheck className="w-4 h-4 text-[#A3E635]" />
                <span className="text-sm text-[#A3E635] font-medium">Resolution guarantee</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-6">
                If Cira can&apos;t answer from your data, she hands off — never guesses
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Unlike generic chatbots, Cira only responds from your verified catalog, policies, and knowledge base.
                When she reaches her limit, the full conversation context transfers to your team — no repetition, no frustration.
              </p>
              <div className="grid sm:grid-cols-3 gap-6 text-left">
                {[
                  { icon: Search, title: 'Catalog-grounded', desc: 'Every product answer comes from your live inventory and pricing.' },
                  { icon: HeadphonesIcon, title: 'Seamless handoff', desc: 'Humans receive intent, history, and customer context instantly.' },
                  { icon: BarChart3, title: 'Track what\'s unanswered', desc: 'Dashboard surfaces gaps so you improve coverage over time.' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <item.icon className="w-5 h-5 text-[#A3E635] mb-3" />
                    <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </SlideCard>
        </div>
      </section>

      {/* ───── OBJECTION HANDLING 1 ───── */}
      <section className="py-24 bg-gradient-to-b from-white via-white to-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-[40px] p-8 md:p-12 shadow-sm border border-gray-100/80 mb-24">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <SlideCard>
              <div className="relative">
                <div className="rounded-[32px] overflow-hidden shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&q=80"
                    alt="Team collaborating"
                    className="w-full h-[400px] object-cover"
                  />
                </div>
              </div>
            </SlideCard>
            <SlideCard delay={0.1}>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">Trustworthy AI</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A1428] leading-tight mb-6">
                If you'd never risk AI that doesn't know your products
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                Most AI chatbots give generic answers from the open internet. CircuCity AI is trained 
                exclusively on <strong>your</strong> product catalog, inventory, pricing, and support 
                docs. It knows what you sell, what's in stock, and your policies.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Bot, text: 'Real-time product catalog connection' },
                  { icon: ShieldCheck, text: 'Answers based on verified data, not guesses' },
                  { icon: MessageSquare, text: 'Hands off to humans when uncertain' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#A3E635]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-[#A3E635]" />
                    </div>
                    <span className="text-gray-700 text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </SlideCard>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <SlideCard delay={0.1}>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-amber-600 mb-4 block">Revenue Driven</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A1428] leading-tight mb-6">
                If slow support is costing you sales
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                73% of customers say speed is the most important part of good service. 
                CircuCity AI responds in under 2 seconds, 24/7, with accurate answers. 
                No wait times. No "we'll get back to you." Just instant help that converts.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { n: '< 2s', l: 'Response time' },
                  { n: '24/7', l: 'Availability' },
                  { n: '73%', l: 'Auto-resolution' },
                ].map((s, i) => (
                  <div key={i} className="text-center p-3 rounded-xl bg-gray-50">
                    <div className="text-2xl font-extrabold text-[#A3E635]">{s.n}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>
              <Button onClick={() => window.location.href = '/sign-up'} className="bg-[#0A1428] hover:bg-[#1a2744] text-white rounded-xl h-12 px-7 text-sm font-semibold transition-all">
                Start recovering lost sales
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </SlideCard>
            <SlideCard delay={0.2}>
              <div className="relative">
                <div className="rounded-[32px] overflow-hidden shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=700&q=80"
                    alt="Dashboard analytics"
                    className="w-full h-[400px] object-cover"
                  />
                </div>
              </div>
            </SlideCard>
          </div>
        </div>
        </div>
      </section>

      {/* ───── FEATURES GRID ───── */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <SlideCard>
            <div className="text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">Platform</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A1428] leading-tight mb-4">
                Everything you need to turn support into sales
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                One platform. AI-powered support, proactive sales, and actionable insights.
              </p>
            </div>
          </SlideCard>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <SlideCard key={i} delay={i * 0.05}>
                <div className="group border border-gray-200/70 rounded-[24px] p-7 hover:border-[#A3E635]/40 hover:shadow-xl hover:shadow-[#A3E635]/5 transition-all duration-300 bg-white shadow-sm">
                  <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-[#0A1428] mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </SlideCard>
            ))}
          </div>
        </div>
      </section>

      {/* ───── VIDEO DEMO ───── */}
      <section className="py-24 bg-gradient-to-b from-[#FAFAFA] to-white border-y border-gray-100/50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <SlideCard>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">See It In Action</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A1428] leading-tight mb-6">
              Watch CircuCity AI handle a real customer conversation
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto mb-10">
              See how the AI understands product context, makes recommendations, 
              and hands off to a human — all in under 60 seconds.
            </p>
          </SlideCard>

          <SlideCard delay={0.1}>
            <div className="relative rounded-[32px] overflow-hidden shadow-2xl bg-gray-900 aspect-video group cursor-pointer">
              {!videoPlaying && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                  <button onClick={handlePlayVideo} className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-2xl hover:scale-105 transition-transform group">
                    <Play className="w-8 h-8 text-[#0A1428] ml-1" />
                  </button>
                </div>
              )}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                poster="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&q=80"
                onEnded={() => setVideoPlaying(false)}
                controls
                playsInline
              >
                <source src="/videos/demo.mp4" type="video/mp4" />
              </video>
            </div>
          </SlideCard>
        </div>
      </section>

      {/* ───── RESULTS / CASE STUDIES ───── */}
      <section className="py-24 bg-[#0A1428]">
        <div className="max-w-7xl mx-auto px-6">
          <SlideCard>
            <div className="text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">Customer Results</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
                Real results from real e-commerce brands
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                From Stockholm to San Francisco, stores using CircuCity AI see measurable improvements in support quality, sales, and customer satisfaction.
              </p>
            </div>
          </SlideCard>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {caseStudies.map((c, i) => (
              <SlideCard key={i} delay={i * 0.08}>
                <div className={`rounded-[24px] p-7 bg-gradient-to-br ${c.gradient} h-full flex flex-col`}>
                  <div className="flex-1">
                    <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">{c.brand}</p>
                    <div className="text-4xl font-extrabold text-white mb-1">{c.result}</div>
                    <p className="text-white/80 text-sm mb-4">{c.metric}</p>
                    <p className="text-white/60 text-sm leading-relaxed">{c.desc}</p>
                  </div>
                </div>
              </SlideCard>
            ))}
          </div>
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section className="py-24 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-6">
          <SlideCard>
            <div className="text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">Simple Setup</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A1428] leading-tight mb-4">
                Go from zero to live in under 2 minutes
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                No development team required. No complex configuration.
              </p>
            </div>
          </SlideCard>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step, i) => (
              <SlideCard key={i} delay={i * 0.1}>
                <div className="text-center bg-white rounded-[32px] p-6 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative mb-6 mx-auto w-full aspect-[4/3] rounded-[20px] overflow-hidden shadow-md">
                    <img src={step.img} alt={step.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <span className="text-sm font-bold text-[#0A1428]">{step.step}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#0A1428] mb-3">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </div>
              </SlideCard>
            ))}
          </div>

          <SlideCard delay={0.3}>
            <div className="mt-16 text-center">
              <Button onClick={() => window.location.href = '/sign-up'} className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl h-12 px-8 text-base shadow-lg shadow-[#A3E635]/20 group">
                Start your free trial
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-sm text-gray-400 mt-3">No credit card required. Full access for 14 days.</p>
            </div>
          </SlideCard>
        </div>
      </section>

      {/* ───── TESTIMONIALS ───── */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <SlideCard>
            <div className="text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">Testimonials</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A1428] leading-tight mb-4">
                What our customers say
              </h2>
            </div>
          </SlideCard>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <SlideCard key={i} delay={i * 0.08}>
                <div className="bg-white border border-gray-200/70 rounded-[24px] p-8 h-full flex flex-col hover:shadow-xl hover:border-[#A3E635]/30 transition-all duration-300 shadow-sm">
                  <StarRating count={t.rating} />
                  <p className="text-gray-700 text-sm leading-relaxed mt-4 flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-6 pt-6 border-t border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#A3E635] to-emerald-400 flex-shrink-0">
                        {t.avatar ? (
                          <img src={t.avatar} alt={t.author} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#0A1428]">
                            {t.author.split(' ').map(w => w[0]).join('')}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0A1428]">{t.author}</p>
                        <p className="text-xs text-gray-500">{t.role}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-sm">
                    <span className="font-bold text-[#A3E635]">{t.stat}</span>
                    <span className="text-gray-400">{t.statLabel}</span>
                  </div>
                </div>
              </SlideCard>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section className="py-24 bg-gradient-to-b from-white to-[#FAFAFA]">
        <div className="max-w-3xl mx-auto px-6">
          <SlideCard>
            <div className="text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">FAQ</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A1428] leading-tight">
                You might be wondering
              </h2>
            </div>
          </SlideCard>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <SlideCard key={i} delay={i * 0.05}>
                <div className="border border-gray-200 rounded-[20px] overflow-hidden hover:border-gray-300 transition-colors">
                  <button
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-semibold text-[#0A1428] text-sm pr-4">{item.q}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                      activeFaq === i ? 'rotate-180' : ''
                    }`} />
                  </button>
                  <AnimatePresence>
                    {activeFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </SlideCard>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="py-24 bg-[#0A1428] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#A3E635]/3 rounded-full blur-[150px]" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <SlideCard>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
              Turn your support into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3E635] to-[#9EF01A]">
                your biggest advantage
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
              Join your favourite e-commerce brands that use CircuCity AI to deliver faster support, 
              recover lost sales, and build customer loyalty — automatically.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Button onClick={() => window.location.href = '/sign-up'} className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl h-14 px-10 text-lg shadow-2xl shadow-[#A3E635]/25 hover:shadow-[#A3E635]/40 transition-all group w-full sm:w-auto">
                Start free trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <div className="flex flex-col items-center gap-1.5">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-xl h-12 px-8 text-sm w-full sm:w-auto">
                  Talk to sales
                </Button>
                <span className="text-[10px] text-gray-500">or start free — no credit card</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-8 mt-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#A3E635]" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#A3E635]" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#A3E635]" />
                <span>Setup in under 2 minutes</span>
              </div>
            </div>
          </SlideCard>
        </div>
      </section>

      {/* ??????????????? TEAM ??????????????? */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAFAFA] to-white pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="text-center mb-16">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A3E635] mb-4 block">
              Our Team
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A1428] mb-4">
              Built by founders, for founders
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base">
              A diverse team spanning three continents, united by a single mission — 
              making world-class AI customer support accessible to every ecommerce brand.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Dennis Mafunga",
                role: "Tech Lead",
                tags: ["Platform", "AI"],
                initials: "DM",
                gradient: "from-emerald-500 to-teal-600",
              },
              {
                name: "Alome Emmanuel",
                role: "Head of Product and Development",
                tags: [],
                initials: "AE",
                gradient: "from-blue-500 to-indigo-600",
              },
              {
                name: "Shakira Ssebunya",
                role: "Co-Founder",
                tags: ["Growth", "Community"],
                initials: "SS",
                gradient: "from-purple-500 to-pink-600",
              },
              {
                name: "Shangwe Nasser",
                role: "Co-Founder / COO",
                tags: ["Operations", "Execution"],
                initials: "SN",
                gradient: "from-amber-500 to-orange-600",
              },
              {
                name: "Akintunde Akinmusuyi",
                role: "Co-Founder",
                tags: ["Finance", "Strategy", "Sustainability"],
                initials: "AA",
                gradient: "from-rose-500 to-red-600",
              },
            ].map(function(member, i) {
              return (
                <div
                  key={member.name}
                  className="group relative bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 text-center hover:shadow-xl hover:border-gray-200 transition-all duration-300"
                >
                  <div className={"w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br " + member.gradient + " flex items-center justify-center shadow-lg shadow-black/5 group-hover:scale-105 transition-transform duration-300"}>
                    <span className="text-2xl font-bold text-white">{member.initials}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#0A1428] mb-1">{member.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{member.role}</p>
                  {member.tags.length > 0 && (
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {member.tags.map(function(tag) {
                        return (
                          <span key={tag} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#0A1428]/5 text-[#0A1428]/70">
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ??????????????? BRAND BADGES ??????????????? */}
      <section className="py-14 sm:py-16 bg-gradient-to-b from-white to-[#FAFAFA] border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-8 sm:mb-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              trusted by industry leaders
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 flex-wrap">
            <div className="inline-flex items-center gap-3 bg-white rounded-xl px-4 sm:px-5 py-3 sm:py-4 border border-gray-200 shadow-sm w-auto">
              <img
                src="/circucity-logo.png"
                alt="CircuCity"
                className="h-6 sm:h-7 lg:h-8 w-auto object-contain"
              />
              <span className="hidden sm:inline text-xs font-semibold text-[#0A1428]">CircuCity</span>
            </div>

            <div className="flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 px-2">&amp;</span>
            </div>

            <div className="inline-flex items-center gap-3 bg-white rounded-xl px-4 sm:px-5 py-3 sm:py-4 border border-gray-200 shadow-sm w-auto">
              <img
                src="/vendoura-logo.png"
                alt="Vendoura"
                className="h-6 sm:h-7 lg:h-8 w-auto object-contain"
              />
              <span className="hidden sm:inline text-xs font-semibold text-[#0A1428]">Vendoura</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

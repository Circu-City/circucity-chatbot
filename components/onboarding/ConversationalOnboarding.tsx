'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Loader2, PartyPopper,
  Bot, ShoppingBag, MessageSquare, RefreshCw, Calendar,
  Globe, Smartphone, Mail, Instagram, MessageCircle,
  LayoutDashboard, Play, Copy, SendHorizonal, Store, Check
} from 'lucide-react';

type GoalKey = 'sales' | 'support' | 'returns' | 'booking' | 'all';
type PersonalityKey = 'friendly' | 'professional' | 'eco' | 'playful';
type ChannelKey = 'widget' | 'email' | 'whatsapp' | 'messenger' | 'instagram';
type IndustryKey = 'ecommerce' | 'sustainability' | 'saas' | 'services' | 'retail' | 'other';

const PERSONALITY_COLORS: Record<PersonalityKey, string> = {
  friendly: '#A3E635',
  professional: '#3B82F6',
  eco: '#10B981',
  playful: '#F59E0B',
};

const PERSONALITY_GREETINGS: Record<PersonalityKey, string> = {
  friendly: "Hey there! 👋 Welcome! How can I make your day better?",
  professional: "Welcome. Thank you for reaching out. How may I assist you today?",
  eco: "Hi! 🌍 Let's make sustainable choices together. What brings you here?",
  playful: "Hola, friend! 🎉 Ready to find something amazing today?",
};

const INDUSTRIES: { key: IndustryKey; emoji: string; label: string }[] = [
  { key: 'ecommerce', emoji: '🛍️', label: 'E-commerce' },
  { key: 'sustainability', emoji: '🌱', label: 'Sustainability' },
  { key: 'saas', emoji: '💻', label: 'SaaS' },
  { key: 'services', emoji: '🛠️', label: 'Services' },
  { key: 'retail', emoji: '🏪', label: 'Retail' },
  { key: 'other', emoji: '🔧', label: 'Other' },
];

const GOALS: { key: GoalKey; emoji: string; label: string; desc: string }[] = [
  { key: 'sales', emoji: '🛍️', label: 'Sell more', desc: 'Recommend products & upsell' },
  { key: 'support', emoji: '💬', label: 'Answer questions', desc: '24/7 customer support' },
  { key: 'returns', emoji: '🔄', label: 'Handle returns', desc: 'Automate returns & exchanges' },
  { key: 'booking', emoji: '📅', label: 'Book calls', desc: 'Schedule demos & meetings' },
  { key: 'all', emoji: '🎯', label: 'All of the above', desc: 'Full automation suite' },
];

const PERSONALITIES: { key: PersonalityKey; emoji: string; label: string; desc: string }[] = [
  { key: 'friendly', emoji: '😊', label: 'Friendly & casual', desc: 'Warm, approachable tone' },
  { key: 'professional', emoji: '👔', label: 'Professional', desc: 'Polished, trustworthy voice' },
  { key: 'eco', emoji: '🌿', label: 'Eco-conscious', desc: 'Sustainability-first language' },
  { key: 'playful', emoji: '🎭', label: 'Playful & witty', desc: 'Fun, engaging personality' },
];

const CHANNELS: { key: ChannelKey; icon: React.ReactNode; label: string }[] = [
  { key: 'widget', icon: <Globe className="w-4 h-4" />, label: 'Website widget' },
  { key: 'email', icon: <Mail className="w-4 h-4" />, label: 'Email' },
  { key: 'whatsapp', icon: <MessageCircle className="w-4 h-4" />, label: 'WhatsApp' },
  { key: 'messenger', icon: <MessageSquare className="w-4 h-4" />, label: 'Messenger' },
  { key: 'instagram', icon: <Instagram className="w-4 h-4" />, label: 'Instagram' },
];

const STEPS = [
  { label: 'Profile', subtitle: 'Your details' },
  { label: 'Industry', subtitle: 'Your business' },
  { label: 'Personality', subtitle: 'AI voice' },
  { label: 'Channels', subtitle: 'Connect' },
  { label: 'Launch', subtitle: 'Go live' },
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div className={`w-full h-1 rounded-full transition-all duration-500 ${
            i <= current ? 'bg-[#A3E635]' : 'bg-gray-200'
          }`} />
        </div>
      ))}
    </div>
  );
}

function CardSelect<T extends string>({ items, selected, onSelect, renderItem }: {
  items: T[];
  selected: T | null;
  onSelect: (item: T) => void;
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item) => (
        <button
          key={item}
          onClick={() => onSelect(item)}
          className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
            selected === item
              ? 'border-[#A3E635] bg-[#A3E635]/5 ring-2 ring-[#A3E635]/20 scale-[1.02] shadow-md'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm hover:-translate-y-0.5 active:scale-95'
          }`}
        >
          {renderItem(item)}
          {selected === item && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-[#A3E635] rounded-full flex items-center justify-center shadow-sm">
              <Check className="w-3 h-3 text-[#0A1428]" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function ChatPreview({ personality, businessName, goal }: {
  personality: PersonalityKey | null;
  businessName: string;
  goal: GoalKey | null;
}) {
  const p = personality || 'friendly';
  const color = PERSONALITY_COLORS[p];

  const getPrompts = () => {
    switch (goal) {
      case 'sales': return ['Show me best sellers', 'Gift ideas under $50'];
      case 'support': return ['Shipping info', 'Cancel my order'];
      case 'returns': return ['Start a return', 'Return policy'];
      case 'booking': return ['Book a demo', 'Pricing info'];
      default: return ['Browse products', 'Track order'];
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xl">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color }}>
          <Bot className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-800">{businessName || 'Your Store'} AI</span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Online
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: color }}>
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-gray-700 max-w-[85%]">
            {PERSONALITY_GREETINGS[p]}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 pl-8">
          {getPrompts().map((prompt, i) => (
            <span key={i} className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-500 border border-gray-200/60">
              {prompt}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 pl-8 pt-1">
          <div className="flex-1 h-9 bg-gray-100 rounded-full border border-gray-200 flex items-center px-3">
            <span className="text-xs text-gray-400">Type your message...</span>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: color }}>
            <SendHorizonal className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState<IndustryKey | null>(null);
  const [goal, setGoal] = useState<GoalKey | null>(null);
  const [personality, setPersonality] = useState<PersonalityKey | null>(null);
  const [channels, setChannels] = useState<ChannelKey[]>([]);

  function canProceed(): boolean {
    switch (step) {
      case 0: return name.trim().length > 0 && businessName.trim().length > 0;
      case 1: return industry !== null && goal !== null;
      case 2: return personality !== null;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: businessName,
          url: website,
          industry: industry,
          personality: personality,
          goal: goal,
          channels: channels,
          greetingMessage: personality ? PERSONALITY_GREETINGS[personality] : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setStep(4);
      }
    } catch {}
    setSaving(false);
  }

  function toggleChannel(ch: ChannelKey) {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  }

  const stepVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-white to-[#F0FDF4] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A3E635] to-[#84CC16] flex items-center justify-center shadow-md shadow-[#A3E635]/20">
            <Zap className="w-5 h-5 text-[#0A1428]" />
          </div>
          <span className="font-bold text-gray-900 text-xl">
            CircuCity <span className="text-[#A3E635]">AI</span>
          </span>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/60 p-6 sm:p-10">
          {/* Progress */}
          <div className="mb-8">
            <StepIndicator current={step} total={STEPS.length} />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-semibold text-gray-800">{STEPS[step]?.label}</span>
              <span className="text-xs text-gray-400">{STEPS[step]?.subtitle}</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 0: Profile */}
            {step === 0 && (
              <motion.div key="step0" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-5">
                <div className="mb-1">
                  <h2 className="text-xl font-bold text-gray-900">Welcome aboard! 👋</h2>
                  <p className="text-sm text-gray-500 mt-1">I'll have your chatbot running in about 2 minutes. Let's start with the basics.</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Your name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="e.g. Sarah Chen"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A3E635]/30 focus:border-[#A3E635] transition-all shadow-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Store or business name</label>
                  <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Eco Haven"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A3E635]/30 focus:border-[#A3E635] transition-all shadow-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Website URL</label>
                  <input type="url" value={website} onChange={e => setWebsite(e.target.value)}
                    placeholder="https://ecohaven.com"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A3E635]/30 focus:border-[#A3E635] transition-all shadow-sm" />
                </div>
              </motion.div>
            )}

            {/* Step 1: Industry & Goal */}
            {step === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">What's your vibe? 🎯</h2>
                  <p className="text-sm text-gray-500 mt-1">Pick your industry and main goal so I can tailor your chatbot perfectly.</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Industry</label>
                  <CardSelect
                    items={INDUSTRIES.map(i => i.key)}
                    selected={industry}
                    onSelect={setIndustry}
                    renderItem={(key) => {
                      const ind = INDUSTRIES.find(i => i.key === key)!;
                      return (
                        <div className="text-center">
                          <span className="text-2xl block mb-1.5">{ind.emoji}</span>
                          <span className="text-sm font-medium text-gray-800">{ind.label}</span>
                        </div>
                      );
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Main goal</label>
                  <CardSelect
                    items={GOALS.map(g => g.key)}
                    selected={goal}
                    onSelect={setGoal}
                    renderItem={(key) => {
                      const g = GOALS.find(x => x.key === key)!;
                      return (
                        <div>
                          <span className="text-xl block mb-1">{g.emoji}</span>
                          <span className="text-sm font-semibold text-gray-800 block">{g.label}</span>
                          <span className="text-xs text-gray-400">{g.desc}</span>
                        </div>
                      );
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Preview + Personality */}
            {step === 2 && (
              <motion.div key="step2" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Meet your AI agent 🧠</h2>
                  <p className="text-sm text-gray-500 mt-1">Here's how your chatbot will look and feel. Choose a personality to match your brand.</p>
                </div>
                <ChatPreview personality={personality} businessName={businessName} goal={goal} />
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Chatbot personality</label>
                  <CardSelect
                    items={PERSONALITIES.map(p => p.key)}
                    selected={personality}
                    onSelect={setPersonality}
                    renderItem={(key) => {
                      const p = PERSONALITIES.find(x => x.key === key)!;
                      return (
                        <div className="text-center">
                          <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-lg"
                            style={{ background: `${PERSONALITY_COLORS[key]}20` }}>
                            {p.emoji}
                          </div>
                          <span className="text-sm font-semibold text-gray-800 block">{p.label}</span>
                          <span className="text-xs text-gray-400">{p.desc}</span>
                        </div>
                      );
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Channels */}
            {step === 3 && (
              <motion.div key="step3" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Where do you want to connect? 🌐</h2>
                  <p className="text-sm text-gray-500 mt-1">Pick the channels your chatbot will cover. You can always add more later.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {CHANNELS.map(ch => {
                    const selected = channels.includes(ch.key);
                    return (
                      <button key={ch.key} onClick={() => toggleChannel(ch.key)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${
                          selected
                            ? 'border-[#A3E635] bg-[#A3E635]/5 ring-2 ring-[#A3E635]/20 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          selected ? 'bg-[#A3E635] text-[#0A1428]' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {ch.icon}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{ch.label}</span>
                        {selected && <Check className="w-4 h-4 text-[#A3E635] ml-auto" />}
                      </button>
                    );
                  })}
                </div>
                <div className="bg-gradient-to-r from-[#A3E635]/10 to-transparent rounded-2xl p-5 border border-[#A3E635]/20">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#A3E635] focus:ring-[#A3E635]/30" />
                    <div>
                      <span className="text-sm font-semibold text-gray-800">Auto-build my {GOALS.find(g => g.key === goal)?.label || 'support'} flow</span>
                      <p className="text-xs text-gray-500 mt-0.5">I'll pre-configure a chat flow based on your main goal — ready to use instantly.</p>
                    </div>
                  </label>
                </div>
              </motion.div>
            )}

            {/* Step 4: Celebration */}
            {step === 4 && (
              <motion.div key="step4" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5 }} className="text-center py-4 space-y-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#A3E635] to-[#84CC16] flex items-center justify-center mx-auto shadow-2xl shadow-[#A3E635]/30">
                  <PartyPopper className="w-10 h-10 text-[#0A1428]" />
                </motion.div>
                <div>
                  <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="text-3xl font-bold text-gray-900 mb-2">
                    You're live! 🎉
                  </motion.h2>
                  <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="text-gray-500 max-w-sm mx-auto">
                    Your chatbot for <strong className="text-gray-800">{businessName}</strong> is ready. Here's what's next:
                  </motion.p>
                </div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                  className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={() => router.push('/dashboard?tab=install')}
                    className="px-6 py-3 bg-[#0A1428] text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2">
                    <Copy className="w-4 h-4" /> Install Widget
                  </button>
                  <button onClick={() => router.push('/dashboard?tab=playground')}
                    className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:border-gray-300 hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" /> Test Playground
                  </button>
                  <button onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 bg-gradient-to-r from-[#A3E635] to-[#84CC16] text-[#0A1428] rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                  </button>
                </motion.div>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                  className="text-xs text-gray-400">
                  ⚡ Businesses like yours start seeing results in 24 hours
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {step < 4 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <button onClick={() => setStep(p => Math.max(p - 1, 0))} disabled={step === 0}
                className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 transition-all flex items-center gap-1.5 rounded-xl hover:bg-gray-50">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button onClick={() => {
                if (step === 3) { handleSave(); return; }
                setStep(p => Math.min(p + 1, STEPS.length - 1));
              }} disabled={!canProceed() || saving}
                className="px-6 py-2.5 bg-[#0A1428] text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-30 transition-all flex items-center gap-2 shadow-md active:scale-[0.98]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {step === 3 ? 'Save & Launch' : 'Continue'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Saving overlay */}
          {saving && !saved && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-3xl z-20">
              <div className="bg-white rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center gap-3 border border-gray-100">
                <Loader2 className="w-8 h-8 text-[#A3E635] animate-spin" />
                <p className="text-sm font-medium text-gray-700">Setting up your chatbot...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

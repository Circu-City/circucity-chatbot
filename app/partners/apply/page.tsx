'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import MarketingShell from '@/components/marketing/MarketingShell';
import { ArrowRight, CheckCircle2, Building2, Megaphone, Handshake, Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const programs = [
  { value: 'agency', label: 'Agency Partner', icon: Building2 },
  { value: 'affiliate', label: 'Affiliate Partner', icon: Megaphone },
  { value: 'ambassador', label: 'Ambassador', icon: Handshake },
];

const countries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Spain', 'Italy',
  'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Brazil', 'Mexico', 'India', 'Japan',
  'Singapore', 'United Arab Emirates', 'South Africa', 'Other',
];

export default function PartnerApplyPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    program: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    country: '',
    experience: '',
    audience: '',
    message: '',
    agree: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const program = params.get('program');
    if (program && ['agency', 'affiliate', 'ambassador'].includes(program)) {
      setForm(f => ({ ...f, program }));
    }
  }, []);

  const update = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }));

  const canProceed = () => {
    if (step === 1) return form.program !== '';
    if (step === 2) return form.firstName && form.lastName && form.email && form.country;
    if (step === 3) return form.agree;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/partner/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Submission failed. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again or email us at partners@circucity.com.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <MarketingShell>
        <section className="py-32 px-6 text-center">
          <div className="max-w-lg mx-auto">
            <div className="w-16 h-16 bg-[#A3E635]/15 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-[#A3E635]" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#0A1428] mb-3">Application Submitted!</h1>
            <p className="text-gray-500 mb-8">
              Thank you for applying to join the{' '}
              <strong className="text-[#0A1428]">{programs.find(p => p.value === form.program)?.label}</strong> program.
              Our team will review your application and contact you at{' '}
              <strong className="text-[#0A1428]">{form.email}</strong> with next steps.
            </p>
            <div className="bg-[#FAFAFA] rounded-2xl border border-gray-200 p-5 mb-8 text-left space-y-2">
              <p className="text-sm text-gray-600"><strong className="text-[#0A1428]">What happens next?</strong></p>
              <p className="text-sm text-gray-500">1. Our team reviews your application</p>
              <p className="text-sm text-gray-500">2. You receive an email once approved</p>
              <p className="text-sm text-gray-500">3. Set your password and access the partner dashboard</p>
            </div>
            <Link href="/partners" className="inline-flex items-center gap-2 bg-[#0A1428] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#1a2744] transition-all">
              Back to Partners <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </MarketingShell>
    );
  }

  return (
    <MarketingShell>
      <section className="py-24 px-6 bg-gradient-to-b from-[#FAFAFA] to-white text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">Apply Now</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0A1428] leading-tight mb-4">
            Become a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3E635] to-[#9EF01A]">CircuCity AI Partner</span>
          </h1>
          <p className="text-gray-500 text-lg">Complete the form below and our team will reach out within 2-3 business days.</p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-[#A3E635] text-[#0A1428]' : 'bg-gray-200 text-gray-500'}`}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step >= s ? 'text-[#0A1428]' : 'text-gray-400'}`}>
                  {s === 1 ? 'Program' : s === 2 ? 'Details' : 'Review'}
                </span>
                {s < 3 && <div className={`w-12 sm:w-20 h-0.5 mx-2 ${step > s ? 'bg-[#A3E635]' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl font-bold text-[#0A1428] mb-2">Select a Program</h2>
              <p className="text-gray-500 text-sm mb-8">Choose the partner program that best fits your business.</p>
              <div className="grid gap-4">
                {programs.map((p) => {
                  const PIcon = p.icon;
                  const selected = form.program === p.value;
                  return (
                    <button key={p.value} onClick={() => update('program', p.value)}
                      className={`flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all ${selected ? 'border-[#A3E635] bg-[#A3E635]/5' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selected ? 'bg-[#A3E635]' : 'bg-gray-100'}`}>
                        <PIcon className={`w-6 h-6 ${selected ? 'text-[#0A1428]' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[#0A1428]">{p.label}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-[#A3E635]' : 'border-gray-300'}`}>
                        {selected && <div className="w-2.5 h-2.5 rounded-full bg-[#A3E635]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl font-bold text-[#0A1428] mb-2">Your Information</h2>
              <p className="text-gray-500 text-sm mb-8">Tell us about yourself and your business.</p>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#0A1428] mb-1.5 block">First Name *</label>
                    <input type="text" value={form.firstName} onChange={e => update('firstName', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/40" placeholder="John" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#0A1428] mb-1.5 block">Last Name *</label>
                    <input type="text" value={form.lastName} onChange={e => update('lastName', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/40" placeholder="Doe" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#0A1428] mb-1.5 block">Email Address *</label>
                    <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/40" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#0A1428] mb-1.5 block">Phone Number</label>
                    <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/40" placeholder="+1 234 567 890" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#0A1428] mb-1.5 block">Company Name</label>
                    <input type="text" value={form.company} onChange={e => update('company', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/40" placeholder="Your Company" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#0A1428] mb-1.5 block">Website URL</label>
                    <input type="url" value={form.website} onChange={e => update('website', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/40" placeholder="https://example.com" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0A1428] mb-1.5 block">Country *</label>
                  <select value={form.country} onChange={e => update('country', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/40 bg-white">
                    <option value="">Select your country</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0A1428] mb-1.5 block">Your Experience & Audience</label>
                  <textarea value={form.experience} onChange={e => update('experience', e.target.value)} rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/40 resize-none"
                    placeholder="Tell us about your experience and the audience you can reach..." />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0A1428] mb-1.5 block">Additional Message</label>
                  <textarea value={form.message} onChange={e => update('message', e.target.value)} rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/40 resize-none"
                    placeholder="Anything else you would like us to know..." />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl font-bold text-[#0A1428] mb-2">Review & Submit</h2>
              <p className="text-gray-500 text-sm mb-8">Please review your information before submitting.</p>
              <div className="bg-[#FAFAFA] rounded-[20px] p-6 border border-gray-200 space-y-4 mb-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><span className="text-xs text-gray-400 block">Program</span><span className="text-sm font-semibold text-[#0A1428]">{programs.find(p => p.value === form.program)?.label}</span></div>
                  <div><span className="text-xs text-gray-400 block">Name</span><span className="text-sm font-semibold text-[#0A1428]">{form.firstName} {form.lastName}</span></div>
                  <div><span className="text-xs text-gray-400 block">Email</span><span className="text-sm font-semibold text-[#0A1428]">{form.email}</span></div>
                  <div><span className="text-xs text-gray-400 block">Country</span><span className="text-sm font-semibold text-[#0A1428]">{form.country}</span></div>
                  {form.company && <div><span className="text-xs text-gray-400 block">Company</span><span className="text-sm font-semibold text-[#0A1428]">{form.company}</span></div>}
                  {form.website && <div><span className="text-xs text-gray-400 block">Website</span><span className="text-sm font-semibold text-[#0A1428]">{form.website}</span></div>}
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.agree} onChange={e => update('agree', e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-[#A3E635] focus:ring-[#A3E635]" />
                <span className="text-sm text-gray-500">I agree to the <Link href="/terms" className="text-[#A3E635] hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-[#A3E635] hover:underline">Privacy Policy</Link>. I confirm that the information provided is accurate.</span>
              </label>
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm mt-4">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </motion.div>
          )}

          <div className="flex items-center justify-between mt-10">
            <button onClick={() => setStep(s => Math.max(1, s - 1))}
              className={`text-sm font-medium text-gray-500 hover:text-[#0A1428] transition-colors ${step === 1 ? 'invisible' : ''}`}>
              &larr; Back
            </button>
            {step < 3 ? (
              <button onClick={() => canProceed() && setStep(s => s + 1)}
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${canProceed() ? 'bg-[#0A1428] text-white hover:bg-[#1a2744]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                Continue <ArrowRight className="inline ml-1 w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting || !canProceed()}
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all inline-flex items-center gap-2 ${canProceed() ? 'bg-[#A3E635] text-[#0A1428] hover:bg-[#8DC92E]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

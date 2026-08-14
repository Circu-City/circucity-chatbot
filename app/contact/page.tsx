import MarketingShell from '@/components/marketing/MarketingShell';
import { Mail, MapPin, Phone, Headphones, Shield, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  return (
    <MarketingShell>
      <section className="py-20 bg-dark-navy text-white text-center px-6">
        <h1 className="text-4xl font-extrabold mb-4">
          Contact <span className="text-lemon-green">Us</span>
        </h1>
        <p className="text-gray-400">We would love to hear from you. Reach out anytime.</p>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="border rounded-2xl p-6 flex items-start gap-4 hover:border-lemon-green/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <h3 className="font-bold text-dark-navy text-lg mb-1">General Inquiries</h3>
              <p className="text-gray-500 text-sm mb-2">Questions about CircuCity AI or how it works for your store.</p>
              <a href="mailto:support@circucity.com" className="text-primary font-bold hover:underline text-sm">support@circucity.com</a>
            </div>
          </div>

          <div className="border rounded-2xl p-6 flex items-start gap-4 hover:border-lemon-green/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-dark-navy text-lg mb-1">Sales</h3>
              <p className="text-gray-500 text-sm mb-2">Enterprise plans, custom solutions, and partnership inquiries.</p>
              <a href="mailto:sales@circucity.com" className="text-primary font-bold hover:underline text-sm">sales@circucity.com</a>
            </div>
          </div>

          <div className="border rounded-2xl p-6 flex items-start gap-4 hover:border-lemon-green/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-dark-navy text-lg mb-1">Office</h3>
              <p className="text-gray-500 text-sm mb-2">Our headquarters in northern Sweden.</p>
              <p className="text-dark-navy font-medium text-sm">Skellefteå, Sweden</p>
            </div>
          </div>

          <div className="border rounded-2xl p-6 flex items-start gap-4 hover:border-lemon-green/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-dark-navy text-lg mb-1">Privacy & Security</h3>
              <p className="text-gray-500 text-sm mb-2">Data protection inquiries and security vulnerability reports.</p>
              <a href="mailto:privacy@circucity.com" className="text-primary font-bold hover:underline text-sm">privacy@circucity.com</a>
              <span className="text-gray-400 text-xs mx-1">·</span>
              <a href="mailto:security@circucity.com" className="text-primary font-bold hover:underline text-sm">security@circucity.com</a>
            </div>
          </div>

          <div className="border rounded-2xl p-6 flex items-start gap-4 hover:border-lemon-green/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <Headphones className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-dark-navy text-lg mb-1">Support</h3>
              <p className="text-gray-500 text-sm mb-2">Need help with your account? Our team responds within 24 hours.</p>
              <a href="/support" className="text-primary font-bold hover:underline text-sm inline-flex items-center gap-1">Open a Support Ticket</a>
            </div>
          </div>

          <div className="border rounded-2xl p-6 flex items-start gap-4 hover:border-lemon-green/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-bold text-dark-navy text-lg mb-1">Press & Careers</h3>
              <p className="text-gray-500 text-sm mb-2">Media inquiries and job applications.</p>
              <a href="mailto:careers@circucity.com" className="text-primary font-bold hover:underline text-sm">careers@circucity.com</a>
            </div>
          </div>
        </div>

        <div className="bg-dark-navy rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">Looking for Documentation?</h3>
          <p className="text-slate-400 mb-4">
            Check out our guides, API reference, and developer docs for self-serve help.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="/docs" className="px-5 py-2.5 bg-primary text-dark-navy font-bold rounded-xl hover:bg-primary/90 transition-colors text-sm">Documentation</a>
            <a href="/docs/developer-guide" className="px-5 py-2.5 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors text-sm">Developer Guide</a>
            <a href="/api-docs" className="px-5 py-2.5 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors text-sm">API Reference</a>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}

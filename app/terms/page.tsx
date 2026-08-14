'use client';

import { motion } from 'framer-motion';
import MarketingShell from '@/components/marketing/MarketingShell';
import { FileText, CheckCircle, Shield, AlertTriangle, Clock, Activity, XCircle, DollarSign, Gavel, Users, Ban, RefreshCw, HelpCircle, Mail } from 'lucide-react';

const sections = [
  {
    icon: FileText,
    title: '1. Acceptance of Terms',
    content: 'By accessing, registering for, or using CircuCity AI ("the Platform"), you agree to be bound by these Terms of Service ("Terms"). If you are accepting on behalf of an organization, you represent that you have the authority to bind that organization. If you do not agree to all terms, you must not use the Platform.',
  },
  {
    icon: Activity,
    title: '2. Service Description',
    content: 'CircuCity AI provides an AI-powered chatbot and customer engagement platform for e-commerce businesses. Core services include:',
    bullets: [
      'AI Chat Widget: Embeddable chatbot for websites with natural language understanding, product search, order lookup, and FAQ handling.',
      'Knowledge Base: Upload documents, manage FAQs, and sync product catalogs to train your AI chatbot.',
      'Dashboard: Analytics, conversation logs, team management, escalation handling, and widget customization.',
      'API Access: RESTful APIs for chat, knowledge base management, analytics, and webhook integrations.',
      'Multi-Channel: Support for email, social media, and live chat channels.',
      'CIRA Voice: AI-powered call handling with speech-to-text and intent recognition.',
    ],
  },
  {
    icon: Users,
    title: '3. Account Registration & Security',
    content: 'You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. You must:',
    bullets: [
      'Provide accurate, current registration information.',
      'Notify us immediately of any unauthorized account use at security@circucity.com.',
      'Use strong passwords and enable two-factor authentication when available.',
      'Not share accounts across separate legal entities.',
      'Not exceed the user seat count specified in your subscription plan.',
    ],
  },
  {
    icon: Shield,
    title: '4. Acceptable Use',
    content: 'You agree not to misuse the Platform. Prohibited activities include:',
    bullets: [
      'Uploading malicious code, malware, or content that infringes third-party rights.',
      'Reverse engineering, decompiling, or attempting to extract the Platform\'s source code.',
      'Using the Platform for illegal purposes, fraud, or spam generation.',
      'Interfering with Platform operations through excessive API calls, denial-of-service attacks, or scraping.',
      'Using AI responses to generate harmful, discriminatory, or misleading content.',
      'Training competing AI models using Platform outputs or data.',
    ],
  },
  {
    icon: Gavel,
    title: '5. Intellectual Property',
    content: [
      'Your Content: You retain all rights to your knowledge base documents, chat data, product information, and custom configurations. You grant CircuCity AI a license to process this content solely to provide the service.',
      'Platform IP: CircuCity AI owns all rights to the Platform software, algorithms, AI models (trained on aggregated, anonymized data), dashboard UI, branding, and documentation.',
      'Feedback: Any suggestions or feature requests you submit may be used without compensation.',
    ],
  },
  {
    icon: DollarSign,
    title: '6. Billing & Payments',
    content: 'Paid plans are billed monthly or annually as selected during subscription. Key terms:',
    bullets: [
      'All fees are exclusive of applicable taxes (VAT, sales tax), which are added to invoices.',
      'Payments are processed securely via Stripe. We do not store payment card details.',
      'Plans auto-renew unless cancelled. You may cancel at any time; service continues until the end of the billing period.',
      'No refunds for partial months of service. Credits may be issued for verified service outages per our SLA.',
      'Pricing changes take effect at the next billing cycle with 30 days email notice.',
    ],
  },
  {
    icon: Clock,
    title: '7. Service Level & Availability',
    content: [
      'Uptime Target: 99.9% availability measured monthly, excluding scheduled maintenance (notified 48 hours in advance).',
      'Support Response: Business-critical issues ??? 4 hours; standard ??? 24 hours; low priority ??? 72 hours.',
      'Maintenance: Typically performed during low-traffic hours (UTC 00:00???06:00). Emergency maintenance may occur without notice.',
      'Service Credits: If uptime falls below 99.9%, you may request credits equal to 5% of monthly fees per 0.5% below threshold, up to 50% of monthly fees.',
    ],
  },
  {
    icon: Ban,
    title: '8. Limitation of Liability',
    content: 'To the maximum extent permitted by law:',
    bullets: [
      'The Platform is provided "as is" without warranties of merchantability, fitness for a particular purpose, or non-infringement.',
      'CircuCity AI is not liable for indirect, incidental, special, consequential, or punitive damages including lost profits, data loss, or business interruption.',
      'Our total liability for any claim is limited to the amount paid by you in the 12 months preceding the claim.',
      'These limitations do not apply to liability for fraud, gross negligence, or intentional misconduct.',
    ],
  },
  {
    icon: RefreshCw,
    title: '9. Termination',
    content: [
      'By You: Cancel anytime via dashboard or by emailing support@circucity.com. Service continues through the billing period.',
      'By Us: We may suspend or terminate accounts for: (a) breach of these Terms, (b) illegal activity, (c) non-payment after 14 days grace period, (d) platform abuse.',
      'Effect of Termination: Your data will be retained for 30 days post-termination, then permanently deleted. You may request immediate deletion.',
      'Survival: Sections 5 (IP), 8 (Liability), 9 (Termination), and 10 (Governing Law) survive termination.',
    ],
  },
  {
    icon: HelpCircle,
    title: '10. Governing Law & Disputes',
    content: 'These Terms are governed by the laws of Sweden. Any disputes shall be resolved through:',
    bullets: [
      'Amicable resolution: Contact support@circucity.com first. We commit to responding within 5 business days.',
      'Mediation: If unresolved within 30 days, disputes may be referred to the Stockholm Chamber of Commerce mediation.',
      'Jurisdiction: The courts of Stockholm, Sweden have exclusive jurisdiction for any legal proceedings.',
    ],
  },
  {
    icon: FileText,
    title: '11. Changes to Terms',
    content: 'We reserve the right to modify these Terms. Material changes will be communicated via email at least 30 days before??????. Continued use after changes take effect constitutes acceptance. If you disagree with changes, you may terminate your account before the effective date.',
  },
  {
    icon: Mail,
    title: '12. Contact',
    content: 'For questions about these Terms, contact: legal@circucity.com. For support: support@circucity.com. CircuCity AI AB, Stockholm, Sweden.',
  },
];

export default function TermsPage() {
  return (
    <MarketingShell>
      <section className="pt-32 pb-24 bg-gradient-to-b from-[#0A1428] to-[#121c3a] text-white text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, #A3E635 1px, transparent 0)', backgroundSize: '50px 50px' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="w-16 h-16 bg-[#A3E635]/15 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-[#A3E635]" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-4">Terms of <span className="text-lemon-green">Service</span></h1>
          <p className="text-gray-400">Last updated: June 2026</p>
        </motion.div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-6">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}
              className="bg-[#FAFAFA] rounded-[20px] p-6 sm:p-8 border border-gray-100 hover:border-[#A3E635]/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-[#0A1428]/5 flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-[#0A1428]" />
                </div>
                <h2 className="text-lg font-bold text-[#0A1428]">{section.title}</h2>
              </div>
              {typeof section.content === 'string' ? (
                <p className="text-gray-600 leading-relaxed text-sm">{section.content}</p>
              ) : (
                <ul className="space-y-2">
                  {(section.content as string[]).map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-gray-600 leading-relaxed text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.bullets && (
                <ul className="space-y-2 mt-3">
                  {section.bullets.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-gray-600 leading-relaxed text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          );
        })}
      </div>
    </MarketingShell>
  );
}


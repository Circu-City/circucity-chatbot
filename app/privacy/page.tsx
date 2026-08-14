'use client';

import { motion } from 'framer-motion';
import MarketingShell from '@/components/marketing/MarketingShell';
import { Shield, Lock, Eye, FileText, Mail, Database, Server, UserCheck, Globe, Trash2, Download, Clock, Bell } from 'lucide-react';

const sections = [
  {
    icon: Database,
    title: '1. Information We Collect',
    content: [
      'Account Information: When you register, we collect your name, email address, company name, and billing details (processed securely via Stripe).',
      'Chat Data: We store conversation history between your AI chatbot and your customers to improve responses and provide analytics.',
      'Knowledge Base Content: Documents, FAQs, URLs, and product data you upload to train your chatbot.',
      'Usage Data: Dashboard login timestamps, feature interactions, and API call volumes for service optimization.',
      'Website Data: Automated crawl data from your e-commerce store (product listings, prices, categories) to power AI responses.',
    ],
  },
  {
    icon: Eye,
    title: '2. How We Use Your Data',
    content: [
      'Service Delivery: Powering your AI chatbot, generating responses, managing knowledge base queries, and providing dashboard analytics.',
      'AI Training: Improving response accuracy using your chat data. Your knowledge base documents are workspace-scoped and never shared across tenants.',
      'Communication: Sending account notifications, billing receipts, product updates, and support responses.',
      'Analytics: Aggregated, anonymized statistics to improve platform performance and feature development.',
      'We never sell, rent, or share your personal data with third parties for their own marketing purposes.',
    ],
  },
  {
    icon: Lock,
    title: '3. Data Storage & Security',
    content: [
      'Data Residency: All data is stored on servers located within the European Union (EU) using Hetzner and AWS eu-central-1.',
      'Encryption at Rest: AES-256 encryption for all stored data including knowledge base documents and chat logs.',
      'Encryption in Transit: TLS 1.3 for all API communications and HTTPS for web traffic.',
      'Access Control: Production access is restricted to authorized engineering personnel via SSH key authentication and VPN.',
      'Backup: Automated daily backups with 30-day retention in a separate geographic zone.',
      'SOC 2: We maintain SOC 2 Type II compliant security practices with annual audits.',
    ],
  },
  {
    icon: UserCheck,
    title: '4. Your Rights (GDPR & CCPA)',
    content: [
      'Right to Access: Request a copy of all personal data we hold about you.',
      'Right to Rectification: Correct inaccurate or incomplete data.',
      'Right to Erasure: Request deletion of your account and associated data.',
      'Right to Restrict Processing: Limit how we process your data in certain circumstances.',
      'Right to Data Portability: Receive your data in a machine-readable format (JSON).',
      'Right to Object: Object to processing for direct marketing or legitimate interests.',
      'CCPA Rights: California residents may opt out of the sale of personal information and request disclosure of data collection practices.',
    ],
  },
  {
    icon: FileText,
    title: '5. Data Retention',
    content: [
      'Active Accounts: Data is retained for the duration of your subscription plus 30 days after cancellation.',
      'Chat Logs: Individual chat logs are retained for 12 months, after which personally identifiable information is anonymized.',
      'Knowledge Base: Documents remain until you delete them or your account is terminated.',
      'Backups: Deleted data is purged from backups within 90 days.',
      'Billing Records: Retained for 7 years as required by tax regulations.',
    ],
  },
  {
    icon: Globe,
    title: '6. Third-Party Services',
    content: [
      'Stripe: Payment processing. CircuCity AI never stores credit card numbers. Stripe\'s privacy policy applies to payment data.',
      'OpenAI: AI model inference. Chat messages are sent to OpenAI for response generation. No training on your data is performed by OpenAI via API.',
      'Hetzner & AWS: Cloud infrastructure providers for compute and storage.',
      'Resend: Transactional email delivery for account notifications.',
      'Google Analytics (optional): Anonymized website traffic analytics if enabled.',
    ],
  },
  {
    icon: Bell,
    title: '7. Cookies & Tracking',
    content: [
      'Essential Cookies: Session tokens, authentication cookies, CSRF protection. Required for platform functionality.',
      'Analytics Cookies: Optional cookies for understanding platform usage patterns.',
      'Preference Cookies: Store your dashboard preferences and theme settings.',
      'You can control cookie preferences via your browser settings. Disabling essential cookies may impact platform functionality.',
    ],
  },
  {
    icon: Mail,
    title: '8. Contact & DPO',
    content: [
      'Data Protection Officer: privacy@circucity.com',
      'Privacy Inquiries: privacy@circucity.com',
      'Postal Address: CircuCity AI AB, Stockholm, Sweden',
      'Response Time: All requests are acknowledged within 72 hours and resolved within 30 days.',
      'Supervisory Authority: You have the right to lodge a complaint with your local data protection authority.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <section className="pt-32 pb-24 bg-gradient-to-b from-[#0A1428] to-[#121c3a] text-white text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, #A3E635 1px, transparent 0)', backgroundSize: '50px 50px' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="w-16 h-16 bg-[#A3E635]/15 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-[#A3E635]" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-4">Privacy <span className="text-lemon-green">Policy</span></h1>
          <p className="text-gray-400">Last updated: June 2026</p>
        </motion.div>
      </section>

      <div className="max-w-3xl mx-auto px-6 mb-8">
      </div>
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-[20px] p-6 sm:p-8 border border-gray-100 hover:border-[#A3E635]/20 transition-all shadow-sm hover:shadow-md">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#A3E635]/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#A3E635]" />
                </div>
                <h2 className="text-xl font-bold text-[#0A1428]">{section.title}</h2>
              </div>
              <ul className="space-y-3">
                {section.content.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-gray-600 leading-relaxed text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </MarketingShell>
  );
}


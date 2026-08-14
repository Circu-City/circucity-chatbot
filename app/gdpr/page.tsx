'use client';

import { motion } from 'framer-motion';
import MarketingShell from '@/components/marketing/MarketingShell';
import { Shield, FileText, UserCheck, Globe, Lock, Server, Mail, Database, Download, Trash2, CheckCircle, AlertTriangle, Eye, Ban } from 'lucide-react';

const sections = [
  {
    icon: Shield,
    title: 'Our Commitment to GDPR',
    content: 'CircuCity AI is fully committed to compliance with the General Data Protection Regulation (EU 2016/679). We have implemented comprehensive technical and organizational measures to protect personal data and uphold data subject rights. This page details our GDPR compliance framework, data processing practices, and your rights as a data controller or data subject.',
  },
  {
    icon: Server,
    title: 'Data Processing Roles',
    content: [
      'Data Controller: You (our customer) determine the purposes and means of processing personal data collected through your AI chatbot.',
      'Data Processor: CircuCity AI processes personal data on your behalf according to your documented instructions.',
      'Sub-Processors: We engage trusted sub-processors (Hetzner, AWS, OpenAI, Resend, Stripe) who have been vetted for GDPR compliance and are bound by data processing agreements.',
      'Joint Controllership: In limited contexts (anonymized analytics), we act as a joint controller with aggregated, non-personal data.',
    ],
    badge: 'Processor & Controller',
  },
  {
    icon: FileText,
    title: 'Data Processing Agreement (DPA)',
    content: 'A Data Processing Agreement is available to all customers upon request. The DPA covers:',
    bullets: [
      'Scope and purpose of data processing.',
      'Duration of processing (term of subscription plus 30 days).',
      'Categories of data subjects (your customers, your team members).',
      'Types of personal data (names, emails, chat messages, order data).',
      'Security measures (encryption, access control, audits).',
      'Sub-processor list and notification of changes.',
      'International transfer safeguards (Standard Contractual Clauses).',
      'Assistance with data subject requests and breach notifications.',
      'To request a signed DPA, email privacy@circucity.com.',
    ],
  },
  {
    icon: UserCheck,
    title: 'Data Subject Rights → How We Support Them',
    content: 'As a data processor, we provide tools and processes to help you fulfill data subject requests:',
    rights: [
      { icon: Eye, label: 'Right to Access', desc: 'Export a subject\'s data via dashboard or API. We respond within 30 days.' },
      { icon: FileText, label: 'Right to Rectification', desc: 'Update inaccurate data through dashboard settings or via support.' },
      { icon: Trash2, label: 'Right to Erasure', desc: 'Delete conversations, knowledge base documents, or entire workspaces. Permanently removed within 30 days.' },
      { icon: Ban, label: 'Right to Restrict', desc: 'Suspend processing of a specific data subject while a request is verified.' },
      { icon: Download, label: 'Right to Portability', desc: 'Export data in JSON format for transfer to another service.' },
      { icon: AlertTriangle, label: 'Right to Object', desc: 'Opt out of analytics processing. Contact privacy@circucity.com.' },
    ],
  },
  {
    icon: Lock,
    title: 'Technical & Organizational Measures',
    content: 'We maintain the following measures to ensure data security:',
    bullets: [
      'Encryption: AES-256 at rest for databases, file storage, and backups. TLS 1.3 for all data in transit.',
      'Access Control: Role-based access control (RBAC) for dashboard users. Multi-factor authentication available.',
      'Network Security: VPC isolation, firewall rules, intrusion detection, and DDoS protection.',
      'Personnel: All employees undergo annual GDPR and security training. Access is granted on a least-privilege basis with audit logging.',
      'Incident Response: Documented breach notification procedure. We notify affected customers within 48 hours of confirmed breach.',
      'Vendor Management: Annual security reviews of all sub-processors. DPAs in place with all vendors.',
    ],
  },
  {
    icon: Globe,
    title: 'International Data Transfers',
    content: 'All personal data is stored within the European Union (Hetzner, Falkenstein; AWS eu-central-1, Frankfurt). Where data transfers outside the EU are necessary (e.g., OpenAI inference in the US for chat response generation), we rely on:',
    bullets: [
      'Standard Contractual Clauses (SCCs) adopted by the European Commission.',
      'Data Protection Impact Assessments (DPIA) for each transfer mechanism.',
      'Transfer Impact Assessments (TIA) evaluating the legal framework of the destination country.',
      'We do not transfer personal data to countries without an adequate level of protection as determined by the European Commission.',
    ],
  },
  {
    icon: Database,
    title: 'Data Retention & Deletion',
    content: [
      'Active Accounts: Data retained for the duration of your subscription.',
      'Post-Termination: Data retained for 30 days, then permanently deleted.',
      'Chat Logs: Retained for 12 months, then anonymized (PII removed, aggregate statistics retained).',
      'Backups: Retained for 30 days. Deleted data is removed from backups within 90 days.',
      'Billing Records: Retained for 7 years per Swedish tax law. Only minimal billing data is kept (name, email, transaction amount).',
      'You can manually delete specific data at any time via the dashboard (conversations, documents, team members).',
    ],
  },
  {
    icon: Mail,
    title: 'Breach Notification Procedure',
    content: 'In the event of a personal data breach:',
    bullets: [
      'Our security team is alerted via automated monitoring systems within 15 minutes.',
      'Initial assessment and containment within 2 hours.',
      'Customer notification within 48 hours if the breach poses a risk to data subjects.',
      'Notification includes: nature of breach, categories of data affected, likely consequences, and remediation steps.',
      'Supervisory authority notified within 72 hours where required.',
      'Post-incident report and preventive measures shared with affected customers within 14 days.',
    ],
  },
  {
    icon: Shield,
    title: 'Data Protection Officer',
    content: 'Our Data Protection Officer oversees GDPR compliance and serves as the point of contact for supervisory authorities and data subjects.',
    contact: [
      'Email: privacy@circucity.com',
      'Privacy inquiries: privacy@circucity.com',
      'Postal: CircuCity AI AB, Stockholm, Sweden',
      'Response within 72 hours for all data subject requests.',
    ],
  },
  {
    icon: FileText,
    title: 'Supervisory Authority',
    content: 'You have the right to lodge a complaint with your local data protection authority. Our lead supervisory authority is:',
    bullets: [
      'Swedish Authority for Privacy Protection (IMY)',
      'Box 8114, 104 20 Stockholm, Sweden',
      'Email: imy@imy.se',
      'Website: www.imy.se',
    ],
  },
];

export default function GdprPage() {
  return (
    <MarketingShell>
      <section className="pt-32 pb-24 bg-gradient-to-b from-[#0A1428] to-[#121c3a] text-white text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, #A3E635 1px, transparent 0)', backgroundSize: '50px 50px' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="w-16 h-16 bg-[#A3E635]/15 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-[#A3E635]" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-4">GDPR <span className="text-lemon-green">Compliance</span></h1>
          <p className="text-gray-400 max-w-xl mx-auto">How CircuCity AI protects personal data and meets EU regulatory requirements.</p>
        </motion.div>
      </section>

      <div className="max-w-3xl mx-auto px-6 mb-8">
      </div>
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        {sections.map((section, i) => {
          const Icon = section.icon;
          const hasRights = 'rights' in section;
          const hasBullets = 'bullets' in section;
          const hasContact = 'contact' in section;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
              className="bg-white rounded-[20px] p-6 sm:p-8 border border-gray-100 hover:border-[#A3E635]/20 transition-all shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0A1428]/5 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#0A1428]" />
                  </div>
                  <h2 className="text-lg font-bold text-[#0A1428]">{section.title}</h2>
                </div>
                {section.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#A3E635]/10 text-[#A3E635] px-3 py-1 rounded-full shrink-0">{section.badge}</span>
                )}
              </div>
              {typeof section.content === 'string' ? (
                <p className="text-gray-600 text-sm leading-relaxed">{section.content}</p>
              ) : (
                <ul className="space-y-2 mb-4">
                  {(section.content as string[]).map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-gray-600 text-sm leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {hasRights && (
                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  {(section as any).rights.map((r: any, j: number) => {
                    const RIcon = r.icon;
                    return (
                      <div key={j} className="bg-[#FAFAFA] rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-1.5">
                          <RIcon className="w-4 h-4 text-[#A3E635]" />
                          <span className="text-sm font-bold text-[#0A1428]">{r.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              {hasBullets && (
                <ul className="space-y-2 mt-3">
                  {(section as any).bullets.map((item: string, j: number) => (
                    <li key={j} className="flex items-start gap-2 text-gray-600 text-sm leading-relaxed">
                      <CheckCircle className="w-4 h-4 text-[#A3E635] mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {hasContact && (
                <div className="mt-4 bg-[#0A1428]/5 rounded-xl p-4 border border-[#0A1428]/10">
                  {(section as any).contact.map((item: string, j: number) => (
                    <p key={j} className="text-sm text-gray-700 font-medium">{item}</p>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </MarketingShell>
  );
}


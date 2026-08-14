import MarketingShell from '@/components/marketing/MarketingShell';
import { Shield, Lock, Server, Eye, Key, Clock, FileCheck, Users } from "lucide-react";

export default function SecurityPage() {
  return (
    <MarketingShell>
      <section className="pt-28 pb-20 bg-gradient-to-b from-[#0A1428] to-[#121c3a] text-white text-center px-6">
        <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
        <h1 className="text-4xl lg:text-5xl font-extrabold mb-4">
          Security at <span className="text-lemon-green">CircuCity AI</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          We take the security of your data seriously. Here's how we protect your store, your customers, and your conversations.
        </p>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Security Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {[
            { icon: Lock, title: "Encryption at Rest & in Transit", desc: "All data is encrypted using AES-256 at rest and TLS 1.3 in transit. Your chat conversations, product data, and customer information are protected end-to-end." },
            { icon: Server, title: "European Data Residency", desc: "All infrastructure is hosted in data centers within the European Union (Helsinki, Finland). Your data never leaves the EU, ensuring compliance with GDPR and EU data sovereignty laws." },
            { icon: Key, title: "API Key Authentication", desc: "Every API request must include a valid workspace API key. Keys are scoped per workspace and can be revoked instantly from your dashboard. We never log raw API keys." },
            { icon: Eye, title: "Access Controls & Audit Logs", desc: "Access to production systems is restricted to authorized personnel only, using multi-factor authentication. All access events are logged in an immutable audit trail for 90 days." },
            { icon: Clock, title: "24/7 Monitoring & Alerts", desc: "Our infrastructure is monitored 24/7 for anomalies, intrusion attempts, and performance degradation. Automated alerts notify our on-call team within 60 seconds of any incident." },
            { icon: FileCheck, title: "Regular Penetration Testing", desc: "We conduct quarterly penetration tests through independent security firms. Vulnerability findings are triaged within 48 hours and remediated based on severity." },
            { icon: Users, title: "Least Privilege Architecture", desc: "Every service, user, and integration operates with the minimum permissions necessary. Your chat data is scoped to your workspace only — no cross-tenant data access is possible." },
            { icon: Shield, title: "SOC 2 Compliance (In Progress)", desc: "We are actively working toward SOC 2 Type II certification. Our security controls, policies, and procedures are aligned with AICPA Trust Services Criteria." },
          ].map(item => (
            <div key={item.title} className="border rounded-xl p-5 flex items-start gap-4 hover:border-lemon-green/50 transition-all">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h3 className="font-bold text-dark-navy mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Data Protection Details */}
        <h2 className="text-2xl font-bold text-dark-navy mb-6">Data Protection FAQ</h2>
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <div>
            <h3 className="font-bold text-dark-navy text-lg mb-2">Where is my data stored?</h3>
            <p>Your data is stored in PostgreSQL and MySQL databases hosted in Helsinki, Finland (EU). Chat messages, product information, and user accounts are all hosted within the European Union. Backups are encrypted and stored in a separate EU region.</p>
          </div>
          <div>
            <h3 className="font-bold text-dark-navy text-lg mb-2">How do you handle data deletion?</h3>
            <p>When you delete your account or a specific resource (conversations, products, documents), the data is permanently removed from our active databases within 24 hours. Encrypted backups are retained for 30 days for disaster recovery and then permanently deleted.</p>
          </div>
          <div>
            <h3 className="font-bold text-dark-navy text-lg mb-2">Is my chat data used to train shared AI models?</h3>
            <p>No. Your chat conversations and knowledge base documents are scoped exclusively to your workspace. They are never used to train shared models or shared with other CircuCity AI customers. When we use third-party AI providers, we use API endpoints with data processing agreements that prohibit training on customer data.</p>
          </div>
          <div>
            <h3 className="font-bold text-dark-navy text-lg mb-2">What payment information do you store?</h3>
            <p>We do not store any payment card information. All payments are processed through Stripe, a PCI DSS Level 1 certified payment processor. We only store a reference to your Stripe customer ID and subscription status.</p>
          </div>
          <div>
            <h3 className="font-bold text-dark-navy text-lg mb-2">How do you handle security incidents?</h3>
            <p>We maintain a documented incident response plan. In the event of a security breach, affected customers are notified within 72 hours of confirmed impact. We provide a post-incident report detailing root cause analysis and remediation steps.</p>
          </div>
        </div>

        {/* Reporting Vulnerabilities */}
        <div className="mt-12 bg-dark-navy rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">Report a Security Vulnerability</h3>
          <p className="text-slate-400 mb-4 max-w-md mx-auto">
            If you've discovered a security vulnerability, please report it responsibly. We take all reports seriously and respond promptly.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="mailto:security@circucity.com"
              className="inline-block bg-primary text-dark-navy font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
            >
              security@circucity.com
            </a>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Please do not publicly disclose vulnerabilities before we've had a chance to address them.
            We aim to acknowledge reports within 24 hours and provide a timeline for resolution.
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            For general security inquiries, contact{" "}
            <a href="mailto:security@circucity.com" className="text-primary hover:underline font-medium">security@circucity.com</a>
          </p>
        </div>
      </div>
    </MarketingShell>
  );
}

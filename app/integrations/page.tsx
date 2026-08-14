'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import MarketingShell from '@/components/marketing/MarketingShell';
import { ArrowRight, Search, ChevronRight, Bot } from 'lucide-react';

const categories = [
  { id: 'all', label: 'All Integrations' },
  { id: 'ecommerce', label: 'Ecommerce' },
  { id: 'crm', label: 'CRM' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'email', label: 'Email Marketing' },
  { id: 'social', label: 'Social Media' },
  { id: 'cms', label: 'CMS' },
  { id: 'workflow', label: 'Workflow Automation' },
  { id: 'ai', label: 'AI & LLMs' },
  { id: 'support', label: 'Customer Service' },
];

const integrations = [
  { name: 'Shopify', icon: 'https://cdn.simpleicons.org/shopify/0A1428', category: 'ecommerce', desc: 'Sync products, orders, and customer data in real-time.' },
  { name: 'WooCommerce', icon: 'https://cdn.simpleicons.org/woocommerce/0A1428', category: 'ecommerce', desc: 'Connect your WordPress store for seamless support.' },
  { name: 'Adobe Commerce', icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%230A1428%22%3E%3Cpath d=%22M13.3 2H12v3.1c.2.1.4.2.6.3l2.5 6.4c.2.6.4 1.2.6 1.8l.1.3c.3.6.5 1.2.7 1.9l.4 1.2.5 1.2-1.9 4.8h3.1l4-10.1c.6-1.5 1.1-3 1.7-4.5V2h-3.1v1.7c-.1.2-.2.5-.4.7-.2.5-.4 1-.6 1.5l-.3.8L16 6.2l-1.8 4.5-1.5-3.9c-.2-.9-.4-1.6-.6-2.2-.2-.7-.5-1.3-.8-2V2zM6.2 8.3c-.5 1.3-1 2.6-1.5 3.9h3.1c.1-.4.2-.7.4-1.1l.3-.7c.2-.5.4-1.1.6-1.6l.2-.5h1.5l-2 5.3 2.1 5.5H7.1l-.6-1.7c-.2-.6-.4-1.2-.6-1.8-.2-.6-.4-1.2-.5-1.8H2c0 .6.1 1.3.2 1.9.1.6.2 1.2.4 1.8.2.6.3 1.2.5 1.7l.5 1.5H2v3h9.2l1.8-4.5-1.8-4.6h-2.5l.7-1.7c.2-.5.4-1.1.6-1.6L9.9 9H8.3l-.4 1.1c-.5 1.3-1 2.6-1.7 3.8z%22/%3E%3C/svg%3E', category: 'ecommerce', desc: 'Magento integration for enterprise e-commerce.' },
  { name: 'BigCommerce', icon: 'https://cdn.simpleicons.org/bigcommerce/0A1428', category: 'ecommerce', desc: 'AI support for your BigCommerce store.' },
  { name: 'Stripe', icon: 'https://cdn.simpleicons.org/stripe/0A1428', category: 'ecommerce', desc: 'Payment processing and subscription management.' },
  { name: 'HubSpot', icon: 'https://cdn.simpleicons.org/hubspot/0A1428', category: 'crm', desc: 'Sync contacts, deals, and conversations.' },
  { name: 'Salesforce', icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%230A1428%22%3E%3Ccircle cx=%228%22 cy=%2212%22 r=%224%22/%3E%3Ccircle cx=%2216%22 cy=%2212%22 r=%224%22/%3E%3Cpath d=%22M12 4c-1.5 0-2.8.6-3.8 1.5C9.7 6.8 11 8 12 8s2.3-1.2 3.8-2.5C14.8 4.6 13.5 4 12 4zm0 16c-1.5 0-2.8-.6-3.8-1.5C9.7 17.2 11 16 12 16s2.3 1.2 3.8 2.5C14.8 19.4 13.5 20 12 20z%22/%3E%3C/svg%3E', category: 'crm', desc: 'Enterprise CRM integration for sales and support.' },
  { name: 'Zoho CRM', icon: 'https://cdn.simpleicons.org/zoho/0A1428', category: 'crm', desc: 'Connect Zoho CRM for seamless data flow.' },
  { name: 'Agile CRM', icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%230A1428%22%3E%3Cpath d=%22M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z%22/%3E%3C/svg%3E', category: 'crm', desc: 'Turn conversations into CRM contacts.' },
  { name: 'Pipedrive', icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%230A1428%22%3E%3Cpath d=%22M3 12c0 4.1 2.5 7.6 6 9.1V12c0-1.1.9-2 2-2h7c.4 0 .7-.1 1-.2C18.1 6.3 15.3 4 12 4 7 4 3 7.6 3 12zm18 0c0-1.4-.3-2.7-.8-3.9-.1.3-.2.6-.2.9v2h-7c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1h5.5c.1 0 .2 0 .3-.1C17.6 18.4 15 20 12 20c-2.5 0-4.6-1.2-6-3v-1c0-.6-.4-1-1-1H3.5c-.2 0-.3 0-.5.1C4 17.5 7.6 21 12 21c4.4 0 8-3.1 9-7.2 0-.3.1-.5.1-.8 0-.3 0-.7-.1-1z%22/%3E%3C/svg%3E', category: 'crm', desc: 'Sync leads and deals from chat.' },
  { name: 'Google Analytics', icon: 'https://cdn.simpleicons.org/googleanalytics/0A1428', category: 'analytics', desc: 'Track chat performance in GA4.' },
  { name: 'Google Tag Manager', icon: 'https://cdn.simpleicons.org/googletagmanager/0A1428', category: 'analytics', desc: 'Manage tracking tags from your widget.' },
  { name: 'Klaviyo', icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%230A1428%22%3E%3Cpath d=%22M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.5 14.5H14l-2-3.5-2 3.5H7.5L11 11 7.5 6.5H10l2 3.5 2-3.5h2.5L13 11l3.5 5.5z%22/%3E%3C/svg%3E', category: 'email', desc: 'Sync email lists and trigger flows.' },
  { name: 'Mailchimp', icon: 'https://cdn.simpleicons.org/mailchimp/0A1428', category: 'email', desc: 'Capture leads and send automated campaigns.' },
  { name: 'Brevo', icon: 'https://cdn.simpleicons.org/brevo/0A1428', category: 'email', desc: 'Sync contacts and send transactional emails.' },
  { name: 'ActiveCampaign', icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%230A1428%22%3E%3Cpath d=%22M4 3h16c.6 0 1 .4 1 1v16c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1V4c0-.6.4-1 1-1zm2 4v10h3V7H6zm5 0v10h3V7h-3zm5 0v10h3V7h-3z%22/%3E%3C/svg%3E', category: 'email', desc: 'Marketing automation and email integration.' },
  { name: 'Instagram', icon: 'https://cdn.simpleicons.org/instagram/0A1428', category: 'social', desc: 'Unify Instagram DMs and comments.' },
  { name: 'Messenger', icon: 'https://cdn.simpleicons.org/messenger/0A1428', category: 'social', desc: 'Facebook Messenger integration.' },
  { name: 'WhatsApp', icon: 'https://cdn.simpleicons.org/whatsapp/0A1428', category: 'social', desc: '24/7 WhatsApp support automation.' },
  { name: 'Slack', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/slack.svg', category: 'workflow', desc: 'Get chat notifications in Slack channels.' },
  { name: 'Zapier', icon: 'https://cdn.simpleicons.org/zapier/0A1428', category: 'workflow', desc: 'Connect to 5,000+ apps via Zapier.' },
  { name: 'WordPress', icon: 'https://cdn.simpleicons.org/wordpress/0A1428', category: 'cms', desc: 'Native WordPress plugin for easy setup.' },
  { name: 'Shopware', icon: 'https://cdn.simpleicons.org/shopware/0A1428', category: 'ecommerce', desc: 'German e-commerce platform integration.' },
  { name: 'Zendesk', icon: 'https://cdn.simpleicons.org/zendesk/0A1428', category: 'support', desc: 'Create Zendesk tickets from any chat.' },
  { name: 'Intercom', icon: 'https://cdn.simpleicons.org/intercom/0A1428', category: 'support', desc: 'Two-way sync with Intercom.' },
  { name: 'OpenAI', icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%230A1428%22%3E%3Cpath d=%22M12 2L2 7v10l10 5 10-5V7l-10-5zm0 2.8l6.5 3.2v6.4L12 17.8l-6.5-3.4V8.2L12 4.8zM7.5 10.8v3.4L12 16.8l4.5-2.6v-3.4L12 13.2l-4.5-2.4z%22/%3E%3C/svg%3E', category: 'ai', desc: 'Custom LLM integration for advanced AI.' },
  { name: 'Anthropic', icon: 'https://cdn.simpleicons.org/anthropic/0A1428', category: 'ai', desc: 'Claude AI model support for responses.' },
];

export default function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = integrations.filter((int) => {
    const matchesCategory = activeCategory === 'all' || int.category === activeCategory;
    const matchesSearch = int.name.toLowerCase().includes(search.toLowerCase()) || int.desc.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <MarketingShell>
      <section className="py-24 px-6 bg-gradient-to-b from-[#FAFAFA] to-white text-center">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-4 block">Integrations</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0A1428] leading-tight mb-4">
            Connect with the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3E635] to-[#9EF01A]">tools you already use</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
            Seamlessly integrate with Shopify, WordPress, Slack, HubSpot and hundreds of other apps.
          </p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search integrations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635] focus:border-transparent"
            />
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto">
          <div className="flex gap-1 py-3 ">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-all ${
                  activeCategory === cat.id
                    ? 'bg-[#0A1428] text-white shadow-lg'
                    : 'text-gray-500 hover:text-[#0A1428] hover:bg-gray-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No integrations found. Try a different search term.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((int, i) => (
                <motion.div
                  key={int.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  className="bg-white rounded-[16px] p-5 border border-gray-200 hover:shadow-md hover:border-[#A3E635]/30 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 p-2">
                      <img src={int.icon} alt={int.name} className="w-6 h-6 object-contain" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[#0A1428] text-sm">{int.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{int.desc}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {categories.find(c => c.id === int.category)?.label || int.category}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#A3E635] transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-[#FAFAFA] border-t border-gray-100 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-[#0A1428] mb-3">Need a custom integration?</h2>
          <p className="text-gray-500 text-sm mb-8">
            Our OpenAPI and Premium plan let you connect to almost any app. Implementation specialists will help you set it up.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="bg-[#0A1428] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#1a2744] transition-all"
            >
              Talk to sales
              <ArrowRight className="inline ml-2 w-4 h-4" />
            </Link>
            <Link
              href="/sign-up"
              className="border border-gray-300 text-[#0A1428] px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0A1428] relative overflow-hidden px-6">
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
            Start integrating today
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">
            Free plan includes core integrations. Upgrade to unlock premium connectors and custom API access.
          </p>
          <Link
            href="/sign-up"
            className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl h-12 px-8 text-base shadow-xl shadow-[#A3E635]/20 transition-all inline-flex items-center"
          >
            Start free trial
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}

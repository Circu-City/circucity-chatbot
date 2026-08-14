import MarketingShell from '@/components/marketing/MarketingShell';
import { Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const posts = [
  { slug: 'getting-started', title: 'Getting Started with CircuCity AI', excerpt: 'Learn how to set up your AI chatbot in under 15 minutes and start converting visitors into loyal customers.', date: '2026-06-01', author: 'CircuCity Team' },
  { slug: 'ai-ecommerce-guide', title: 'How AI is Transforming E-commerce Support', excerpt: 'Discover how AI-powered chatbots are reducing response times and increasing conversion rates across online stores worldwide.', date: '2026-05-28', author: 'CircuCity Team' },
  { slug: 'knowledge-base-tips', title: 'Best Practices for Building Your Knowledge Base', excerpt: 'Tips for uploading documents, crawling your website, and training your AI for maximum accuracy and relevance.', date: '2026-05-15', author: 'CircuCity Team' },
];

export default function BlogPage() {
  return (<MarketingShell>
    <section className="py-20 bg-dark-navy text-white text-center px-6"><h1 className="text-4xl font-extrabold mb-4">Blog</h1><p className="text-gray-400 max-w-xl mx-auto">Insights, guides, and best practices from the CircuCity AI team.</p></section>
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
      {posts.map(p => (
        <Link key={p.slug} href={`/blog/${p.slug}`} className="block border rounded-2xl p-6 hover:shadow-lg hover:border-lemon-green transition-all">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2"><Calendar className="w-3 h-3" />{new Date(p.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {p.author}</div>
          <h2 className="text-xl font-bold text-dark-navy mb-2">{p.title}</h2>
          <p className="text-gray-500 text-sm mb-3">{p.excerpt}</p>
          <span className="text-lemon-green font-medium text-sm flex items-center gap-1">Read more <ArrowRight className="w-3 h-3" /></span>
        </Link>
      ))}
    </div>
  </MarketingShell>);
}

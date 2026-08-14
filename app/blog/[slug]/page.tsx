import PageLayout from '@/components/PageLayout';
import { Calendar, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';

type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  sections: { heading: string; paragraphs: string[] }[];
};

const POSTS: Record<string, BlogPost> = {
  'getting-started': {
    slug: 'getting-started',
    title: 'Getting Started with CircuCity AI',
    excerpt: 'Learn how to set up your AI chatbot in under 15 minutes and start converting visitors into loyal customers.',
    date: '2026-06-01',
    author: 'CircuCity Team',
    sections: [
      {
        heading: 'Why Your Store Needs an AI Chatbot',
        paragraphs: [
          'The e-commerce landscape has shifted. Today\'s customers expect instant answers, personalized recommendations, and 24/7 availability. Traditional live chat or email support simply cannot keep up with the volume and speed that modern shoppers demand.',
          'An AI-powered chatbot fills this gap perfectly. It can handle hundreds of conversations simultaneously, answer questions about your products instantly, and guide customers through their purchase journey — all without adding headcount to your support team.',
          'CircuCity AI takes this a step further by being purpose-built for e-commerce. Unlike generic chatbots, our AI understands product catalogs, handles shipping and return inquiries, and can recommend items based on customer preferences. And the best part? You can set it up in under 15 minutes.',
        ],
      },
      {
        heading: 'Step 1: Create Your Account',
        paragraphs: [
          'Head over to CircuCity AI and sign up for a free account. You\'ll need just an email address and a password. Once registered, you\'ll land in your dashboard — the command center for your AI chatbot.',
          'During sign-up, you\'ll go through a quick onboarding flow where you name your store and tell us a bit about what you sell. This information helps the AI understand your business context from day one.',
        ],
      },
      {
        heading: 'Step 2: Add Your Products',
        paragraphs: [
          'Navigate to the Product Catalog tab in your dashboard. This is where you tell the AI what you sell. You have several options: upload a CSV file with your product data, enter products manually, or — coming soon — connect your Shopify or WooCommerce store for automatic syncing.',
          'For each product, provide at minimum the product name, description, price, and category. The more detail you include, the better the AI can answer customer questions. We recommend including tags like "sustainable," "organic," or "best-seller" to help the AI make smarter recommendations.',
        ],
      },
      {
        heading: 'Step 3: Configure Your Chat Widget',
        paragraphs: [
          'Go to the Chat Widget tab. Here you can customize the look and feel of your chatbot: choose your brand colors, set the welcome message, and configure the widget position on your website (bottom-right or bottom-left). You\'ll also find your unique embed code here.',
          'Copy the embed code and paste it into your website\'s HTML, just before the closing </body> tag. If you use Shopify, paste it into your theme.liquid file. The widget appears instantly on every page — no further configuration required.',
        ],
      },
      {
        heading: 'Step 4: Train Your AI',
        paragraphs: [
          'This is where the magic happens. In the Knowledge Base section, upload your FAQ documents, return policies, shipping information, and any other content your AI should know. The AI will use this data to answer customer questions accurately and consistently.',
          'You can also start a website crawl, which automatically scans your website and learns from your existing content. This is especially useful if you already have detailed product pages, an FAQ section, and an About page.',
        ],
      },
      {
        heading: 'Step 5: Go Live and Monitor',
        paragraphs: [
          'Toggle the widget to "Active" and you\'re live. Visit your website and test the chatbot yourself — ask it questions about your products, shipping, or returns to see how it responds.',
          'Use the Conversations tab in your dashboard to review real customer interactions. The Analytics tab shows you key metrics like total conversations, response times, and frequently asked questions. Use these insights to continuously improve your AI.',
        ],
      },
      {
        heading: 'What to Expect in Your First Week',
        paragraphs: [
          'Most stores see a significant reduction in repetitive support tickets within the first few days. Customers appreciate getting instant answers, and your support team can focus on complex cases that truly need human attention.',
          'The AI also learns over time. As more customers interact with it, it gets better at understanding your specific products and customer needs. We recommend checking in on your dashboard once a week to review performance and add any new information to the knowledge base.',
        ],
      },
    ],
  },
  'ai-ecommerce-guide': {
    slug: 'ai-ecommerce-guide',
    title: 'How AI is Transforming E-commerce Support',
    excerpt: 'Discover how AI-powered chatbots are reducing response times and increasing conversion rates across online stores worldwide.',
    date: '2026-05-28',
    author: 'CircuCity Team',
    sections: [
      {
        heading: 'The State of E-commerce Support Today',
        paragraphs: [
          'E-commerce has grown exponentially, but customer support hasn\'t kept pace. The average response time for email support is 12 hours. For live chat, it\'s 2 minutes, but only during business hours. Meanwhile, 79% of consumers say they expect an immediate response when they contact a brand.',
          'This gap between expectation and reality is costing stores billions in lost revenue. A study by Forrester found that 53% of online shoppers will abandon their cart if they can\'t find quick answers to their questions. The same study showed that a responsive support experience increases conversion rates by up to 20%.',
        ],
      },
      {
        heading: 'How AI Chatbots Close the Gap',
        paragraphs: [
          'AI-powered chatbots are uniquely positioned to solve this problem. They respond instantly, they\'re available 24/7, and they can handle an unlimited number of conversations simultaneously. No queues, no wait times, no "we\'ll get back to you within 24 hours."',
          'But the real value goes beyond speed. Modern AI chatbots understand context. They know your product catalog. They can recommend items based on a customer\'s preferences. They can check order status, explain shipping policies, and even handle returns — all through natural conversation.',
          'CircuCity AI takes this even further with multilingual support. Whether your customer speaks English, Swedish, or German, the AI responds in their language. This is particularly valuable for Nordic e-commerce stores that serve customers across multiple countries.',
        ],
      },
      {
        heading: 'Real-World Impact',
        paragraphs: [
          'Stores using CircuCity AI have reported dramatic improvements. One Swedish fashion retailer saw a 23% increase in conversion rate within the first month of implementation. Another electronics store reduced its support ticket volume by 60%, allowing their human team to focus on high-value customer relationships.',
          'The common thread among successful implementations is simple: the AI handles the repetitive, high-volume questions (shipping times, return policies, product availability) while human agents handle the nuanced, relationship-building conversations. This division of labor maximizes both efficiency and customer satisfaction.',
        ],
      },
      {
        heading: 'The Future of AI in E-commerce',
        paragraphs: [
          'We\'re still in the early innings of AI in e-commerce. The next frontier is proactive support — AI that reaches out to customers before they have a problem. Imagine an AI that notices a customer lingering on a product page and offers a personalized discount, or one that alerts a customer about a shipping delay before they have to ask.',
          'At CircuCity AI, we\'re actively building these capabilities. Our AI is learning to predict customer intent, identify at-risk shoppers, and intervene at exactly the right moment. The goal is not to replace human support, but to make every customer interaction more helpful, more personal, and more likely to result in a purchase.',
        ],
      },
    ],
  },
  'knowledge-base-tips': {
    slug: 'knowledge-base-tips',
    title: 'Best Practices for Building Your Knowledge Base',
    excerpt: 'Tips for uploading documents, crawling your website, and training your AI for maximum accuracy and relevance.',
    date: '2026-05-15',
    author: 'CircuCity Team',
    sections: [
      {
        heading: 'Why Your Knowledge Base Matters',
        paragraphs: [
          'The knowledge base is the single most important factor in how well your AI performs. Think of it as the AI\'s brain — the more relevant, accurate information you feed it, the smarter and more helpful it becomes. A sparse knowledge base leads to vague, generic responses. A well-stocked one leads to precise, helpful answers that feel like they came from a human expert.',
        ],
      },
      {
        heading: 'What to Upload',
        paragraphs: [
          'Start with the essentials: your return policy, shipping policy, warranty information, and FAQ document. These cover the majority of customer questions and immediately improve the AI\'s accuracy.',
          'Next, add product-specific documentation: sizing guides, care instructions, compatibility charts, or installation guides. Any information that helps a customer make a purchasing decision or use your product correctly belongs in the knowledge base.',
          'Don\'t forget your brand voice guidelines. Upload a document that describes your brand\'s tone, vocabulary, and values. The AI can reference this when crafting responses, ensuring consistency across all customer interactions.',
        ],
      },
      {
        heading: 'Document Format Best Practices',
        paragraphs: [
          'The AI processes your documents best when they are clean and well-structured. Use clear headings (H1, H2, H3) to organize information. Write in complete sentences rather than bullet-point fragments — the AI understands narrative context better than isolated data points.',
          'For product data, CSV files work well. Include columns for product name, description, price, category, stock status, and any unique attributes (size, color, material). The AI uses this structured data to answer factual questions like "Do you have this in blue?" or "What\'s the cheapest option?"',
          'Avoid uploading scanned PDFs with images of text. The AI can\'t extract text from image-based PDFs. Use text-based PDFs or plain text files whenever possible. If you only have scanned documents, run them through OCR (optical character recognition) software first.',
        ],
      },
      {
        heading: 'Website Crawl Strategy',
        paragraphs: [
          'The website crawl is the fastest way to build your knowledge base, but a thoughtful crawl strategy makes a big difference. Start by crawling your key pages: product pages, FAQ page, About page, and any policy pages (returns, shipping, privacy).',
          'Avoid crawling blog archives or news sections unless they contain evergreen product information. The AI doesn\'t need to know about last year\'s holiday sale — in fact, outdated information can cause it to give incorrect answers.',
          'After the initial crawl, set a recurring crawl schedule (weekly is ideal for most stores). This ensures your AI stays current as you add products and update policies.',
        ],
      },
      {
        heading: 'Testing and Iterating',
        paragraphs: [
          'Don\'t just upload and forget. Test your AI regularly by asking it questions you know customers will ask. Check the Conversations tab to see what customers are actually asking, and add any missing information to your knowledge base.',
          'If the AI gives an incorrect or incomplete answer, investigate why. Usually, it\'s because the relevant information wasn\'t in the knowledge base, or it was present but poorly structured. Fix the source document and re-upload — the AI will immediately improve.',
          'This feedback loop is the secret to a great AI experience. The stores with the best-performing chatbots are the ones that treat their knowledge base as a living document, constantly updating and refining it based on real customer interactions.',
        ],
      },
    ],
  },
};

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = POSTS[params.slug];

  if (!post) {
    return (
      <PageLayout>
        <section className="py-20 bg-dark-navy text-white text-center px-6">
          <h1 className="text-4xl font-extrabold">Post Not Found</h1>
          <Link href="/blog" className="text-lemon-green mt-4 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <article>
        <section className="py-20 bg-dark-navy text-white text-center px-6">
          <Link href="/blog" className="text-lemon-green text-sm inline-flex items-center gap-1 mb-4 hover:underline">
            <ArrowLeft className="w-3 h-3" /> Back to Blog
          </Link>
          <h1 className="text-3xl lg:text-4xl font-extrabold mb-4 max-w-3xl mx-auto">{post.title}</h1>
          <p className="text-gray-400 max-w-2xl mx-auto mb-6">{post.excerpt}</p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {post.author}
            </span>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            {post.sections.map((section, i) => (
              <div key={i} className="mb-10">
                <h2 className="text-2xl font-bold text-dark-navy mb-4">{section.heading}</h2>
                {section.paragraphs.map((p, j) => (
                  <p key={j} className="mb-4 text-gray-600 leading-relaxed">{p}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </article>

      {/* Related Posts */}
      <div className="border-t">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h3 className="text-lg font-bold text-dark-navy mb-6">More from the blog</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(POSTS).filter(p => p.slug !== post.slug).slice(0, 2).map(p => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="border rounded-xl p-5 hover:border-primary/50 hover:shadow-sm transition-all block"
              >
                <h4 className="font-bold text-dark-navy mb-2">{p.title}</h4>
                <p className="text-sm text-gray-500 line-clamp-2">{p.excerpt}</p>
                <p className="text-xs text-gray-400 mt-3">{new Date(p.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

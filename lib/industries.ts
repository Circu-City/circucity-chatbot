export interface Industry {
  slug: string;
  name: string;
  icon: string;
  description: string;
  valueProp: string;
  heroTitle: string;
  heroSubtitle: string;
  stats: { label: string; value: string }[];
  useCases: { title: string; desc: string }[];
  heroImage: string;
  painPoints: string[];
}

export const industries: Industry[] = [
  {
    slug: "clothing-apparel",
    name: "Clothing & Apparel",
    icon: "shirt",
    description: "Sizing, stock, and style recommendations on autopilot.",
    valueProp: "Eliminate fit and sizing questions with AI that knows your entire catalog by SKU, size, and color.",
    heroTitle: "AI That Knows Every Stitch in Your Inventory",
    heroSubtitle: "From size charts to style recommendations, CircuCity AI handles fit questions, stock checks, and cross-sell suggestions — so your team can focus on collections, not FAQs.",
    stats: [
      { label: "Avg Resolution Rate", value: "78%" },
      { label: "Response Time", value: "< 2s" },
      { label: "Cart Recovery Lift", value: "+18%" },
    ],
    useCases: [
      { title: "Smart Size Recommendations", desc: "AI suggests the perfect fit based on customer measurements, past purchases, and return data — reducing size-related returns by up to 30%." },
      { title: "Outfit Coordination", desc: "Shoppers describe what they need, and AI recommends complete looks from your catalog — boosting average order value." },
      { title: "Stock & Restock Alerts", desc: "Customers check availability and get notified when their size is back — without a single support ticket." },
    ],
    heroImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
    painPoints: [
      "Size and fit questions flooding support",
      "High return rates from wrong sizes",
      "Slow response times during flash sales",
      "Missed cross-sell opportunities",
    ],
  },
  {
    slug: "beauty-cosmetics",
    name: "Beauty & Cosmetics",
    icon: "sparkles",
    description: "Ingredient questions and product matching made instant.",
    valueProp: "Match customers to their perfect products with AI that understands ingredients, skin types, and preferences.",
    heroTitle: "Your Virtual Beauty Advisor, Online 24/7",
    heroSubtitle: "CircuCity AI recommends products based on skin type, concerns, and ingredients — just like your best in-store consultant.",
    stats: [
      { label: "Product Match Accuracy", value: "94%" },
      { label: "Response Time", value: "< 2s" },
      { label: "Avg Order Value Lift", value: "+28%" },
    ],
    useCases: [
      { title: "Ingredient-Aware Recommendations", desc: "AI filters products by ingredients, allergies, and preferences — helping sensitive customers shop with confidence." },
      { title: "Routine Building", desc: "Customers describe their skin concerns, and AI builds a full routine from your catalog — increasing basket size." },
      { title: "Subscription Management", desc: "Pause, skip, or modify recurring orders through chat — no emails, no phone calls." },
    ],
    heroImage: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
    painPoints: [
      "Complex product matching questions",
      "Ingredient and allergy inquiries",
      "High volume of subscription management requests",
      "Missed upsell opportunities during support",
    ],
  },
  {
    slug: "home-garden",
    name: "Home & Garden",
    icon: "home",
    description: "Product specs, delivery updates, and assembly help 24/7.",
    valueProp: "Answer spec, dimension, and compatibility questions instantly — reducing returns and building buyer confidence.",
    heroTitle: "Help Customers Build Their Dream Space",
    heroSubtitle: "Whether it's a sofa dimensions or plant care instructions, CircuCity AI has the answers — trained on your product data.",
    stats: [
      { label: "Spec Questions Handled", value: "85%" },
      { label: "Return Rate Reduction", value: "-22%" },
      { label: "CSAT Score", value: "92%" },
    ],
    useCases: [
      { title: "Dimension & Compatibility Checks", desc: "AI answers fit and compatibility questions using real product specs — reducing purchase hesitation and returns." },
      { title: "Assembly & Care Guidance", desc: "Customers ask assembly questions or care instructions — AI pulls answers directly from your product manuals." },
      { title: "Delivery Window Coordination", desc: "Real-time delivery updates, rescheduling, and status checks — all handled in chat without agent involvement." },
    ],
    heroImage: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&q=80",
    painPoints: [
      "Product dimension and compatibility questions",
      "Assembly and setup inquiries",
      "Delivery coordination overhead",
      "High return rates from wrong expectations",
    ],
  },
  {
    slug: "food-beverage",
    name: "Food & Beverage",
    icon: "utensils-crossed",
    description: "Dietary, allergen, and subscription questions handled instantly.",
    valueProp: "Serve dietary and allergen inquiries instantly with AI trained on your ingredients and sourcing data.",
    heroTitle: "Instant Answers for Every Ingredient Question",
    heroSubtitle: "From allergen inquiries to subscription management, CircuCity AI serves up accurate answers your customers can trust.",
    stats: [
      { label: "Allergen Accuracy", value: "99%" },
      { label: "Auto-Resolution Rate", value: "76%" },
      { label: "Subscription Save Rate", value: "+32%" },
    ],
    useCases: [
      { title: "Dietary & Allergen Filtering", desc: "AI answers ingredient, allergen, and dietary preference questions from your product data — no guesswork, no liability." },
      { title: "Subscription & Reorder Management", desc: "Skip, pause, or customize recurring orders through a simple chat — reducing support volume by 40%." },
      { title: "Recipe & Pairing Suggestions", desc: "Shoppers ask for serving ideas or wine pairings — AI suggests from your content library, increasing basket size." },
    ],
    heroImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
    painPoints: [
      "Allergen and dietary inquiry volume",
      "Subscription modification requests",
      "Recipe and usage questions",
      "Compliance and labeling accuracy",
    ],
  },
  {
    slug: "health-wellness",
    name: "Health & Wellness",
    icon: "heart-pulse",
    description: "Supplement guidance and compliance info with zero errors.",
    valueProp: "Deliver accurate supplement guidance and compliance info with AI trained on your formulations and certifications.",
    heroTitle: "Trusted Wellness Guidance at Any Hour",
    heroSubtitle: "CircuCity AI handles supplement questions, regimen building, and compliance info with the accuracy your customers deserve.",
    stats: [
      { label: "Inquiry Auto-Resolution", value: "72%" },
      { label: "Compliance Accuracy", value: "99%" },
      { label: "Customer Trust Score", value: "4.8/5" },
    ],
    useCases: [
      { title: "Supplement Matching", desc: "AI recommends products based on health goals, existing routines, and dietary restrictions — like a knowledgeable wellness coach." },
      { title: "Regimen & Dosage Guidance", desc: "Customers ask about usage, timing, and stacking — AI answers from verified product data, not the open internet." },
      { title: "Certification & Sourcing Info", desc: "Organic, non-GMO, vegan, gluten-free — AI confirms certifications and sourcing details instantly and accurately." },
    ],
    heroImage: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
    painPoints: [
      "Supplement and dosage questions",
      "Certification and compliance inquiries",
      "Building customer trust online",
      "Regimen personalization at scale",
    ],
  },
  {
    slug: "electronics",
    name: "Consumer Electronics",
    icon: "monitor-smartphone",
    description: "Tech specs, compatibility, and warranty support.",
    valueProp: "Resolve spec comparisons, compatibility checks, and warranty questions instantly — reducing returns and support tickets.",
    heroTitle: "Tech Support That Actually Knows Your Products",
    heroSubtitle: "CircuCity AI understands specs, compatibility, and warranty terms across your entire catalog — resolving inquiries in seconds.",
    stats: [
      { label: "Spec Accuracy", value: "97%" },
      { label: "Return Rate Reduction", value: "-25%" },
      { label: "First Response Time", value: "< 3s" },
    ],
    useCases: [
      { title: "Spec-to-Spec Comparison", desc: "Customers compare products by specs, price, and features — AI provides side-by-side analysis from real catalog data." },
      { title: "Compatibility Checks", desc: "AI confirms whether accessories, parts, or add-ons work together — reducing order errors and returns." },
      { title: "Warranty & Repair Support", desc: "Warranty status, claim filing, and repair tracking — all handled in chat with no agent needed." },
    ],
    heroImage: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&q=80",
    painPoints: [
      "Technical spec comparison questions",
      "Compatibility and accessory inquiries",
      "Warranty and repair process requests",
      "High support volume during launches",
    ],
  },
  {
    slug: "subscriptions",
    name: "Subscriptions",
    icon: "rotate-3d",
    description: "Plan changes, skip requests, and billing queries automated.",
    valueProp: "Automate the full subscription lifecycle — signups, modifications, and cancellations — without agent involvement.",
    heroTitle: "Run Your Subscription Empire on Autopilot",
    heroSubtitle: "Let AI handle plan changes, billing inquiries, and cancellation retention — so your team can focus on growth.",
    stats: [
      { label: "Subscription Queries Handled", value: "82%" },
      { label: "Retention Rate Improvement", value: "+35%" },
      { label: "Support Cost Reduction", value: "-40%" },
    ],
    useCases: [
      { title: "Plan & Billing Management", desc: "Upgrade, downgrade, or change billing — AI handles it all in chat with zero friction for the customer." },
      { title: "Skip & Pause Requests", desc: "Customers skip a delivery or pause their subscription — AI processes it instantly and confirms the change." },
      { title: "Cancellation Retention", desc: "When a customer wants to cancel, AI offers personalized retention offers and collects feedback before processing." },
    ],
    heroImage: "https://images.unsplash.com/photo-1595246135406-803418233494?w=600&q=80",
    painPoints: [
      "High volume of billing inquiries",
      "Skip and pause request management",
      "Cancellation and retention challenges",
      "Plan upgrade discovery",
    ],
  },
  {
    slug: "saas-software",
    name: "SaaS & Software",
    icon: "monitor-smartphone",
    description: "Onboarding, billing, and feature questions answered instantly.",
    valueProp: "Help users adopt your product faster with AI that understands plans, features, integrations, and billing — without waiting for support.",
    heroTitle: "Support That Scales With Your Product",
    heroSubtitle: "Cira handles trial questions, plan comparisons, integration setup, and billing inquiries — so your team can focus on building, not tickets.",
    stats: [
      { label: "Onboarding Questions Resolved", value: "81%" },
      { label: "Trial-to-Paid Lift", value: "+19%" },
      { label: "First Response Time", value: "< 2s" },
    ],
    useCases: [
      { title: "Plan & Feature Guidance", desc: "Prospects compare tiers and features — Cira explains differences clearly and recommends the right plan for their use case." },
      { title: "Setup & Integration Help", desc: "Users ask how to connect Shopify, Stripe, or your API — Cira walks them through verified docs and next steps." },
      { title: "Billing & Account Management", desc: "Upgrade, downgrade, invoice, and seat changes — handled in chat with accurate policy answers." },
    ],
    heroImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
    painPoints: [
      "Repetitive onboarding and setup questions",
      "Plan comparison confusion during trials",
      "Billing and subscription change requests",
      "Support backlog during product launches",
    ],
  },
  {
    slug: "finance-fintech",
    name: "Finance & Fintech",
    icon: "dollar-sign",
    description: "Compliance-aware answers for accounts, payments, and policies.",
    valueProp: "Deliver accurate, policy-grounded support for financial products — with clear escalation when human review is required.",
    heroTitle: "Trusted Financial Support at Any Hour",
    heroSubtitle: "Cira answers account, payment, and policy questions from your verified knowledge base — never inventing rates, fees, or compliance details.",
    stats: [
      { label: "Policy Query Accuracy", value: "98%" },
      { label: "Escalation Precision", value: "99%" },
      { label: "Response Time", value: "< 3s" },
    ],
    useCases: [
      { title: "Account & Verification Help", desc: "Customers ask about KYC, account status, and document requirements — Cira guides them through verified steps." },
      { title: "Fees, Rates & Product Info", desc: "Transparent answers on pricing, limits, and product features — sourced only from approved documentation." },
      { title: "Secure Human Handoff", desc: "Sensitive cases escalate immediately with full conversation context to your compliance-trained team." },
    ],
    heroImage: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&q=80",
    painPoints: [
      "High-stakes accuracy requirements",
      "Complex policy and fee questions",
      "Regulatory compliance in responses",
      "After-hours support expectations",
    ],
  },
  {
    slug: "education",
    name: "Education & EdTech",
    icon: "book-open",
    description: "Enrollment, course, and platform help for students and admins.",
    valueProp: "Guide learners and administrators through courses, enrollment, and platform questions — reducing support load during peak enrollment.",
    heroTitle: "An Academic Advisor That Never Sleeps",
    heroSubtitle: "From course selection to enrollment deadlines, Cira helps students and staff get accurate answers instantly.",
    stats: [
      { label: "Enrollment Queries Handled", value: "77%" },
      { label: "Student Satisfaction", value: "4.7/5" },
      { label: "Peak Season Relief", value: "-45% tickets" },
    ],
    useCases: [
      { title: "Course & Program Discovery", desc: "Students explore programs, prerequisites, and schedules — Cira recommends options based on their goals." },
      { title: "Enrollment & Deadline Support", desc: "Application steps, payment deadlines, and document requirements — answered clearly from your policies." },
      { title: "Platform & Technical Help", desc: "LMS access, login issues, and assignment submission — resolved or escalated with context." },
    ],
    heroImage: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80",
    painPoints: [
      "Enrollment season ticket spikes",
      "Course and prerequisite confusion",
      "Platform access and login issues",
      "After-hours student questions",
    ],
  },
  {
    slug: "travel-hospitality",
    name: "Travel & Hospitality",
    icon: "plane",
    description: "Bookings, changes, and guest inquiries handled 24/7.",
    valueProp: "Resolve booking changes, policy questions, and guest requests instantly — across time zones and peak travel seasons.",
    heroTitle: "Guest Support That Travels With Your Customers",
    heroSubtitle: "Cira handles reservations, modifications, and pre-arrival questions — so your team can focus on in-person hospitality.",
    stats: [
      { label: "Booking Inquiries Resolved", value: "74%" },
      { label: "Guest Response Time", value: "< 2s" },
      { label: "CSAT Improvement", value: "+18pts" },
    ],
    useCases: [
      { title: "Booking & Modification Help", desc: "Guests change dates, rooms, or add-ons — Cira checks policies and guides next steps accurately." },
      { title: "Pre-Arrival Information", desc: "Check-in times, amenities, local tips, and special requests — answered from your property knowledge base." },
      { title: "Multilingual Guest Support", desc: "Serve international travelers in their language without staffing a 24/7 multilingual team." },
    ],
    heroImage: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80",
    painPoints: [
      "High volume during peak seasons",
      "Booking change and cancellation requests",
      "Time-zone coverage gaps",
      "Pre-arrival question overload",
    ],
  },
  {
    slug: "professional-services",
    name: "Professional Services",
    icon: "briefcase",
    description: "Qualify leads, answer service questions, and book consultations.",
    valueProp: "Turn website visitors into qualified leads with AI that understands your services, pricing models, and consultation process.",
    heroTitle: "Convert Inquiries Into Booked Consultations",
    heroSubtitle: "Cira qualifies prospects, answers service questions, and routes high-intent leads to your team — automatically.",
    stats: [
      { label: "Lead Qualification Rate", value: "68%" },
      { label: "Consultation Bookings", value: "+31%" },
      { label: "Response Time", value: "< 2s" },
    ],
    useCases: [
      { title: "Service Scope & Pricing", desc: "Prospects ask what's included and how pricing works — Cira gives clear, consultative answers from your service catalog." },
      { title: "Lead Qualification", desc: "Cira asks about budget, timeline, and needs — then routes qualified leads to the right team member." },
      { title: "Appointment Scheduling", desc: "Book discovery calls and consultations directly from chat with calendar integration." },
    ],
    heroImage: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80",
    painPoints: [
      "Unqualified inbound inquiries",
      "Slow response losing prospects",
      "Repetitive service scope questions",
      "Manual lead routing overhead",
    ],
  },
];

export const industryCategories = [
  { label: "E-commerce", slugs: ["clothing-apparel", "beauty-cosmetics", "home-garden", "food-beverage", "electronics", "subscriptions"] },
  { label: "Business & SaaS", slugs: ["saas-software", "professional-services", "finance-fintech"] },
  { label: "Specialized", slugs: ["health-wellness", "education", "travel-hospitality"] },
];

export function getIndustry(slug: string): Industry | undefined {
  return industries.find(i => i.slug === slug);
}

export interface PlanConfig {
  name: string;
  price: number | null;
  priceLabel: string;
  description: string;
  features: string[];
  popular: boolean;
  cta: string;
  href: string;
}

export const PLANS: PlanConfig[] = [
  {
    name: "Starter",
    price: 0,
    priceLabel: "$0",
    description: "Get started with essential AI support for your store.",
    features: ["1,000 messages/mo", "1 store integration", "Basic AI product training", "Widget embed", "Email support"],
    popular: false,
    cta: "Start free",
    href: "/sign-up?plan=starter",
  },
  {
    name: "Growth",
    price: 49,
    priceLabel: "$49",
    description: "Scale AI support across multiple stores with advanced insights.",
    features: ["10,000 messages/mo", "3 store integrations", "Advanced AI product training", "Real-time product sync", "Proactive cart recovery", "Detailed analytics dashboard", "Priority support"],
    popular: true,
    cta: "Try 14 days free",
    href: "/sign-up?plan=growth",
  },
  {
    name: "Scale",
    price: 149,
    priceLabel: "$149",
    description: "Custom AI training and dedicated support for growing teams.",
    features: ["50,000 messages/mo", "10 store integrations", "Custom LLM training on your data", "Multi-language support", "Human handoff API", "Unanswered question insights", "Custom reporting", "Dedicated account manager"],
    popular: false,
    cta: "Try 14 days free",
    href: "/sign-up?plan=scale",
  },
  {
    name: "Enterprise",
    price: null,
    priceLabel: "Custom",
    description: "Unlimited everything. White-label, SSO, and custom SLAs.",
    features: ["Unlimited messages", "Unlimited stores", "Custom model fine-tuning", "White-label widget", "SSO / SAML", "Custom integrations", "99.99% SLA", "Dedicated success manager"],
    popular: false,
    cta: "Contact sales",
    href: "/contact",
  },
];

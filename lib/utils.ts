import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { nanoid } from "nanoid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return nanoid();
}

export function generateApiKey(): string {
  return `cc_${nanoid(32)}`;
}

export function generateEmbedCode(apiKey: string): string {
  return `<script src="https://chatbot.circucity.com/api/widget?apiKey=${apiKey}" async></script>`;
}

export function formatPrice(price: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getPlanLimits(plan: string) {
  const limits = {
    free: { messages: 1000, stores: 1, products: 100, teamMembers: 1 },
    starter: { messages: 5000, stores: 1, products: 500, teamMembers: 2 },
    pro: { messages: 25000, stores: 3, products: 5000, teamMembers: 5 },
    enterprise: { messages: Infinity, stores: Infinity, products: Infinity, teamMembers: Infinity },
  };
  return limits[plan as keyof typeof limits] || limits.free;
}
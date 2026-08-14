import { industries, getIndustry } from '@/lib/industries';
import IndustryPageClient from './IndustryPageClient';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return industries.map((industry) => ({ slug: industry.slug }));
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) notFound();
  return <IndustryPageClient slug={slug} />;
}

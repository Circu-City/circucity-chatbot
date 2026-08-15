'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Bot, Camera, Check, CheckCircle2, Download, FileJson, FileSpreadsheet, FileText,
  Globe2, Images, LayoutDashboard, Loader2, RefreshCw, Send, Sparkles, Trash2, X, XCircle,
  LineChart, Cable, Archive, ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type DraftStatus = 'queued' | 'analyzing' | 'review' | 'error';
type ListingDraft = {
  id: string;
  previewUrl: string;
  status: DraftStatus;
  title: string;
  description: string;
  category: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  price: string;
  weight: string;
  estimatedAge: string;
  quantity: string;
  priceGrounded: boolean;
  co2Saved: string;
  attributes: Record<string, string>;
  reviewed: boolean;
  error?: string;
  source?: string;
};

const conditionLabels = { new: 'New', like_new: 'Like new', good: 'Good', fair: 'Fair', poor: 'Poor' } as const;

const CATEGORIES = [
  'Bag', 'Eco Home', 'Electronics', 'General', 'Green Gadgets',
  'Recycled Items', 'Skincare', 'Sustainable Fashion',
];

const CONNECTORS = [
  { id: 'shopify', name: 'Shopify', desc: 'Import straight into your Shopify admin once connected.', tier: 'Growth' },
  { id: 'woo', name: 'WooCommerce', desc: 'Publish drafts directly to your WooCommerce product catalog.', tier: 'Growth' },
  { id: 'ebay', name: 'eBay', desc: 'Cross-list to eBay with per-marketplace pricing.', tier: 'Professional' },
  { id: 'etsy', name: 'Etsy', desc: 'Send vintage & handmade drafts to Etsy.', tier: 'Professional' },
  { id: 'webhook', name: 'Webhook / API', desc: 'Push drafts anywhere with the Listing API.', tier: 'Professional' },
];

const CSV_HEADERS = 'title,description,price,currency,category,condition,estimated_age,weight_kg,quantity,co2_saved_kg,attributes,image_data_url';

function csvEscape(value: string): string {
  let text = String(value ?? '');
  // Formula-injection guard: Excel/Sheets interpret leading = + - @ as formulas.
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  if (/[",\n\r]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
  return text;
}

function download(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// One analysis at a time: mirrors the server's concurrency cap and keeps the
// queue UX honest when several photos are captured back-to-back.
let analysisQueue: Promise<void> = Promise.resolve();

function enqueueAnalysis(task: () => Promise<void>) {
  analysisQueue = analysisQueue.then(task, task);
}

function draftToRow(d: ListingDraft, imageDataUrl = ''): string {
  return [
    d.title,
    d.description,
    d.price,
    'SEK',
    d.category,
    d.condition,
    d.estimatedAge || 'Unknown',
    d.weight || '0.5',
    d.quantity || '1',
    d.co2Saved || '0',
    Object.entries(d.attributes).map(([k, v]) => `${k}: ${v}`).join(' | '),
    imageDataUrl || '',
  ].map(csvEscape).join(',');
}

function draftToJson(d: ListingDraft, imageDataUrl = '') {
  return {
    title: d.title,
    description: d.description,
    price: Number(d.price) || 0,
    currency: 'SEK',
    category: d.category,
    condition: d.condition,
    estimated_age: d.estimatedAge || 'Unknown',
    weight_kg: Number(d.weight) || 0.5,
    quantity: Math.max(1, Number(d.quantity) || 1),
    co2_saved_kg: Number(d.co2Saved) || 0,
    attributes: d.attributes,
    ai_source: d.source,
    image: imageDataUrl,
  };
}

async function prepareAnalysisImage(file: File): Promise<string> {
  try {
    const image = await createImageBitmap(file);
    const scale = Math.min(1, 1024 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return '';
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }
}

export default function ListingDeskPage() {
  const [embed, setEmbed] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<Record<string, File>>({});
  const [drafts, setDrafts] = useState<ListingDraft[]>([]);
  const [activeConnector, setActiveConnector] = useState<typeof CONNECTORS[number] | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [quota, setQuota] = useState<string>('');
  const [listingLanguage, setListingLanguage] = useState('sv');

  // Read the embed flag on the client only to avoid server/client hydration
  // mismatches (window is unavailable during SSR).
  useEffect(() => {
    setEmbed(new URLSearchParams(window.location.search).get('embed') === '1');
  }, []);

  const updateDraft = (id: string, update: Partial<ListingDraft>) => {
    setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, ...update } : draft));
  };

  const analyseFile = async (id: string, file: File) => {
    try {
      updateDraft(id, { status: 'analyzing', error: undefined });
      const analysisImage = await prepareAnalysisImage(file);
      if (!analysisImage) throw new Error('This image could not be prepared for AI analysis. Try JPEG, PNG, or WEBP.');

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45_000);
      const analysisResponse = await fetch('/api/demo/listings/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: analysisImage, language: listingLanguage }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      let analysis: Record<string, unknown> = {};
      try { analysis = await analysisResponse.json(); } catch { /* empty */ }
      if (!analysisResponse.ok) throw new Error(typeof analysis.error === 'string' ? analysis.error : 'AI analysis failed');
      if (analysis.quota && typeof analysis.quota === 'object') {
        const q = analysis.quota as { used?: number; limit?: number; keyed?: boolean };
        if (q.used && q.limit) setQuota(`Analysis ${q.used}/${q.limit} used in this demo`);
      }

      updateDraft(id, {
        status: 'review',
        title: typeof analysis.title === 'string' && analysis.title ? analysis.title : 'Second-hand item',
        description: typeof analysis.description === 'string' ? analysis.description : '',
        category: typeof analysis.category === 'string' && analysis.category ? analysis.category : 'General',
        condition: (['new', 'like_new', 'good', 'fair', 'poor'].includes(String(analysis.condition)) ? String(analysis.condition) : 'good') as ListingDraft['condition'],
        price: typeof analysis.suggestedPriceSek === 'number' ? String(analysis.suggestedPriceSek) : '',
        weight: typeof analysis.estimatedWeightKg === 'number' ? String(analysis.estimatedWeightKg) : '0.5',
        estimatedAge: typeof analysis.estimatedAge === 'string' ? analysis.estimatedAge : 'Unknown',
        quantity: typeof analysis.quantity === 'number' && analysis.quantity > 0 ? String(analysis.quantity) : '1',
        priceGrounded: Boolean(analysis.priceGrounded),
        co2Saved: typeof analysis.co2Saved === 'number' ? String(analysis.co2Saved) : '0',
        attributes: (analysis.attributes && typeof analysis.attributes === 'object' ? analysis.attributes as Record<string, string> : {}),
        source: String(analysis.source || ''),
      });
    } catch (error) {
      updateDraft(id, {
        status: 'error',
        error: error instanceof Error && error.name === 'AbortError'
          ? 'The analysis took too long. Try again in a moment.'
          : error instanceof Error ? error.message : 'Processing failed',
      });
    }
  };

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const accepted = Array.from(files).filter((file) => file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024);
    const additions = accepted.map((file) => {
      const id = crypto.randomUUID();
      filesRef.current[id] = file;
      return {
      id,
      previewUrl: URL.createObjectURL(file),
      status: 'queued',
      title: '',
      description: '',
      category: '',
      condition: 'good',
      price: '',
      weight: '0.5',
      estimatedAge: '',
      quantity: '1',
      priceGrounded: false,
      co2Saved: '0',
      attributes: {},
      reviewed: false,
    } as ListingDraft;
    });
    setDrafts((current) => [...additions, ...current]);
    additions.forEach((draft, index) => {
      const file = accepted[index];
      enqueueAnalysis(() => analyseFile(draft.id, file));
    });
  };

  const removeDraft = (draft: ListingDraft) => {
    URL.revokeObjectURL(draft.previewUrl);
    delete filesRef.current[draft.id];
    setDrafts((current) => current.filter((item) => item.id !== draft.id));
  };

  const reviewed = drafts.filter((d) => d.status === 'review');
  const confirmed = reviewed.filter((d) => d.reviewed);
  const processing = drafts.filter((d) => d.status === 'queued' || d.status === 'analyzing').length;
  const pendingReview = drafts.filter((d) => d.status === 'review').length;

  const exportWithImages = async (draftsToExport: ListingDraft[]) => {
    const rows = await Promise.all(draftsToExport.map(async (d) => {
      const file = filesRef.current[d.id];
      const imageDataUrl = file ? await prepareAnalysisImage(file) : '';
      return { draft: d, imageDataUrl };
    }));
    return rows;
  };

  const exportCsv = async () => {
    if (!reviewed.length) return;
    const rows = await exportWithImages(reviewed);
    // UTF-8 BOM so Excel opens Swedish characters correctly.
    download('circucity-listing-drafts.csv', '\uFEFF' + [CSV_HEADERS, ...rows.map((r) => draftToRow(r.draft, r.imageDataUrl))].join('\r\n'), 'text/csv');
  };

  const exportJson = async () => {
    if (!reviewed.length) return;
    const rows = await exportWithImages(reviewed);
    download('circucity-listing-drafts.json', JSON.stringify(rows.map((r) => draftToJson(r.draft, r.imageDataUrl)), null, 2), 'application/json');
  };

  const exportExcel = async () => {
    if (!reviewed.length) return;
    const rows = await exportWithImages(reviewed);
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Listings');

    sheet.columns = [
      { header: 'Photo', key: 'photo', width: 14 },
      { header: 'Title', key: 'title', width: 42 },
      { header: 'Description', key: 'description', width: 60 },
      { header: 'Price (SEK)', key: 'price', width: 12 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Condition', key: 'condition', width: 12 },
      { header: 'Est. age', key: 'age', width: 12 },
      { header: 'Weight (kg)', key: 'weight', width: 12 },
      { header: 'Stock', key: 'quantity', width: 8 },
      { header: 'CO2 saved (kg)', key: 'co2', width: 14 },
      { header: 'Attributes', key: 'attributes', width: 40 },
      { header: 'Grounding', key: 'grounding', width: 12 },
    ];
    sheet.getRow(1).font = { bold: true };

    rows.forEach((r, index) => {
      const d = r.draft;
      sheet.addRow({
        photo: '',
        title: d.title,
        description: d.description,
        price: d.price,
        category: d.category,
        condition: d.condition,
        age: d.estimatedAge || 'Unknown',
        weight: d.weight || '0.5',
        quantity: d.quantity || '1',
        co2: d.co2Saved || '0',
        attributes: Object.entries(d.attributes).map(([k, v]) => `${k}: ${v}`).join(' | '),
        grounding: d.priceGrounded ? 'grounded' : '',
      });
      const row = sheet.lastRow;
      if (row) row.height = 90;
      if (r.imageDataUrl) {
        try {
          const imageId = workbook.addImage({ base64: r.imageDataUrl.split(',')[1], extension: 'jpeg' });
          sheet.addImage(imageId, {
            tl: { col: 0, row: index + 1 },
            ext: { width: 80, height: 80 },
          });
        } catch { /* photo could not be embedded — keep the row */ }
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'circucity-listing-drafts.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  };

  const exportPdf = async () => {
    if (!reviewed.length) return;
    const rows = await exportWithImages(reviewed);
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

    const images = await Promise.all(rows.map(async (r) => {
      if (!r.imageDataUrl) return null;
      const img = new Image();
      try {
        img.src = r.imageDataUrl;
        await img.decode();
        return { raw: r.imageDataUrl, w: img.naturalWidth, h: img.naturalHeight };
      } catch { return null; }
    }));

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFillColor(11, 26, 63);
    doc.rect(0, 0, 297, 16, 'F');
    doc.setTextColor(203, 234, 72);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('CircuCity Product Listings', 12, 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`${rows.length} product(s) - exported ${new Date().toLocaleDateString()}`, 12, 13.5);

    autoTable(doc, {
      startY: 19,
      margin: { left: 8, right: 8, bottom: 10 },
      head: [[
        'Photo', 'Title', 'Description', 'Price (SEK)', 'Category', 'Condition',
        'Est. age', 'Weight (kg)', 'Stock', 'CO2 (kg)', 'Attributes',
      ]],
      body: rows.map((r) => {
        const d = r.draft;
        return [
          r.imageDataUrl || '',
          d.title,
          (d.description || '').slice(0, 140),
          String(d.price),
          d.category,
          d.condition,
          d.estimatedAge || 'Unknown',
          d.weight || '0.5',
          d.quantity || '1',
          d.co2Saved || '0',
          Object.entries(d.attributes).map(([k, v]) => `${k}: ${v}`).join(' | ').slice(0, 80),
        ];
      }),
      styles: { fontSize: 8, cellPadding: 1.5, valign: 'middle' },
      headStyles: { fillColor: [11, 26, 63], textColor: [203, 234, 72], fontSize: 8.5, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 252] },
      columnStyles: { 0: { cellWidth: 26 } },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) data.cell.text = [''];
      },
      didDrawCell: (data) => {
        if (data.section !== 'body' || data.column.index !== 0) return;
        const img = images[data.row.index];
        if (!img) return;
        const maxW = data.cell.width - 2;
        const maxH = data.cell.height - 2;
        const scale = Math.min(maxW / img.w, maxH / img.h, 1);
        const w = img.w * scale;
        const h = img.h * scale;
        const x = data.cell.x + (data.cell.width - w) / 2;
        const y = data.cell.y + (data.cell.height - h) / 2;
        try { doc.addImage(img.raw, 'JPEG', x, y, w, h); } catch { /* skip */ }
      },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Page ${i} of ${pageCount}`, 280, 202, { align: 'right' });
    }

    doc.save('circucity-listing-drafts.pdf');
  };

  const copyCsvRow = async (draft: ListingDraft) => {
    try {
      await navigator.clipboard.writeText(draftToRow(draft));
    } catch { /* clipboard may be unavailable */ }
  };

  return (
    <main className="min-h-screen bg-dark-navy text-white">
      <header className="border-b border-white/10 bg-[#0A1428]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-lemon-gradient rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-dark-navy" />
            </div>
            <span className="font-bold tracking-tight">CircuCity <span className="text-lemon-green">Gavriel Listing AI</span></span>
            <span className="ml-2 rounded-full bg-lemon-green/15 px-2.5 py-0.5 text-[11px] font-bold text-lemon-green">Listing Desk · Live demo</span>
          </div>
          {!embed && (
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/gavriel-listing-ai" className="rounded-lg px-3 py-1.5 text-gray-300 hover:bg-white/10 hover:text-white transition">
                <ArrowLeft className="mr-1 inline h-3.5 w-3.5" /> Gavriel Listing AI
              </Link>
              <Link href="/api-docs" className="hidden sm:inline-block rounded-lg px-3 py-1.5 text-gray-300 hover:bg-white/10 hover:text-white transition">API docs</Link>
              <a href="https://circucity.se/dashboard/seller/products/bulk-ai" target="_blank" rel="noopener noreferrer" className="hidden sm:inline-block rounded-lg px-3 py-1.5 text-gray-300 hover:bg-white/10 hover:text-white transition">
                <ShoppingCart className="mr-1 inline h-3.5 w-3.5" /> Marketplace
              </a>
            </nav>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <section>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-lemon-green">Camera-to-catalogue</p>
          <h1 className="mt-1 text-3xl font-extrabold">Photograph stock. AI writes the listing. Export anywhere.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Take one photo per item. CircuCity AI drafts the title, description, category,
            condition, second-hand price and shipping weight — while you keep capturing.
            Every draft must be reviewed before you export it to any platform.
          </p>
          <label className="mt-4 inline-flex items-center gap-2 text-sm text-gray-300" htmlFor="listing-language">
            AI Listing Language
            <select
              id="listing-language"
              value={listingLanguage}
              onChange={(event) => setListingLanguage(event.target.value)}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-lemon-green/40"
            >
              <option value="sv">Svenska</option>
              <option value="en">English</option>
              <option value="nl">Dutch</option>
              <option value="de">German</option>
              <option value="fi">Finnish</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
              <option value="it">Italian</option>
              <option value="da">Danish</option>
              <option value="no">Norwegian</option>
            </select>
          </label>
        </section>

        <section className="overflow-hidden rounded-3xl bg-white/5 border border-white/10">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div>
              <div className="mb-3 inline-flex rounded-2xl bg-lemon-green/15 p-3">
                <Camera className="h-8 w-8 text-lemon-green" />
              </div>
              <h2 className="text-2xl font-extrabold">Photograph the next item</h2>
              <p className="mt-2 text-sm text-gray-400">Use your rear camera for the best result. Keep the full item visible in even light.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:min-w-[360px]">
              <button onClick={() => cameraRef.current?.click()} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl bg-lemon-gradient px-5 py-4 font-black text-dark-navy hover:opacity-90 transition">
                <Camera className="h-7 w-7" /> Open camera
              </button>
              <button onClick={() => galleryRef.current?.click()} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-4 font-bold text-white hover:bg-white/15 transition">
                <Images className="h-7 w-7" /> Select photos
              </button>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }} />
              <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple className="hidden" onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }} />
            </div>
          </div>
        </section>

        {quota && <p className="text-right text-xs text-gray-500">{quota}</p>}

        {drafts.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-gray-200">{drafts.length} captured</span>
            <span className="rounded-full bg-blue-500/15 px-3 py-1.5 text-blue-300">{processing} processing</span>
            <span className="rounded-full bg-amber-400/15 px-3 py-1.5 text-amber-300">{pendingReview} awaiting review</span>
            <span className="rounded-full bg-green-500/15 px-3 py-1.5 text-green-300">{confirmed.length} confirmed</span>
          </div>
        )}

        {drafts.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-white/10 bg-white/5 py-16 text-center">
            <Camera className="mx-auto h-12 w-12 text-gray-500" />
            <h2 className="mt-4 text-lg font-bold text-gray-300">No items captured yet</h2>
            <p className="mt-1 text-sm text-gray-500">Tap Open camera to start your listing queue.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {drafts.map((draft, index) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                index={drafts.length - index}
                onUpdate={(update) => updateDraft(draft.id, update)}
                onRemove={() => removeDraft(draft)}
                onCopyCsv={() => void copyCsvRow(draft)}
              />
            ))}
          </div>
        )}

        {reviewed.length > 0 && (
          <section className="rounded-3xl bg-lemon-gradient p-6 text-dark-navy md:p-8">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-extrabold">
                  <Download className="h-5 w-5" /> {confirmed.length} of {reviewed.length} listings ready to ship
                </h2>
                <p className="mt-1 text-sm font-medium text-dark-navy/70">
                  Export a CSV or JSON file and import it into Shopify, WooCommerce, eBay, Etsy — or any tool that accepts a feed.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void exportCsv()} className="bg-dark-navy text-lemon-green hover:bg-dark-navy/90 h-11 px-5 font-bold">
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Export CSV
                </Button>
                <Button onClick={() => void exportJson()} variant="outline" className="border-dark-navy/40 bg-transparent text-dark-navy hover:bg-dark-navy/10 h-11 px-5 font-bold">
                  <FileJson className="mr-2 h-4 w-4" /> Export JSON
                </Button>
                <Button onClick={() => void exportExcel()} variant="outline" className="border-dark-navy/40 bg-transparent text-dark-navy hover:bg-dark-navy/10 h-11 px-5 font-bold">
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
                </Button>
                <Button onClick={() => void exportPdf()} variant="outline" className="border-dark-navy/40 bg-transparent text-dark-navy hover:bg-dark-navy/10 h-11 px-5 font-bold">
                  <FileText className="mr-2 h-4 w-4" /> Export PDF
                </Button>
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold flex items-center gap-2"><Cable className="h-4 w-4 text-lemon-green" /> Platforms you can publish to</h2>
              <p className="text-xs text-gray-500 mt-1">Direct connectors are part of the Growth and Professional tiers. CSV export works right now.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {CONNECTORS.map((connector) => (
              <button
                key={connector.id}
                onClick={() => setActiveConnector(connector)}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-left hover:border-lemon-green/50 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-white/10 p-2"><LayoutDashboard className="h-5 w-5 text-lemon-green" /></span>
                  <span className="rounded-full bg-lemon-green/10 px-2 py-0.5 text-[10px] font-bold text-lemon-green">{connector.tier}</span>
                </div>
                <p className="mt-3 font-bold">{connector.name}</p>
                <p className="mt-1 text-xs text-gray-500">{connector.desc}</p>
                <p className="mt-3 text-xs font-bold text-lemon-green underline-offset-2 group-hover:underline">View connector</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-extrabold flex items-center gap-2"><Globe2 className="h-4 w-4 text-lemon-green" /> Selling on CircuCity Marketplace?</h2>
              <p className="mt-1 text-sm text-gray-400">Marketplace sellers get one-click publish to their store — including automatic CO₂ tracking on every item.</p>
            </div>
            <Button onClick={() => setPublishOpen(true)} variant="outline" className="border-lemon-green/40 text-lemon-green hover:bg-lemon-green/10 font-bold">
              Publish to CircuCity →
            </Button>
          </div>
        </section>
      </div>

      {activeConnector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setActiveConnector(null)}>
          <div className="w-full max-w-md rounded-3xl bg-[#0E1A36] border border-white/10 p-6 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-lemon-green/15 p-2.5"><Cable className="h-6 w-6 text-lemon-green" /></span>
                <div>
                  <h3 className="text-lg font-extrabold">{activeConnector.name} connector</h3>
                  <p className="text-xs text-lemon-green font-bold">{activeConnector.tier} tier</p>
                </div>
              </div>
              <button onClick={() => setActiveConnector(null)} className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-4 text-sm text-gray-300">{activeConnector.desc}</p>
            <div className="mt-4 rounded-xl bg-white/5 p-4 text-sm">
              <p className="font-bold text-lemon-green mb-2">Available today (this test)</p>
              <ul className="space-y-1.5 text-gray-300 text-xs">
                <li>• Camera → real AI draft for each photo</li>
                <li>• Human review gate before anything leaves the desk</li>
                <li>• CSV / JSON export (importable into {activeConnector.name})</li>
              </ul>
            </div>
            <div className="mt-4 rounded-xl bg-white/5 p-4 text-sm">
              <p className="font-bold text-lemon-green mb-2">Live publishing (in the app)</p>
              <ul className="space-y-1.5 text-gray-300 text-xs">
                <li>• OAuth connect to your {activeConnector.name} account</li>
                <li>• One-click publish of reviewed drafts</li>
              </ul>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/dashboard/listing">
                <Button className="w-full bg-lemon-gradient text-dark-navy font-bold h-11">Open the Listings app</Button>
              </Link>
              <Button onClick={() => setActiveConnector(null)} variant="outline" className="w-full h-11 font-bold">Keep testing here</Button>
            </div>
          </div>
        </div>
      )}

      {publishOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPublishOpen(false)}>
          <div className="w-full max-w-md rounded-3xl bg-[#0E1A36] border border-white/10 p-6 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-lemon-green" /> Publish to the marketplace</h3>
              <button onClick={() => setPublishOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-4 text-sm text-gray-300">
              One-click publishing lives in the live CircuCity Marketplace seller tool — linked shops can push a
              reviewed draft straight to their store with automatic CO₂ tracking.
            </p>
            <p className="mt-3 text-sm text-gray-300">
              This demo environment keeps your drafts as exportable files instead, so nothing is published without a marketplace account.
            </p>
            <a href="https://circucity.se/dashboard/seller/products/bulk-ai" target="_blank" rel="noopener noreferrer">
              <Button className="mt-5 w-full bg-lemon-gradient text-dark-navy font-bold h-11">Open the live marketplace tool</Button>
            </a>
          </div>
        </div>
      )}

      <footer className="border-t border-white/10 py-6 text-center text-xs text-gray-500 mt-8">
        Test desk — AI listing generation is real; publishing stays in the app. Sign in to connect your store and publish live:&nbsp;
        <Link href="/dashboard/listing" className="font-bold text-lemon-green underline">Open the Listings app</Link>. Gavriel Listing AI.
      </footer>
    </main>
  );
}

function DraftCard({ draft, index, onUpdate, onRemove, onCopyCsv }: {
  draft: ListingDraft;
  index: number;
  onUpdate: (update: Partial<ListingDraft>) => void;
  onRemove: () => void;
  onCopyCsv: () => void;
}) {
  const processing = draft.status === 'queued' || draft.status === 'analyzing';
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div className="grid md:grid-cols-[220px_1fr]">
        <div className="relative min-h-56 bg-gray-900">
          <img src={draft.previewUrl} alt="Captured product" className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute left-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-bold text-white">Item {index}</span>
          <button onClick={onRemove} className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-red-600 shadow hover:bg-white" aria-label="Remove item">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 md:p-6">
          {processing && (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <Loader2 className="h-8 w-8 animate-spin text-lemon-green" />
              <p className="mt-3 font-bold text-white">{draft.status === 'queued' ? 'Waiting in queue…' : 'AI is building the listing…'}</p>
              <p className="mt-1 text-xs text-gray-500">You can take the next photo now.</p>
            </div>
          )}
          {draft.status === 'error' && (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <XCircle className="h-9 w-9 text-red-500" />
              <p className="mt-3 font-bold text-red-400">Could not process this item</p>
              <p className="mt-1 max-w-md text-sm text-gray-500">{draft.error}</p>
              <button onClick={onRemove} className="mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold">
                <RefreshCw className="h-4 w-4" /> Remove and try another photo
              </button>
            </div>
          )}
          {draft.status === 'review' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-lemon-green">
                  <Sparkles className="h-4 w-4" /> AI draft — review required
                </div>
                <div className="flex items-center gap-2">
                  {draft.priceGrounded && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-1 text-[11px] font-bold text-blue-300">
                      <Globe2 className="h-3 w-3" /> Price checked online
                    </span>
                  )}
                  <button onClick={onCopyCsv} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-gray-300 hover:bg-white/20 transition" title="Copy this row to the clipboard">
                    <FileSpreadsheet className="h-3 w-3" /> Copy CSV row
                  </button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title" value={draft.title} maxLength={80} onChange={(title) => onUpdate({ title, reviewed: false })} />
                <Field label="Price (SEK)" value={draft.price} type="number" onChange={(price) => onUpdate({ price, reviewed: false })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Description</label>
                <textarea
                  value={draft.description}
                  maxLength={300}
                  rows={3}
                  onChange={(event) => onUpdate({ description: event.target.value, reviewed: false })}
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-lemon-green/60"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Category</label>
                  <select value={draft.category} onChange={(event) => onUpdate({ category: event.target.value, reviewed: false })} className="w-full rounded-xl border border-white/15 bg-[#0E1A36] px-3 py-2.5 text-sm text-white outline-none focus:border-lemon-green/60">
                    <option value="" disabled>{draft.category ? `AI suggested "${draft.category}" — pick a category` : 'Select category'}</option>
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <Field label="Weight (kg)" value={draft.weight} type="number" step="0.1" onChange={(weight) => onUpdate({ weight, reviewed: false })} />
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Condition</label>
                  <select value={draft.condition} onChange={(event) => onUpdate({ condition: event.target.value as ListingDraft['condition'], reviewed: false })} className="w-full rounded-xl border border-white/15 bg-[#0E1A36] px-3 py-2.5 text-sm text-white outline-none focus:border-lemon-green/60">
                    {Object.entries(conditionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <Field label="Est. age" value={draft.estimatedAge} onChange={(estimatedAge) => onUpdate({ estimatedAge, reviewed: false })} />
                <Field label="Stock" value={draft.quantity} type="number" min={1} step={1} onChange={(quantity) => onUpdate({ quantity, reviewed: false })} />
              </div>
              {Object.keys(draft.attributes).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(draft.attributes).map(([key, value]) => (
                    <span key={key} className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-gray-300">
                      <span className="font-bold text-lemon-green">{key}:</span> {value}
                    </span>
                  ))}
                </div>
              )}
              {Number(draft.co2Saved) > 0 && (
                <div className="rounded-xl border border-lemon-green/20 bg-lemon-green/10 p-4">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-lemon-green">
                    <Archive className="h-4 w-4" /> Resale impact
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">{draft.co2Saved} kg CO₂e kept out of production by reselling this item</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">Estimated from category and shipping weight. The marketplace computes exact footprints on publish.</p>
                </div>
              )}
              <div className="flex flex-col justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl bg-lemon-green/10 px-4 py-2 text-sm font-bold text-lemon-green">
                  <input type="checkbox" checked={draft.reviewed} onChange={(event) => onUpdate({ reviewed: event.target.checked })} className="h-5 w-5 accent-[#A3E635]" />
                  I reviewed this listing and confirm it is accurate
                </label>
                <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-emerald-300">
                  <Check className="h-4 w-4" /> Ready for export
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function Field({ label, value, onChange, type = 'text', maxLength, step, min }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  maxLength?: number;
  step?: string;
  min?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">{label}</label>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        step={step}
        min={min ?? (type === 'number' ? 0 : undefined)}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-lemon-green/60"
      />
    </div>
  );
}
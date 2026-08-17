'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Camera, Cable, Check, CheckCircle2, ExternalLink,
  FileJson, FileSpreadsheet, FileText, Globe2, Images, Loader2, RefreshCw, Send, Sparkles,
  Trash2, X, XCircle, Archive, PlugZap, Zap, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDashboardI18n } from '../I18nProvider';

type DraftStatus = 'queued' | 'analyzing' | 'review' | 'error';

const MAX_BATCH_SIZE = 20;
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
  listingId?: string;
};

type ConnectorCard = {
  id: 'shopify' | 'woocommerce' | 'ebay' | 'etsy' | 'webhook';
  name: string;
  tier: string;
};

const conditionLabels = { new: 'New', like_new: 'Like new', good: 'Good', fair: 'Fair', poor: 'Poor' } as const;

const CATEGORIES = [
  'Bag', 'Eco Home', 'Electronics', 'General', 'Green Gadgets',
  'Recycled Items', 'Skincare', 'Sustainable Fashion',
];

const CONNECTORS: ConnectorCard[] = [
  { id: 'shopify', name: 'Shopify', tier: 'Growth' },
  { id: 'woocommerce', name: 'WooCommerce', tier: 'Growth' },
  { id: 'ebay', name: 'eBay', tier: 'Professional' },
  { id: 'etsy', name: 'Etsy', tier: 'Professional' },
  { id: 'webhook', name: 'Webhook / API', tier: 'Professional' },
];

const CONNECTOR_DESC_KEYS: Record<string, string> = {
  shopify: 'conn.shopifyOauth',
  woocommerce: 'conn.wooRest',
  ebay: 'conn.ebayOauth',
  etsy: 'conn.etsyOauth',
  webhook: 'conn.webhook',
};

const CSV_HEADERS = 'title,description,price,currency,category,condition,estimated_age,weight_kg,quantity,co2_saved_kg,attributes,image_data_url';

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8  max-w-full overflow-hidden">
      {children}
    </div>
  );
}

const StatCard = ({ label, value, icon: Icon, hint }: { label: string; value: string; icon: any; hint?: string }) => (
  <Card className="p-6 border-border shadow-sm">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-primary/10 rounded-xl">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <h3 className="text-2xl font-bold text-dark-navy truncate">{value}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  </Card>
);

function csvEscape(value: string): string {
  let text = String(value ?? '');
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

const ANALYSIS_CONCURRENCY = 2;
let analysisRunning = 0;
const analysisQueue: (() => Promise<void>)[] = [];
function enqueueAnalysis(task: () => Promise<void>) {
  analysisQueue.push(task);
  void processAnalysisQueue();
}
async function processAnalysisQueue() {
  while (analysisQueue.length > 0 && analysisRunning < ANALYSIS_CONCURRENCY) {
    const task = analysisQueue.shift()!;
    analysisRunning++;
    task().finally(() => { analysisRunning--; void processAnalysisQueue(); });
  }
}

function draftToRow(d: ListingDraft, imageDataUrl?: string): string {
  return [
    d.title, d.description, d.price, 'SEK', d.category, d.condition,
    d.estimatedAge || 'Unknown', d.weight || '0.5', d.quantity || '1', d.co2Saved || '0',
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

type ConnectorState = {
  plan: string;
  quota: { used: number; limit: number | null; plan: string };
  canPublish: boolean;
  connected: string[];
  channels: { type: string; name: string; status: string; lastSyncAt?: string | null; errorMessage?: string | null }[];
  configured: { shopify: boolean; woocommerce: boolean; ebay: boolean; etsy: boolean; webhook: boolean };
  webhookUrl?: string | null;
  history: { id: string; title: string; platform: string; status: string; remoteId?: string | null; remoteUrl?: string | null; createdAt: string }[];
};

export default function ListingsAppPage() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<Record<string, File>>({});
  const [drafts, setDrafts] = useState<ListingDraft[]>([]);
  const [state, setState] = useState<ConnectorState | null>(null);
  const [loadError, setLoadError] = useState('');
  const [batchWarning, setBatchWarning] = useState('');
  const [publishTarget, setPublishTarget] = useState<{ draft: ListingDraft; id: ConnectorCard['id'] } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectError, setConnectError] = useState('');
  const [wooForm, setWooForm] = useState({ open: false, shopUrl: '', key: '', secret: '' });
  const [hookForm, setHookForm] = useState({ open: false, name: 'My endpoint', url: '', secret: '' });
  const [shopDomain, setShopDomain] = useState('');
  const { lang, t } = useDashboardI18n();

  const loadState = async () => {
    try {
      const res = await fetch('/api/listings/connectors');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setState(data.data);
      setLoadError('');
    } catch (e: any) {
      setLoadError(e?.message || 'Could not load your workspace');
    }
  };

  useEffect(() => {
    void loadState();
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
      const analysisResponse = await fetch('/api/listings/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: analysisImage, language: lang }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      let analysis: Record<string, unknown> = {};
      try { analysis = await analysisResponse.json(); } catch { /* empty */ }
      if (!analysisResponse.ok) throw new Error(typeof analysis.error === 'string' ? analysis.error : 'AI analysis failed');

      updateDraft(id, {
        status: 'review',
        listingId: typeof analysis.listingId === 'string' ? analysis.listingId : undefined,
        title: typeof analysis.title === 'string' && analysis.title ? analysis.title : 'Needs review',
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

      if (analysis.quota) {
        const q = analysis.quota as { used?: number; limit?: number | null; plan?: string };
        setState((s) => s ? { ...s, quota: { used: q.used ?? s.quota.used, limit: q.limit ?? s.quota.limit, plan: q.plan ?? s.quota.plan } } : s);
      }
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
    if (accepted.length + drafts.length > MAX_BATCH_SIZE) {
      setBatchWarning(`Maximum ${MAX_BATCH_SIZE} items per batch. Only the first ${MAX_BATCH_SIZE} were added.`);
    }
    const limited = accepted.slice(0, Math.max(0, MAX_BATCH_SIZE - drafts.length));
    const additions = limited.map((file) => {
      const id = crypto.randomUUID();
      filesRef.current[id] = file;
      return {
        id,
        previewUrl: URL.createObjectURL(file),
        status: 'queued',
        title: '', description: '', category: '', condition: 'good' as const,
        price: '', weight: '0.5', estimatedAge: '', quantity: '1', priceGrounded: false,
        co2Saved: '0', attributes: {}, reviewed: false,
      } as ListingDraft;
    });
    setDrafts((current) => [...additions, ...current]);
    additions.forEach((draft, index) => {
      const file = limited[index];
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

    const columns: { header: string; key: string; width: number }[] = [
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
    sheet.columns = columns;
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
    try { await navigator.clipboard.writeText(draftToRow(draft)); } catch { /* clipboard may be unavailable */ }
  };

  const isConnected = (id: string) => state?.connected.includes(id);
  const isConfigured = (id: keyof ConnectorState['configured']) => state?.configured[id];

  const connectOAuth = async (platform: 'shopify' | 'ebay') => {
    setConnecting(platform);
    setConnectError('');
    try {
      const body: Record<string, unknown> = { platform, returnTo: '/dashboard/listing' };
      if (platform === 'shopify' && shopDomain.trim()) body.shopDomain = shopDomain.trim();
      if (platform === 'shopify' && !shopDomain.trim()) {
        setConnectError('Enter your .myshopify.com domain to start the Shopify install.');
        setConnecting(null);
        return;
      }
      const res = await fetch('/api/integrations/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start the connection');
      if (data.data?.url) window.location.href = data.data.url;
    } catch (e: any) {
      setConnectError(e?.message || 'Could not start the connection');
    } finally {
      setConnecting(null);
    }
  };

  const connectEtsy = async () => {
    setConnecting('etsy');
    setConnectError('');
    try {
      const res = await fetch('/api/listings/connectors/etsy', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start the Etsy connection');
      if (data.data?.url) window.location.href = data.data.url;
    } catch (e: any) {
      setConnectError(e?.message || 'Could not start the Etsy connection');
    } finally {
      setConnecting(null);
    }
  };

  const saveWoo = async () => {
    setConnectError('');
    try {
      const res = await fetch('/api/listings/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'woocommerce', shopUrl: wooForm.shopUrl, consumerKey: wooForm.key, consumerSecret: wooForm.secret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not connect WooCommerce');
      setWooForm({ open: false, shopUrl: '', key: '', secret: '' });
      await loadState();
    } catch (e: any) {
      setConnectError(e?.message || 'Could not connect WooCommerce');
    }
  };

  const saveWebhook = async () => {
    setConnectError('');
    try {
      const res = await fetch('/api/listings/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'webhook', name: hookForm.name, url: hookForm.url, secret: hookForm.secret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the webhook');
      setHookForm({ open: false, name: 'My endpoint', url: '', secret: '' });
      await loadState();
    } catch (e: any) {
      setConnectError(e?.message || 'Could not save the webhook');
    }
  };

  const disconnect = async (type: string) => {
    try {
      await fetch('/api/listings/connectors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      await loadState();
    } catch { /* keep current state */ }
  };

  const publish = async () => {
    if (!publishTarget) return;
    const { draft, id } = publishTarget;
    setPublishing(true);
    setPublishMsg(null);
    try {
      const file = filesRef.current[draft.id];
      const image = file ? await prepareAnalysisImage(file) : '';
      const res = await fetch('/api/listings/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: draft.listingId,
          platform: id,
          images: image ? [image] : [],
          target: id === 'webhook' ? { webhookUrl: hookForm.url, webhookSecret: hookForm.secret } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');
      setPublishMsg({ ok: true, text: `Published to ${CONNECTORS.find((c) => c.id === id)?.name}.` });
      await loadState();
    } catch (e: any) {
      setPublishMsg({ ok: false, text: e?.message || 'Publish failed' });
    } finally {
      setPublishing(false);
    }
  };

  const upgrade = async (tier = 'growth') => {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: 'listing', tier }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      if (!res.ok) setPublishMsg({ ok: false, text: data.error || 'Could not start checkout' });
    } catch { /* surface below */ }
  };

  const quota = state?.quota;

  return (
    <Wrapper>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-dark-navy">{t("lst.listings")}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => void loadState()}>
            <RefreshCw className="w-4 h-4" />
            {t("lst.sync")}
          </Button>
          {reviewed.length > 0 && (
            <>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => void exportCsv()}>
                <FileSpreadsheet className="w-3 h-3" /> CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => void exportJson()}>
                <FileJson className="w-4 h-4" />
                {t("lst.exportJson")}
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => void exportExcel()}>
                <FileSpreadsheet className="w-4 h-4" />
                {t("lst.exportExcel")}
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => void exportPdf()}>
                <FileText className="w-4 h-4" />
                {t("lst.exportPdf")}
              </Button>
            </>
          )}
        </div>
      </div>

      {(state?.plan === 'free' || state?.plan === 'starter') && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0"><Zap className="w-4 h-4" /></span>
            <div>
              <p className="text-sm font-semibold text-dark-navy">{t("lst.freePlanTitle")}</p>
              <p className="text-xs text-muted-foreground">
                {t("lst.freePlanDesc", { limit: String(quota?.limit ?? '') })}
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm" className="shrink-0" onClick={() => void upgrade('growth')}>{t("lst.unlockGavriel")}</Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t("lst.aiListingsUsed")} value={`${quota?.used ?? 0} ${t("lst.of")} ${quota?.limit ?? '∞'}`} hint={quota ? `${quota.plan} plan` : undefined} icon={Zap} />
        <StatCard label={t("lst.capturedThisSession")} value={String(drafts.length)} icon={Camera} />
        <StatCard label={t("lst.awaitingReview")} value={String(pendingReview)} icon={Sparkles} />
        <StatCard label={t("lst.published")} value={String(state?.history.length ?? 0)} icon={Archive} />
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><Camera className="w-5 h-5" /></div>
            <div>
              <h3 className="font-bold text-dark-navy">{t("lst.captureNextItem")}</h3>
              <p className="text-xs text-muted-foreground">{t("lst.captureHint")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-2" onClick={() => cameraRef.current?.click()}>
              <Camera className="w-4 h-4" /> {t("lst.openCamera")}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => galleryRef.current?.click()}>
              <Images className="w-4 h-4" /> {t("lst.selectPhotos")}
            </Button>
          </div>
        </div>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }} />
        <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple className="hidden" onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }} />
      </Card>

      {batchWarning && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {batchWarning}
          <button className="ml-auto text-amber-700 hover:text-amber-900" onClick={() => setBatchWarning('')}>Dismiss</button>
        </div>
      )}

      {loadError && <p className="text-right text-xs text-red-500">{loadError}</p>}

      {drafts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-slate-100 text-gray-600 border-slate-200">{drafts.length} captured</Badge>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">{processing} processing</Badge>
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">{pendingReview} awaiting review</Badge>
          <Badge className="bg-green-100 text-green-700 border-green-200">{confirmed.length} confirmed</Badge>
        </div>
      )}

      {drafts.length === 0 ? (
        <Card className="border-border shadow-sm overflow-hidden">
          <div className="flex flex-col items-center py-16 text-center px-6">
            <div className="p-3 bg-primary/10 rounded-full text-primary mb-4"><Camera className="w-8 h-8" /></div>
            <h4 className="font-bold text-dark-navy mb-1">{t("lst.noItemsCaptured")}</h4>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">{t("lst.noItemsHint")}</p>
            <Button size="sm" onClick={() => cameraRef.current?.click()}>{t("lst.openCamera")}</Button>
          </div>
        </Card>
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
              onPublish={() => { setPublishTarget({ draft, id: 'shopify' }); setPublishMsg(null); }}
              onRetry={() => { const file = filesRef.current[draft.id]; if (file) { updateDraft(draft.id, { status: 'queued', error: undefined }); enqueueAnalysis(() => analyseFile(draft.id, file)); }} }
            />
          ))}
        </div>
      )}

      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary"><Cable className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-dark-navy">{t("lst.connectStores")}</h3>
            <p className="text-xs text-muted-foreground">{t("conn.liveDesc")}</p>
          </div>
        </div>
        {connectError && <p className="mb-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2.5 text-sm text-red-600">{connectError}</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CONNECTORS.map((connector) => {
            const connected = isConnected(connector.id);
            const configured = connector.id === 'woocommerce' || connector.id === 'webhook' || isConfigured(connector.id as keyof ConnectorState['configured']);
            return (
              <Card key={connector.id} className="border-border shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary"><PlugZap className="w-5 h-5" /></div>
                  {connected ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200">Connected</Badge>
                  ) : (
                    <Badge variant="secondary">{connector.tier}</Badge>
                  )}
                </div>
                <h3 className="font-bold text-dark-navy mt-3">{connector.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t(CONNECTOR_DESC_KEYS[connector.id])}</p>
                <div className="mt-4 space-y-2">
                  {!configured && connector.id !== 'woocommerce' && connector.id !== 'webhook' && (
                    <p className="text-xs text-amber-600">{t("conn.needsConfig")}</p>
                  )}
                  {!connected && configured && connector.id === 'shopify' && (
                    <>
                      <Input
                        value={shopDomain}
                        onChange={(e) => setShopDomain(e.target.value)}
                        placeholder="your-store.myshopify.com"
                        className="h-8 text-xs"
                      />
                      <Button size="sm" className="w-full gap-1.5" onClick={() => void connectOAuth('shopify')} disabled={connecting === 'shopify'}>
                        {connecting === 'shopify' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("conn.connecting")}</> : <>{t("lst.connectStore")}</>}
                      </Button>
                    </>
                  )}
                  {!connected && configured && connector.id === 'ebay' && (
                    <Button size="sm" className="w-full gap-1.5" onClick={() => void connectOAuth('ebay')} disabled={connecting === 'ebay'}>
                      {connecting === 'ebay' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("conn.connecting")}</> : <>Connect eBay</>}
                    </Button>
                  )}
                  {!connected && configured && connector.id === 'etsy' && (
                    <Button size="sm" className="w-full gap-1.5" onClick={() => void connectEtsy()} disabled={connecting === 'etsy'}>
                      {connecting === 'etsy' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("conn.connecting")}</> : <>Connect Etsy</>}
                    </Button>
                  )}
                  {!connected && connector.id === 'woocommerce' && (
                    <Button size="sm" className="w-full" onClick={() => { setWooForm({ ...wooForm, open: !wooForm.open }); setHookForm({ ...hookForm, open: false }); setConnectError(''); }}>
                      {t("lst.enterRestCredentials")}
                    </Button>
                  )}
                  {!connected && connector.id === 'webhook' && (
                    <Button size="sm" className="w-full" onClick={() => { setHookForm({ ...hookForm, open: !hookForm.open }); setWooForm({ ...wooForm, open: false }); setConnectError(''); }}>
                      {t("lst.configureEndpoint")}
                    </Button>
                  )}
                  {connected && connector.id === 'webhook' && state?.webhookUrl && (
                    <p className="truncate rounded-lg bg-muted px-2.5 py-1.5 text-[11px] text-muted-foreground" title={state.webhookUrl}>
                      → {state.webhookUrl}
                    </p>
                  )}
                  {connected && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5 bg-green-100 text-green-700 hover:bg-green-200"
                        onClick={() => { setPublishTarget({ draft: confirmed[confirmed.length - 1] || reviewed[reviewed.length - 1], id: connector.id }); setPublishMsg(null); }}
                        disabled={!confirmed.length}
                      >
                        Publish
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => void disconnect(connector.id)} className="text-muted-foreground hover:text-red-600" title={t("lst.disconnect")}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
        {wooForm.open && (
          <Card className="mt-4 border-border shadow-sm p-6">
            <h3 className="font-bold text-dark-navy">Connect WooCommerce</h3>
            <p className="mt-1 text-xs text-muted-foreground">Create an API key in your WP admin (WooCommerce → Settings → Advanced → REST API, read/write) and paste it here.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Input value={wooForm.shopUrl} onChange={(e) => setWooForm({ ...wooForm, shopUrl: e.target.value })} placeholder="https://your-store.com" />
              <Input value={wooForm.key} onChange={(e) => setWooForm({ ...wooForm, key: e.target.value })} placeholder={t("lst.consumerKey")} />
              <Input value={wooForm.secret} onChange={(e) => setWooForm({ ...wooForm, secret: e.target.value })} placeholder={t("lst.consumerSecret")} />
            </div>
            <div className="mt-3 flex gap-3">
              <Button size="sm" onClick={() => void saveWoo()}>{t("lst.verifyConnect")}</Button>
              <Button variant="outline" size="sm" onClick={() => setWooForm({ ...wooForm, open: false })}>Cancel</Button>
            </div>
          </Card>
        )}
        {hookForm.open && (
          <Card className="mt-4 border-border shadow-sm p-6">
            <h3 className="font-bold text-dark-navy">Configure webhook</h3>
            <p className="mt-1 text-xs text-muted-foreground">We POST the full listing as JSON (with an optional HMAC-SHA256 X-CircuCity-Signature header when a secret is set).</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Input value={hookForm.name} onChange={(e) => setHookForm({ ...hookForm, name: e.target.value })} placeholder={t("lst.endpointName")} />
              <Input value={hookForm.url} onChange={(e) => setHookForm({ ...hookForm, url: e.target.value })} placeholder="https://your-endpoint.com/webhook" />
              <Input value={hookForm.secret} onChange={(e) => setHookForm({ ...hookForm, secret: e.target.value })} placeholder="Signing secret (optional)" />
            </div>
            <div className="mt-3 flex gap-3">
              <Button size="sm" onClick={() => void saveWebhook()}>{t("lst.saveWebhook")}</Button>
              <Button variant="outline" size="sm" onClick={() => setHookForm({ ...hookForm, open: false })}>Cancel</Button>
            </div>
          </Card>
        )}
      </div>

      {state && state.history.length > 0 && (
        <Card className="border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-dark-navy"><Archive className="w-5 h-5 text-primary" /> {t("lst.publishedListings")}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                <tr>
                  <th className="px-6 py-3">{t("lst.title")}</th>
                  <th className="px-6 py-3">Platform</th>
                  <th className="px-6 py-3">{t("common.status")}</th>
                  <th className="px-6 py-3">{t("lst.published")}</th>
                  <th className="px-6 py-3 text-right">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {state.history.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-dark-navy max-w-[280px] truncate">{record.title}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground capitalize">{record.platform}</td>
                    <td className="px-6 py-4">
                      <Badge className={cn(
                        "text-[10px] uppercase tracking-wider",
                        record.status === 'published' ? "bg-green-100 text-green-700 border-green-200" : "bg-slate-100 text-gray-600 border-slate-200",
                      )}>
                        {record.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(record.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      {record.remoteUrl && (
                        <a href={record.remoteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {publishTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-navy/60 p-4" onClick={() => setPublishTarget(null)}>
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-border p-6 text-dark-navy" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-dark-navy"><Send className="h-5 w-5 text-primary" /> Publish listing</h3>
              <button onClick={() => setPublishTarget(null)} className="rounded-lg p-2 text-gray-400 hover:bg-slate-100 hover:text-dark-navy"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 max-h-[40vh] space-y-2 overflow-y-auto pr-1">
              {CONNECTORS.map((connector) => {
                const connected = isConnected(connector.id);
                const configured = connector.id === 'woocommerce' || connector.id === 'webhook' || isConfigured(connector.id as keyof ConnectorState['configured']);
                return (
                  <button
                    key={connector.id}
                    disabled={!connected || !configured}
                    onClick={() => setPublishTarget({ draft: publishTarget.draft, id: connector.id })}
                    className={cn(
                      "w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition",
                      publishTarget.id === connector.id
                        ? "border-primary bg-primary/5"
                        : connected && configured ? "border-border bg-white hover:border-primary/40 hover:bg-slate-50" : "border-border bg-slate-50 opacity-50",
                    )}
                  >
                    <div>
                      <p className="font-bold text-dark-navy">{connector.name}</p>
                      <p className="text-xs text-muted-foreground">{!configured ? 'Waiting for app credentials' : connected ? `${connector.tier} · connected` : 'Not connected yet'}</p>
                    </div>
                    {connected && configured && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  </button>
                );
              })}
            </div>
            {publishMsg && (
              <p className={cn("mt-4 rounded-xl px-4 py-2.5 text-sm", publishMsg.ok ? "bg-green-500/10 border border-green-500/30 text-green-700" : "bg-red-500/10 border border-red-500/30 text-red-600")}>{publishMsg.text}</p>
            )}
            <p className="mt-3 text-center text-xs text-muted-foreground">Publishing "{publishTarget.draft.title || 'Unnamed draft'}". Only confirmed drafts should be published.</p>
            <div className="mt-4 flex gap-3">
              <Button onClick={() => void publish()} disabled={publishing} className="flex-1 h-11">
                {publishing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing…</> : `Publish to ${CONNECTORS.find((c) => c.id === publishTarget.id)?.name}`}
              </Button>
              <Button variant="outline" onClick={() => setPublishTarget(null)} className="h-11">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </Wrapper>
  );
}

function DraftCard({ draft, index, onUpdate, onRemove, onCopyCsv, onPublish, onRetry }: {
  draft: ListingDraft;
  index: number;
  onUpdate: (update: Partial<ListingDraft>) => void;
  onRemove: () => void;
  onCopyCsv: () => void;
  onPublish: () => void;
  onRetry: () => void;
}) {
  const { t } = useDashboardI18n();
  const COND_KEYS: Record<string, string> = { new: 'lst.condNew', like_new: 'lst.condLikeNew', good: 'lst.condGood', fair: 'lst.condFair', poor: 'lst.condPoor' };
  const processing = draft.status === 'queued' || draft.status === 'analyzing';
  return (
    <Card className="border-border shadow-sm overflow-hidden">
      <div className="grid md:grid-cols-[220px_1fr]">
        <div className="relative min-h-56 bg-muted">
          <img src={draft.previewUrl} alt={t("lst.capturedProduct")} className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute left-3 top-3 rounded-full bg-dark-navy/80 px-2.5 py-1 text-xs font-bold text-white">{t("lst.title")} {index}</span>
          <Button variant="ghost" size="sm" onClick={onRemove} className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-red-600 shadow hover:bg-white hover:text-red-700 h-8 w-8" aria-label={t("lst.removeItem")}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-6">
          {processing && (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <h4 className="mt-3 font-bold text-dark-navy">{draft.status === 'queued' ? t("lst.waiting") : t("lst.building")}</h4>
              <p className="mt-1 text-xs text-muted-foreground">{t("lst.takeNextPhoto")}</p>
            </div>
          )}
          {draft.status === 'error' && (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <XCircle className="h-9 w-9 text-red-500" />
              <h4 className="mt-3 font-bold text-red-600">{t("lst.couldNotProcess")}</h4>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">{draft.error}</p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
                  <RefreshCw className="w-4 h-4" /> {t("lst.retry")}
                </Button>
                <Button variant="ghost" size="sm" onClick={onRemove} className="gap-2 text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" /> {t("common.delete")}
                </Button>
              </div>
            </div>
          )}
          {draft.status === 'review' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <Sparkles className="w-4 h-4" /> {t("lst.aiDraftReview")}
                </div>
                <div className="flex items-center gap-2">
                  {draft.priceGrounded && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      <Globe2 className="w-3 h-3 mr-1" /> {t("lst.priceCheckedOnline")}
                    </Badge>
                  )}
                  <Button variant="outline" size="sm" className="gap-1 px-2.5" onClick={onCopyCsv} title={t("lst.copyToClipboard")}>
                    <FileSpreadsheet className="w-3 h-3" /> {t("lst.copyCsvRow")}
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("lst.title")} value={draft.title} maxLength={80} onChange={(title) => onUpdate({ title, reviewed: false })} />
                <Field label={t("lst.priceSek")} value={draft.price} type="number" onChange={(price) => onUpdate({ price, reviewed: false })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground font-medium">{t("common.description")}</label>
                <textarea
                  value={draft.description}
                  maxLength={300}
                  rows={3}
                  onChange={(event) => onUpdate({ description: event.target.value, reviewed: false })}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm text-dark-navy shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground font-medium">{t("common.category")}</label>
                  <select value={draft.category} onChange={(event) => onUpdate({ category: event.target.value, reviewed: false })} className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm text-dark-navy shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="" disabled>{draft.category ? `AI suggested "${draft.category}" — ${t("lst.selectCategory")}` : t("lst.selectCategory")}</option>
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <Field label={t("lst.weightKg")} value={draft.weight} type="number" step="0.1" onChange={(weight) => onUpdate({ weight, reviewed: false })} />
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground font-medium">{t("lst.condition")}</label>
                  <select value={draft.condition} onChange={(event) => onUpdate({ condition: event.target.value as ListingDraft['condition'], reviewed: false })} className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm text-dark-navy shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {Object.entries(conditionLabels).map(([value, label]) => <option key={value} value={value}>{t(COND_KEYS[value])}</option>)}
                  </select>
                </div>
                <Field label={t("lst.estAge")} value={draft.estimatedAge} onChange={(estimatedAge) => onUpdate({ estimatedAge, reviewed: false })} />
                <Field label={t("lst.stock")} value={draft.quantity} type="number" min={1} step={1} onChange={(quantity) => onUpdate({ quantity, reviewed: false })} />
              </div>
              {Object.keys(draft.attributes).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(draft.attributes).map(([key, value]) => (
                    <Badge key={key} variant="secondary" className="font-normal">
                      <span className="font-bold text-dark-navy">{key}:</span> {value}
                    </Badge>
                  ))}
                </div>
              )}
              {Number(draft.co2Saved) > 0 && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-green-700">
                    <Archive className="w-4 h-4" /> {t("lst.resaleImpact")}
                  </p>
                  <p className="mt-1 text-sm font-bold text-green-800">{t("lst.co2KeptOut", { co2: draft.co2Saved })}</p>
                </div>
              )}
              <div className="flex flex-col justify-between gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg bg-muted/40 px-4 py-2 text-sm font-medium text-dark-navy">
                  <input type="checkbox" checked={draft.reviewed} onChange={(event) => onUpdate({ reviewed: event.target.checked })} className="h-5 w-5 accent-[#A3E635]" />
                  {t("lst.reviewConfirm")}
                </label>
                <div className="flex items-center gap-3">
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    <Check className="w-3 h-3 mr-1" /> {t("lst.ready")}
                  </Badge>
                  <Button size="sm" className="gap-2" onClick={onPublish} disabled={!draft.reviewed}>
                    <Send className="w-4 h-4" /> {t("lst.publish")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
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
      <label className="mb-1.5 block text-xs text-muted-foreground font-medium">{label}</label>
      <Input
        type={type}
        value={value}
        maxLength={maxLength}
        step={step}
        min={min ?? (type === 'number' ? 0 : undefined)}
        onChange={(event) => onChange(event.target.value)}
        className="w-full"
      />
    </div>
  );
}

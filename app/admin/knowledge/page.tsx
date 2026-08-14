'use client';
import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Upload, Globe, RefreshCw, FileText, Trash2, Loader2 } from 'lucide-react';

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [crawlStatus, setCrawlStatus] = useState('');
  const [crawling, setCrawling] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backend/documents/list?tenant_id=ws_circucity_001');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch { setDocuments([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  async function uploadPdf(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.querySelector('input[type="file"]') as HTMLInputElement | null;
    if (!input || !input.files || !input.files.length) return;
    const files = Array.from(input.files);
    setUploadMsg(`Uploading ${files.length} file(s)...`);
    let ok = 0;
    for (const file of files) {
      const body = new FormData();
      body.append('tenant_id', 'ws_circucity_001');
      body.append('file', file);
      try { const r = await fetch('/api/backend/documents/upload', { method: 'POST', body }); if (r.ok) ok++; } catch {}
    }
    input.value = '';
    setUploadMsg(`${ok}/${files.length} uploaded.`);
    loadDocs();
  }

  async function indexFile(filename: string) {
    setDocuments(prev => prev.map(d => d.filename === filename ? { ...d, index_status: 'indexing' } : d));
    await fetch('/api/backend/documents/index-file', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: 'ws_circucity_001', filename }),
    });
    loadDocs();
  }

  async function deleteFile(filename: string) {
    if (!confirm(`Delete ${filename}?`)) return;
    await fetch(`/api/backend/documents/delete?tenant_id=ws_circucity_001&filename=${encodeURIComponent(filename)}`, { method: 'DELETE' });
    loadDocs();
  }

  async function startCrawl() {
    setCrawling(true); setCrawlStatus('Crawling website...');
    try {
      const res = await fetch('/api/admin/crawl', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenant_id: 'ws_circucity_001' }) });
      const data = await res.json();
      setCrawlStatus(data.status === 'completed' ? `Crawled ${data.pages_crawled || 0} pages` : data.error || 'Failed');
    } catch { setCrawlStatus('Network error'); }
    finally { setCrawling(false); }
  }

  const indexed = documents.filter((d: any) => d.index_status === 'indexed').length;
  const statusColor = (s: string) => s === 'indexed' ? 'bg-emerald-400/10 text-emerald-400' : s === 'indexing' ? 'bg-blue-400/10 text-blue-400' : s === 'failed' ? 'bg-red-400/10 text-red-400' : 'bg-slate-400/10 text-slate-400';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Knowledge Base</h1>
        <p className="text-sm text-slate-400">Upload documents and crawl websites to train the AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Upload className="w-5 h-5 text-emerald-400" /> Upload Documents</h3>
          <form onSubmit={uploadPdf} className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-xs text-slate-400 mb-1">PDF Files</label>
              <input type="file" accept=".pdf" multiple className="text-sm text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-emerald-400/10 file:text-emerald-400" />
            </div>
            <button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600">Upload</button>
            <button type="button" onClick={loadDocs} className="px-3 py-2 bg-white/5 text-slate-300 rounded-lg text-sm"><RefreshCw className="w-4 h-4" /></button>
          </form>
          {uploadMsg && <p className="text-xs text-slate-400 mt-3">{uploadMsg}</p>}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-400" /> Website Crawl</h3>
          <p className="text-sm text-slate-400 mb-4">Auto-learn from your website. The AI crawls pages and builds knowledge.</p>
          <button onClick={startCrawl} disabled={crawling} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600 disabled:opacity-50">
            {crawling ? <><Loader2 className="w-4 h-4 inline animate-spin mr-1" /> Crawling...</> : <><Globe className="w-4 h-4 inline mr-1" /> Start Crawl</>}
          </button>
          {crawlStatus && <p className="text-xs text-slate-400 mt-3">{crawlStatus}</p>}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-slate-400" /> Uploaded Files ({documents.length}) · {indexed} indexed</h3>
        {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : documents.length === 0 ? (
          <p className="text-sm text-slate-500">No documents yet. Upload PDFs or start a website crawl.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc: any) => (
              <div key={doc.filename} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                <div>
                  <span className="text-sm font-medium text-white">{doc.filename}</span>
                  <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${statusColor(doc.index_status)}`}>{doc.index_status}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => indexFile(doc.filename)} disabled={doc.index_status === 'indexing'} className="px-3 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 disabled:opacity-30">
                    {doc.index_status === 'indexed' ? 'Re-index' : 'Index'}
                  </button>
                  <button onClick={() => deleteFile(doc.filename)} className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

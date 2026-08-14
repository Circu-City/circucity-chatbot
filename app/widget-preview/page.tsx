'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MarketingShell from '@/components/marketing/MarketingShell';
import { Bot, MessageSquare, X, ArrowRight, Globe, ExternalLink } from 'lucide-react';

function WidgetPreviewInner() {
  const searchParams = useSearchParams();
  const urlParam = searchParams.get('url') || '';

  const [inputUrl, setInputUrl] = useState(urlParam);
  const [previewUrl, setPreviewUrl] = useState(urlParam || '');
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    if (urlParam) {
      setPreviewUrl(urlParam);
      setInputUrl(urlParam);
    }
  }, [urlParam]);

  useEffect(() => {
    if (widgetOpen) {
      const t = setTimeout(() => setShowButtons(true), 500);
      return () => clearTimeout(t);
    } else {
      setShowButtons(false);
    }
  }, [widgetOpen]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (inputUrl) {
      setPreviewUrl(inputUrl);
      window.history.replaceState(null, '', '/widget-preview?url=' + encodeURIComponent(inputUrl));
    }
  }

  return (
    <MarketingShell>
      {/* Hero with URL input */}
      <section className="py-16 px-6 text-center bg-gradient-to-b from-[#FAFAFA] to-white">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#A3E635] mb-3 block">Widget Preview</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0A1428] leading-tight mb-3">
            See the widget{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3E635] to-[#9EF01A]">live on your site</span>
          </h1>
          <p className="text-gray-500 text-sm max-w-lg mx-auto mb-8">
            Enter your website URL below to preview exactly how the chat widget will look and behave for your visitors.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto">
            <div className="flex-1 w-full relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://yourstore.com"
                required
                className="w-full h-12 pl-11 pr-4 text-sm border border-gray-300 rounded-xl outline-none focus:border-[#A3E635] focus:ring-2 focus:ring-[#A3E635]/20 transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-[#0A1428] hover:bg-[#1a2744] text-white font-semibold rounded-xl h-12 px-8 text-sm transition-all whitespace-nowrap w-full sm:w-auto flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Load preview
            </button>
          </form>
        </div>
      </section>

      {/* Desktop browser preview */}
      <section className="relative bg-gray-100 py-8 sm:py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {previewUrl ? (
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Browser title bar */}
              <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="ml-3 flex-1 max-w-[60%] mx-auto">
                  <div className="bg-white rounded-lg px-3 py-1.5 text-xs text-gray-500 text-center border border-gray-200 truncate">
                    {previewUrl}
                  </div>
                </div>
              </div>
              {/* Browser content with widget overlay */}
              <div className="relative" style={{ height: '500px', minHeight: '60vh' }}>
                <div className="relative w-full h-full overflow-auto">
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-0 pointer-events-none"
                    title="Website preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                  <div className="absolute inset-0 z-[1] cursor-default" />
                </div>
                {/* Widget inside the browser frame */}
                <div className="absolute bottom-6 right-6 z-10">
                  {widgetOpen ? (
                    <div className="w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                      {/* Header */}
                      <div className="bg-[#A3E635] px-4 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-[#0A1428] rounded-xl flex items-center justify-center">
                            <Bot className="w-4 h-4 text-[#A3E635]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#0A1428]">CircuCity AI</p>
                            <p className="text-[10px] text-[#0A1428]/70">Usually responds instantly</p>
                          </div>
                        </div>
                        <button onClick={() => setWidgetOpen(false)} className="p-1 hover:bg-black/10 rounded-lg transition-colors">
                          <X className="w-4 h-4 text-[#0A1428]" />
                        </button>
                      </div>

                      {/* Messages */}
                      <div className="h-64 overflow-y-auto p-4 space-y-3 bg-white">
                        {!showButtons ? (
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-[#A3E635]/15 rounded-xl flex items-center justify-center shrink-0">
                              <Bot className="w-4 h-4 text-[#0A1428]" />
                            </div>
                            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                              <p className="text-sm text-[#0A1428]">
                                Hi there! Ready to see this live on your website?
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="bg-gray-100 rounded-2xl px-5 py-4 mb-5 max-w-[90%]">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-[#A3E635]/15 rounded-xl flex items-center justify-center shrink-0">
                                  <Bot className="w-4 h-4 text-[#0A1428]" />
                                </div>
                                <p className="text-sm text-[#0A1428] text-left">
                                  Hi there! Ready to see this live on your website?
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-3 w-full px-2">
                              <Link
                                href="/sign-up"
                                className="w-full bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl py-3 text-sm text-center transition-all"
                              >
                                Start for free
                              </Link>
                              <Link
                                href="/contact"
                                className="w-full border border-gray-300 hover:bg-gray-50 text-[#0A1428] font-medium rounded-xl py-3 text-sm text-center transition-all"
                              >
                                Contact sales
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Input */}
                      <div className="p-3 border-t border-gray-100">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Type a message..."
                            readOnly
                            className="w-full bg-gray-50 rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none text-gray-400"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-gray-200 rounded-lg flex items-center justify-center">
                            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="bg-white text-[#0A1428] text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg border border-gray-200 whitespace-nowrap">
                        Test Cira Chat
                      </span>
                      <button
                        onClick={() => setWidgetOpen(true)}
                        className="w-14 h-14 bg-[#A3E635] rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                      >
                        <MessageSquare className="w-7 h-7 text-[#0A1428]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 flex items-center justify-center" style={{ height: '500px', minHeight: '60vh' }}>
              <div className="text-center max-w-md px-6">
                <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-[#0A1428] mb-2">Enter a URL to preview</h3>
                <p className="text-sm text-gray-500">
                  Type your website address above and click &quot;Load preview&quot; to see the widget in action on your site.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-white text-center border-t border-gray-100">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-extrabold text-[#0A1428] mb-2">Ready to go live?</h2>
          <p className="text-sm text-gray-500 mb-6">
            Install the widget on your Shopify, WordPress, or any HTML site in under 2 minutes.
          </p>
          <Link
            href="/sign-up"
            className="bg-[#A3E635] hover:bg-[#8DC92E] text-[#0A1428] font-semibold rounded-xl h-11 px-7 text-sm shadow-lg shadow-[#A3E635]/20 transition-all inline-flex items-center"
          >
            Start free trial &mdash; no credit card
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}

export default function WidgetPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#A3E635] border-t-transparent rounded-full animate-spin" /></div>}>
      <WidgetPreviewInner />
    </Suspense>
  );
}

'use client';

import { useEffect, useState } from 'react';
import {
  Archive, BarChart3, Bot, Boxes, CreditCard, LayoutDashboard, LogOut, Package, Settings, ShoppingCart, Users, Zap,
} from 'lucide-react';

const PRODUCTS = [
  { id: 'SKU-2041', name: 'Vintage leather camera', image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=200&q=60', price: '890 SEK', stock: 1 },
  { id: 'SKU-2042', name: 'Classic runner sneakers', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=60', price: '450 SEK', stock: 1 },
  { id: 'SKU-2043', name: 'Noise-cancelling headphones', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&q=60', price: '1,290 SEK', stock: 1 },
  { id: 'SKU-2044', name: 'Leather strap watch', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=60', price: '760 SEK', stock: 1 },
];

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Package, label: 'Products' },
  { icon: Boxes, label: 'Inventory' },
  { icon: ShoppingCart, label: 'Orders' },
  { icon: Users, label: 'Customers' },
  { icon: BarChart3, label: 'Analytics' },
  { icon: Settings, label: 'Settings' },
];

export default function FakeAdminPage() {
  const [active, setActive] = useState('Products');

  // Load the embed plugin imperatively: rendering a <script> inside a client
  // component triggers a React hydration mismatch (React 19 hoists scripts).
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/listing-embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, []);

  return (
    <main className="flex min-h-screen bg-gray-100 text-gray-900">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-4">
          <span className="rounded-lg bg-[#0A1428] p-2"><Zap className="h-4 w-4 text-[#A3E635]" /></span>
          <span className="font-black tracking-tight">My Store Admin</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <button
              key={item.label}
              onClick={() => setActive(item.label)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                active === item.label ? 'bg-[#A3E635]/15 text-[#0A1428]' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-3">
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h1 className="text-lg font-extrabold">{active}</h1>
            <p className="text-xs text-gray-500">Demo store — this page shows how the CircuCity plugin installs into any store admin.</p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded-full bg-[#A3E635]/15 px-3 py-1 text-xs font-bold text-[#0A1428]">Gavriel Listing AI plugin installed</span>
          </div>
        </header>

        <div className="px-6 py-6">
          <div className="mb-6 rounded-2xl border border-[#A3E635]/30 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#0A1428]">
              <Bot className="h-4 w-4 text-[#52650c]" /> You have 4 unsold items with photos — list them with AI
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Click <span className="font-bold text-[#0A1428]">List with AI</span> (bottom-right) to open the CircuCity Listing Desk.
              Photograph each item and export the finished drafts to this store in one CSV.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {PRODUCTS.map((product) => (
                  <tr key={product.id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img src={product.image} alt={product.name} className="h-11 w-11 rounded-lg object-cover" />
                        <span className="font-bold">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{product.id}</td>
                    <td className="px-5 py-3 font-bold">{product.price}</td>
                    <td className="px-5 py-3">{product.stock}</td>
                    <td className="px-5 py-3"><span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">Not listed yet</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            Demo of the CircuCity embed plugin — install it on any store admin with one script tag.
          </p>
        </div>
      </div>
    </main>
  );
}
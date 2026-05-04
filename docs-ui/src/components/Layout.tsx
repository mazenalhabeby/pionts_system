import { useState, type ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';

const NAV = [
  {
    label: 'Getting Started',
    color: 'text-sky-500',
    items: [
      { to: '/', label: 'Overview', end: true },
      { to: '/quickstart', label: 'Quick Start' },
    ],
  },
  {
    label: 'Platform Guides',
    color: 'text-violet-500',
    items: [
      { to: '/guide/custom', label: 'Custom API / Node.js' },
      { to: '/guide/shopify', label: 'Shopify' },
      { to: '/guide/woocommerce', label: 'WooCommerce' },
      { to: '/guide/php', label: 'PHP (Laravel)' },
      { to: '/guide/python', label: 'Python (Django)' },
    ],
  },
  {
    label: 'API Reference',
    color: 'text-teal-500',
    items: [
      { to: '/api/checkout', label: 'Checkout' },
      { to: '/api/orders', label: 'Orders' },
      { to: '/api/customers', label: 'Customers' },
      { to: '/api/config', label: 'Config & Widget' },
      { to: '/api/webhooks', label: 'Webhooks' },
    ],
  },
  {
    label: 'Advanced',
    color: 'text-amber-500',
    items: [
      { to: '/widget', label: 'Widget Setup' },
      { to: '/security', label: 'Security' },
      { to: '/errors', label: 'Error Handling' },
      { to: '/sdk', label: 'SDK Reference' },
    ],
  },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-lg border-b border-slate-200/60 z-50 flex items-center px-4 lg:px-6 shadow-sm shadow-slate-200/50">
        <button onClick={() => setOpen(!open)} className="lg:hidden mr-3 p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </button>
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-200">P</div>
          <span className="font-extrabold text-[17px] tracking-tight text-slate-900">Pionts</span>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full tracking-wide">DOCS</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <a href="https://www.npmjs.com/package/@pionts/sdk" target="_blank" rel="noopener" className="text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.331h-2.669zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z"/></svg>
            npm
          </a>
          <a href="https://github.com/mazenalhabeby/pionts_system" target="_blank" rel="noopener" className="text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </a>
          <a href="/admin/" className="text-[12px] font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 px-4 py-2 rounded-lg transition-all shadow-md shadow-indigo-200/50 hover:shadow-lg hover:shadow-indigo-200/70">Dashboard</a>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className={`fixed top-16 bottom-0 w-[268px] bg-white border-r border-slate-200/60 overflow-y-auto z-40 transition-transform lg:translate-x-0 shadow-xl shadow-slate-200/20 lg:shadow-none ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <nav className="p-5 pb-24">
            {NAV.map((section) => (
              <div key={section.label} className="mb-7">
                <div className={`text-[11px] font-extrabold uppercase tracking-[0.12em] ${section.color} px-3 mb-2.5 flex items-center gap-1.5`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {section.label}
                </div>
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `block px-3 py-[7px] rounded-lg text-[13px] transition-all no-underline mb-px ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {open && <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden" onClick={() => setOpen(false)} />}

        {/* Content */}
        <main className="flex-1 lg:ml-[268px] min-h-[calc(100vh-4rem)]">
          <div className="max-w-[740px] mx-auto px-5 py-12 lg:px-10">
            {children}
          </div>
          <footer className="border-t border-slate-200/60 py-8 px-5 lg:px-10">
            <div className="max-w-[740px] mx-auto flex flex-wrap gap-4 justify-between items-center text-[12px] text-slate-400">
              <span>Pionts — Loyalty & Rewards Platform</span>
              <div className="flex gap-4">
                <a href="https://www.npmjs.com/package/@pionts/sdk" className="hover:text-slate-600 transition-colors">@pionts/sdk</a>
                <a href="https://github.com/mazenalhabeby/pionts_system" className="hover:text-slate-600 transition-colors">GitHub</a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

import { useState, type ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';

const NAV = [
  {
    label: 'Getting Started',
    items: [
      { to: '/', label: 'Overview', end: true },
      { to: '/quickstart', label: 'Quick Start' },
    ],
  },
  {
    label: 'Platform Guides',
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
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-xl border-b border-gray-200 z-50 flex items-center px-4 lg:px-6">
        <button onClick={() => setOpen(!open)} className="lg:hidden mr-3 p-1.5 rounded-md hover:bg-gray-100">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </button>
        <Link to="/" className="flex items-center gap-2 font-extrabold text-lg tracking-tight text-gray-900 no-underline">
          <span className="text-xl">⭐</span>
          Pionts
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md ml-0.5">DOCS</span>
        </Link>
        <div className="ml-auto flex items-center gap-5">
          <a href="https://www.npmjs.com/package/@pionts/sdk" target="_blank" rel="noopener" className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">npm</a>
          <a href="https://github.com/mazenalhabeby/pionts_system" target="_blank" rel="noopener" className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">GitHub</a>
          <a href="/admin/" className="text-[12px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors">Dashboard</a>
        </div>
      </header>

      <div className="flex pt-14">
        {/* Sidebar */}
        <aside className={`fixed top-14 bottom-0 w-64 bg-white border-r border-gray-100 overflow-y-auto z-40 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <nav className="p-4 pb-20">
            {NAV.map((section) => (
              <div key={section.label} className="mb-6">
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 px-3 mb-2">{section.label}</div>
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `block px-3 py-[6px] rounded-lg text-[13px] font-medium transition-all no-underline mb-0.5 ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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

        {/* Overlay */}
        {open && <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setOpen(false)} />}

        {/* Content */}
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-3.5rem)]">
          <div className="max-w-[720px] mx-auto px-5 py-10 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

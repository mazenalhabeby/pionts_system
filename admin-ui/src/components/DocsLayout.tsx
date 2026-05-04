import { memo, type ReactNode } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';

const NAV_SECTIONS = [
  {
    label: 'Getting Started',
    items: [
      { path: '/docs', label: 'Overview', exact: true },
      { path: '/docs/quickstart', label: 'Quick Start' },
    ],
  },
  {
    label: 'Platform Guides',
    items: [
      { path: '/docs/guide/custom', label: 'Custom API / Node.js' },
      { path: '/docs/guide/shopify', label: 'Shopify' },
      { path: '/docs/guide/woocommerce', label: 'WooCommerce' },
      { path: '/docs/guide/php', label: 'PHP (Laravel)' },
      { path: '/docs/guide/python', label: 'Python (Django)' },
    ],
  },
  {
    label: 'API Reference',
    items: [
      { path: '/docs/api/checkout', label: 'Checkout' },
      { path: '/docs/api/orders', label: 'Orders' },
      { path: '/docs/api/customers', label: 'Customers' },
      { path: '/docs/api/config', label: 'Config & Widget' },
      { path: '/docs/api/webhooks', label: 'Webhooks' },
    ],
  },
  {
    label: 'Advanced',
    items: [
      { path: '/docs/widget', label: 'Widget Setup' },
      { path: '/docs/security', label: 'Security' },
      { path: '/docs/errors', label: 'Error Handling' },
      { path: '/docs/sdk', label: 'SDK Reference' },
    ],
  },
];

function DocsLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-bg-default">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-bg-default/80 backdrop-blur-xl border-b border-border-default z-50 flex items-center px-6">
        <Link to="/docs" className="flex items-center gap-2.5 text-text-primary font-extrabold text-lg tracking-tight no-underline">
          <span className="text-xl">⭐</span>
          <span>Pionts</span>
          <span className="text-[11px] font-semibold text-text-muted bg-bg-surface-hover px-1.5 py-0.5 rounded ml-1">DOCS</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <a href="https://www.npmjs.com/package/@pionts/sdk" target="_blank" rel="noopener" className="text-xs font-medium text-text-muted hover:text-text-primary transition-colors no-underline">npm</a>
          <a href="https://github.com/mazenalhabeby/pionts_system" target="_blank" rel="noopener" className="text-xs font-medium text-text-muted hover:text-text-primary transition-colors no-underline">GitHub</a>
          <Link to="/" className="text-xs font-semibold text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-md transition-colors no-underline">Dashboard</Link>
        </div>
      </header>

      <div className="flex pt-14">
        {/* Sidebar */}
        <nav className="fixed top-14 left-0 bottom-0 w-64 border-r border-border-default overflow-y-auto p-4 bg-bg-default hidden lg:block">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-faint px-3 mb-1.5">{section.label}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  className={({ isActive }) =>
                    `block px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors no-underline ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-3.5rem)]">
          <div className="max-w-3xl mx-auto px-6 py-10 lg:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default memo(DocsLayout);

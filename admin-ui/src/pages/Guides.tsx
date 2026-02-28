import { useNavigate } from 'react-router-dom';

const GUIDES = [
  {
    title: 'Shopify',
    description: 'Add loyalty rewards to your Shopify store using theme.liquid and webhooks.',
    path: '/guides/shopify',
    color: '#95bf47',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    title: 'WordPress / WooCommerce',
    description: 'Integrate with WordPress using footer.php and WooCommerce webhooks.',
    path: '/guides/wordpress',
    color: '#21759b',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    title: 'Custom Website',
    description: 'Add Pionts to any website with a server backend using the SDK and webhooks.',
    path: '/guides/custom',
    color: '#ff3c00',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: 'API Reference',
    description: 'Complete endpoint reference for SDK, server-to-server, and webhook APIs.',
    path: '/guides/api',
    color: '#6366f1',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
];

export default function Guides() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <div className="page-hero guides-hero bg-bg-card border border-border-default rounded-2xl px-8 pt-8 pb-7 max-md:px-5 max-md:pt-6 max-md:pb-5">
        <div className="text-[11px] uppercase tracking-[2px] font-bold" style={{ color: '#6366f1' }}>Documentation</div>
        <div className="text-[26px] font-extrabold text-text-primary leading-tight mt-1 max-md:text-[20px]">Integration Guides</div>
        <div className="text-[13px] text-text-muted mt-1">Step-by-step guides to connect your website</div>
      </div>

      {/* Guide cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GUIDES.map((guide) => (
          <button
            key={guide.path}
            onClick={() => navigate(guide.path)}
            className="bg-bg-card border border-border-default rounded-xl p-0 text-left cursor-pointer w-full font-sans transition-all duration-200 hover:border-text-faint hover:shadow-[0_4px_24px_rgba(0,0,0,0.12)] hover:-translate-y-px group"
          >
            <div className="flex items-start gap-4 p-5">
              {/* Icon block */}
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 text-white"
                style={{ background: guide.color }}
              >
                {guide.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-text-primary mb-1">{guide.title}</div>
                <div className="text-[13px] text-text-muted leading-relaxed">{guide.description}</div>
              </div>

              {/* Arrow */}
              <div className="shrink-0 mt-1 text-text-faint group-hover:text-text-secondary transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';

const GUIDES = [
  {
    title: 'Shopify',
    description: 'One-click install with automatic setup. OAuth app creates your org, project, keys, and webhooks. Customer Account extension adds a Rewards page.',
    path: '/guides/shopify',
    color: '#95bf47',
    tag: 'Recommended',
    platform: 'shopify',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    title: 'WordPress / WooCommerce',
    description: 'Add the SDK to your theme footer, set up WooCommerce webhooks for order tracking, and optionally validate discount codes at checkout.',
    path: '/guides/wordpress',
    color: '#21759b',
    platform: 'wordpress',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    title: 'Custom Website',
    description: 'Integrate with any website using the JavaScript SDK and server-to-server API. Generate HMAC on your backend, embed the widget, and send order events.',
    path: '/guides/custom',
    color: '#ff3c00',
    platform: 'custom',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: 'API Reference',
    description: 'Complete endpoint reference for the SDK, server-to-server, and dashboard APIs — with request/response examples and auth details.',
    path: '/guides/api',
    color: '#6366f1',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  const { currentProject } = useProject();

  // Detect current platform to highlight the relevant guide
  const activePlatform = currentProject?.platform || '';

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <div className="page-hero guides-hero bg-bg-card border border-border-default rounded-2xl px-8 pt-8 pb-7 max-md:px-5 max-md:pt-6 max-md:pb-5">
        <div className="text-[11px] uppercase tracking-[2px] font-bold" style={{ color: '#6366f1' }}>Documentation</div>
        <div className="text-[26px] font-extrabold text-text-primary leading-tight mt-1 max-md:text-[20px]">Integration Guides</div>
        <div className="text-[13px] text-text-muted mt-1 max-w-lg">Step-by-step guides to connect Pionts to your website. Each guide includes auto-populated API keys from your current project.</div>
      </div>

      {/* Quick start hint */}
      {activePlatform && (
        <div className="flex items-center gap-3 bg-success-dim border border-success/20 rounded-xl px-5 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success shrink-0">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span className="text-sm text-text-secondary">
            Your project <strong>{currentProject?.name}</strong> is configured for <strong>{activePlatform}</strong>.
            {' '}
            <button
              onClick={() => navigate(`/guides/${activePlatform === 'shopify' ? 'shopify' : activePlatform === 'wordpress' ? 'wordpress' : 'custom'}`)}
              className="text-primary hover:underline bg-transparent border-0 p-0 font-sans text-sm cursor-pointer font-medium"
            >
              View your guide &rarr;
            </button>
          </span>
        </div>
      )}

      {/* Guide cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GUIDES.map((guide) => {
          const isActive = 'platform' in guide && guide.platform === activePlatform;
          return (
            <button
              key={guide.path}
              onClick={() => navigate(guide.path)}
              className={`bg-bg-card border rounded-xl p-0 text-left cursor-pointer w-full font-sans transition-all duration-200 hover:shadow-[0_4px_24px_rgba(0,0,0,0.12)] hover:-translate-y-px group ${
                isActive ? 'border-success/40' : 'border-border-default hover:border-text-faint'
              }`}
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
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[15px] font-semibold text-text-primary">{guide.title}</span>
                    {'tag' in guide && guide.tag && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-success/10 text-success">{guide.tag}</span>
                    )}
                    {isActive && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">Your platform</span>
                    )}
                  </div>
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
          );
        })}
      </div>

      {/* Architecture overview */}
      <div className="bg-bg-card border border-border-default rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-3">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-bg-surface rounded-lg p-4">
            <div className="text-2xl mb-2">1</div>
            <div className="text-sm font-medium text-text-primary mb-1">Embed the Widget</div>
            <div className="text-xs text-text-muted">Add the JavaScript SDK to your site. It loads the loyalty panel for logged-in customers.</div>
          </div>
          <div className="bg-bg-surface rounded-lg p-4">
            <div className="text-2xl mb-2">2</div>
            <div className="text-sm font-medium text-text-primary mb-1">Send Order Events</div>
            <div className="text-xs text-text-muted">Your platform sends order/refund webhooks to Pionts. Points and referral rewards are calculated automatically.</div>
          </div>
          <div className="bg-bg-surface rounded-lg p-4">
            <div className="text-2xl mb-2">3</div>
            <div className="text-sm font-medium text-text-primary mb-1">Customers Earn &amp; Redeem</div>
            <div className="text-xs text-text-muted">Customers earn points on purchases, referrals, and social actions. They redeem points for discount codes.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

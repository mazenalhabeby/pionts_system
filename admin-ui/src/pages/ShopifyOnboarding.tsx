import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { projectApi } from '../api';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  status: 'done' | 'auto' | 'action';
  actionLabel?: string;
  actionUrl?: string;
}

export default function ShopifyOnboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentProject } = useProject();
  const [shopDomain, setShopDomain] = useState('');
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const shop = searchParams.get('shop') || '';
    setShopDomain(shop);

    if (currentProject) {
      projectApi.getIntegrationConfig(currentProject.id)
        .then((cfg) => { setConfig(cfg); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [currentProject, searchParams]);

  const cleanShop = shopDomain.replace('.myshopify.com', '');
  const shopAdminUrl = shopDomain ? `https://admin.shopify.com/store/${cleanShop}` : '#';

  const steps: SetupStep[] = [
    {
      id: 'install',
      title: 'App installed',
      description: 'Pionts Rewards has been installed on your Shopify store.',
      status: 'done',
    },
    {
      id: 'keys',
      title: 'API keys generated',
      description: config?.publicKey
        ? `Public key: ${config.publicKey.substring(0, 20)}...`
        : 'Your project API keys and HMAC secret are ready.',
      status: 'done',
    },
    {
      id: 'webhooks',
      title: 'Webhooks configured',
      description: 'Order and refund webhooks are registered — points are awarded automatically on every purchase.',
      status: 'done',
    },
    {
      id: 'widget',
      title: 'Floating widget activated',
      description: 'The loyalty widget is enabled on your storefront. Customers will see it on every page.',
      status: 'auto',
    },
    {
      id: 'settings',
      title: 'Referral link configured',
      description: config?.domain
        ? `Referral links point to https://${config.domain}`
        : 'Your store domain is set as the referral base URL.',
      status: 'auto',
    },
    {
      id: 'rewards-page',
      title: 'Enable Rewards page in Customer Account',
      description: 'Add the Rewards tab so customers see their points when they log into their account.',
      status: 'action',
      actionLabel: 'Open Customer Account Editor',
      actionUrl: shopDomain
        ? `${shopAdminUrl}/settings/customer_accounts`
        : '#',
    },
  ];

  const doneCount = steps.filter(s => s.status === 'done' || s.status === 'auto').length;
  const totalCount = steps.length;
  const progress = Math.round((doneCount / totalCount) * 100);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center text-text-muted">
        Setting up your store...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/10 mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          You're all set!
        </h1>
        <p className="text-text-muted">
          Pionts Rewards is installed on <span className="font-medium text-text-secondary">{shopDomain || 'your store'}</span>.
          {doneCount < totalCount
            ? ` ${doneCount} of ${totalCount} steps completed automatically.`
            : ' Everything is configured and ready to go.'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-bg-card border border-border-default rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-secondary">Setup progress</span>
          <span className="text-sm font-bold text-text-primary">{progress}%</span>
        </div>
        <div className="h-2 bg-bg-surface-raised rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: progress === 100 ? 'var(--color-success)' : 'var(--color-primary)' }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-8">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className="bg-bg-card border border-border-default rounded-xl p-4 flex items-start gap-4"
          >
            {/* Status icon */}
            <div className="shrink-0 mt-0.5">
              {step.status === 'done' ? (
                <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : step.status === 'auto' ? (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-warning/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-warning">{i + 1}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-sm font-semibold text-text-primary">{step.title}</h3>
                {step.status === 'auto' && (
                  <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    Auto
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted leading-relaxed">{step.description}</p>
              {step.status === 'action' && step.actionUrl && (
                <a
                  href={step.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {step.actionLabel}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 justify-center">
        <button
          onClick={() => navigate('/overview')}
          className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="px-6 py-2.5 bg-bg-card border border-border-default text-text-secondary text-sm font-medium rounded-lg hover:bg-bg-surface-raised transition-colors cursor-pointer"
        >
          Customize Settings
        </button>
      </div>

      {/* Help note */}
      <p className="text-center text-xs text-text-muted mt-6">
        Need help? Visit the{' '}
        <button onClick={() => navigate('/guides/shopify')} className="text-primary hover:underline cursor-pointer bg-transparent border-0 p-0 font-sans text-xs">
          Shopify integration guide
        </button>{' '}
        for detailed instructions.
      </p>
    </div>
  );
}

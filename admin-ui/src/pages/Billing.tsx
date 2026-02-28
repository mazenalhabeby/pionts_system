import { useState, useEffect } from 'react';
import { billingApi } from '../api';
import PlanCard from './billing/PlanCard';
import UsageBar from './billing/UsageBar';

interface BillingData {
  plan: string;
  label: string;
  priceMonthly: number;
  limits: { maxProjects: number | null; maxCustomersPerProject: number | null };
  usage: { projectCount: number; maxCustomersInProject: number };
  stripeConfigured: boolean;
  currentPeriodEnd: string | null;
  status: string;
}

export default function Billing() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    billingApi.getSubscription()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async () => {
    const res = await billingApi.checkout(
      window.location.href,
      window.location.href,
    );
    if (res.url) window.location.href = res.url;
  };

  const handleManage = async () => {
    const res = await billingApi.portal(window.location.href);
    if (res.url) window.location.href = res.url;
  };

  if (loading) return <div className="text-center text-text-muted py-10">Loading billing...</div>;
  if (!data) return <div className="text-center text-text-muted py-10">Failed to load billing</div>;

  const periodEnd = data.currentPeriodEnd
    ? new Date(data.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <div className="page-hero billing-hero bg-bg-card border border-border-default rounded-2xl">
        <div className="px-8 pt-8 pb-4 max-md:px-5 max-md:pt-6">
          <div className="text-[11px] uppercase tracking-[2px] font-bold text-primary">Subscription</div>
          <div className="text-[26px] font-extrabold text-text-primary leading-tight mt-1 max-md:text-[20px]">Billing</div>
          <div className="text-[13px] text-text-muted mt-1">Manage your plan and usage</div>
        </div>

        <div className="grid grid-cols-3 border-t border-border-default max-md:grid-cols-1">
          <div className="px-8 py-5 max-md:px-5 max-md:py-4">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-faint mb-1">Current Plan</div>
            <div className="text-[22px] font-bold leading-none text-text-primary capitalize">{data.label || data.plan}</div>
          </div>
          <div className="px-8 py-5 max-md:px-5 max-md:py-4 border-l border-border-default max-md:border-l-0 max-md:border-t max-md:border-border-default">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-faint mb-1">Next Billing</div>
            <div className="text-[22px] font-bold leading-none text-text-primary">{periodEnd || '\u2014'}</div>
          </div>
          <div className="px-8 py-5 max-md:px-5 max-md:py-4 border-l border-border-default max-md:border-l-0 max-md:border-t max-md:border-border-default">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-faint mb-1">Status</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${data.status === 'active' || data.status === 'trialing' ? 'bg-success' : 'bg-error'}`} />
              <span className="text-[16px] font-bold text-text-primary capitalize">{data.status || 'active'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <PlanCard
          name="Free"
          price={0}
          features={['1 project', '100 customers per project', 'All core features']}
          current={data.plan === 'free'}
          onSelect={data.plan === 'free' && data.stripeConfigured ? handleUpgrade : undefined}
        />
        <PlanCard
          name="Pro"
          price={29}
          features={['Unlimited projects', 'Unlimited customers', 'Priority support', 'Advanced analytics']}
          current={data.plan === 'pro'}
          popular
        />
      </div>

      {/* Usage */}
      <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border-default">
          <div className="text-[14px] font-semibold text-text-primary">Usage</div>
        </div>
        <div className="p-5">
          <UsageBar
            label="Projects"
            used={data.usage.projectCount}
            limit={data.limits.maxProjects}
          />
          <UsageBar
            label="Customers (largest project)"
            used={data.usage.maxCustomersInProject}
            limit={data.limits.maxCustomersPerProject}
          />
        </div>
      </div>

      {/* Manage subscription */}
      {data.plan === 'pro' && data.stripeConfigured && (
        <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border-default">
            <div className="text-[14px] font-semibold text-text-primary">Manage Subscription</div>
          </div>
          <div className="p-5">
            <p className="text-[13px] text-text-muted mb-4">
              Update payment method, view invoices, or cancel your subscription.
            </p>
            <button
              onClick={handleManage}
              className="px-5 py-2.5 text-sm font-semibold border border-border-default rounded-lg text-text-secondary bg-bg-surface cursor-pointer font-sans hover:bg-bg-surface-hover hover:border-text-faint transition-colors"
            >
              Manage in Stripe
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

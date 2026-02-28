import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useWidgetConfig } from './context/WidgetConfigContext';
import useCustomer from './hooks/useCustomer';
import FloatingWrapper from './components/FloatingWrapper';
import LoginPage from './components/LoginPage';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Referrals = lazy(() => import('./pages/Referrals'));
const Redeem = lazy(() => import('./pages/Redeem'));
const Earn = lazy(() => import('./pages/Earn'));
const Partner = lazy(() => import('./pages/Partner'));
const LeaderboardPage = lazy(() => import('./components/Leaderboard'));

interface TabDef {
  key: string;
  label: string;
  icon: string;
}

function TabNav({ active, onChange, tabs }: { active: string; onChange: (key: string) => void; tabs: TabDef[] }) {
  return (
    <nav className="bg-white border-b border-black/[0.06] px-6 flex items-center h-[60px] sticky top-0 z-[100] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-0.5 ml-4 h-full">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 relative whitespace-nowrap no-underline border-none cursor-pointer font-sans ${
              active === tab.key
                ? 'text-primary bg-[#fff5f2] font-semibold'
                : 'text-[#888] bg-transparent hover:text-[#555] hover:bg-bg'
            }`}
            onClick={() => onChange(tab.key)}
            type="button"
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

const PAGE_MAP: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  dashboard: Dashboard,
  referrals: Referrals,
  redeem: Redeem,
  earn: Earn,
  partner: Partner,
  leaderboard: LeaderboardPage,
};

function WidgetContent() {
  const { authenticated, loading, settings } = useWidgetConfig();
  const { data: customerData } = useCustomer();
  const [activeTab, setActiveTab] = useState('dashboard');

  const modules = customerData?.enabled_modules;
  const leaderboardEnabled = (settings as Record<string, unknown> | null)?.leaderboard_enabled === 'true';

  const tabs = useMemo(() => {
    const t: TabDef[] = [{ key: 'dashboard', label: 'Home', icon: 'home' }];
    // Show referrals tab unless explicitly disabled (backward compat: undefined = show)
    if (modules?.referrals !== false) {
      t.push({ key: 'referrals', label: 'Referrals', icon: 'users' });
    }
    // Show redeem + earn tabs unless points module explicitly disabled
    if (modules?.points !== false) {
      t.push({ key: 'redeem', label: 'Redeem', icon: 'gift' });
      t.push({ key: 'earn', label: 'Earn', icon: 'star' });
    }
    // Partner tab: only when partners module enabled AND customer is a partner
    if (modules?.partners && customerData?.is_partner) {
      t.push({ key: 'partner', label: 'Partner', icon: 'dollar' });
    }
    if (leaderboardEnabled) {
      t.push({ key: 'leaderboard', label: 'Leaders', icon: 'chart' });
    }
    return t;
  }, [modules, customerData?.is_partner, leaderboardEnabled]);

  // Reset activeTab if the current tab is no longer visible
  useEffect(() => {
    if (!tabs.find((t) => t.key === activeTab)) {
      setActiveTab('dashboard');
    }
  }, [tabs, activeTab]);

  if (loading) return <div className="text-center p-10 text-[#888]">Loading...</div>;

  if (authenticated === false) {
    return <LoginPage />;
  }

  const PageComponent = PAGE_MAP[activeTab];

  return (
    <>
      <TabNav active={activeTab} onChange={setActiveTab} tabs={tabs} />
      <div className="max-w-[800px] mx-auto p-6 max-[600px]:p-4">
        <Suspense fallback={<div className="text-center p-10 text-[#888]">Loading...</div>}>
          {PageComponent && <PageComponent />}
        </Suspense>
      </div>
    </>
  );
}

export default function WidgetApp() {
  const { config, settings } = useWidgetConfig();
  const mode = config?.mode || 'floating';
  const brandName = settings?.widget_brand_name || 'Rewards';

  if (mode === 'floating') {
    return (
      <FloatingWrapper brandName={brandName}>
        <WidgetContent />
      </FloatingWrapper>
    );
  }

  return <WidgetContent />;
}

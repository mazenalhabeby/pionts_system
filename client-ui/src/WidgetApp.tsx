import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useWidgetConfig } from './context/WidgetConfigContext';
import useCustomer from './hooks/useCustomer';
import LoginPage from './components/LoginPage';
import CompleteProfilePage from './components/CompleteProfilePage';
import { HomeIcon, UsersIcon, GiftIcon, StarIcon, ChartIcon } from '@pionts/shared';
import { useI18n } from './i18n';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Referrals = lazy(() => import('./pages/referrals'));
const Redeem = lazy(() => import('./pages/Redeem'));
const Earn = lazy(() => import('./pages/Earn'));
const Partner = lazy(() => import('./pages/Partner'));
const LeaderboardPage = lazy(() => import('./components/Leaderboard'));

interface TabDef {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const TAB_ICONS: Record<string, React.ReactNode> = {
  home: <HomeIcon size={18} />,
  users: <UsersIcon size={18} />,
  gift: <GiftIcon size={18} />,
  star: <StarIcon size={18} />,
  chart: <ChartIcon size={18} />,
  dollar: <StarIcon size={18} />,
};

function TabNav({ active, onChange, tabs }: { active: string; onChange: (key: string) => void; tabs: TabDef[] }) {
  return (
    <nav className="pw-tabs pionts-tab-scroll">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            className={`pw-tab ${isActive ? 'pw-tab--active' : ''}`}
            onClick={() => onChange(tab.key)}
            type="button"
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
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

export default function WidgetApp() {
  const { authenticated, loading, settings } = useWidgetConfig();
  const { data: customerData } = useCustomer();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('');

  const modules = customerData?.enabled_modules;
  const leaderboardEnabled = (settings as Record<string, unknown> | null)?.leaderboard_enabled === 'true';

  const isPartner = !!(modules?.partners && customerData?.is_partner);

  const tabs = useMemo(() => {
    if (isPartner) {
      const td: TabDef[] = [
        { key: 'dashboard', label: t('tabs.home'), icon: TAB_ICONS.home },
        { key: 'partner', label: t('tabs.partner'), icon: TAB_ICONS.dollar },
      ];
      if (leaderboardEnabled) {
        td.push({ key: 'leaderboard', label: t('tabs.leaders'), icon: TAB_ICONS.chart });
      }
      return td;
    }

    const td: TabDef[] = [{ key: 'dashboard', label: t('tabs.home'), icon: TAB_ICONS.home }];
    if (modules?.referrals !== false) {
      td.push({ key: 'referrals', label: t('tabs.referrals'), icon: TAB_ICONS.users });
    }
    if (modules?.points !== false) {
      td.push({ key: 'redeem', label: t('tabs.redeem'), icon: TAB_ICONS.gift });
      td.push({ key: 'earn', label: t('tabs.earn'), icon: TAB_ICONS.star });
    }
    return td;
  }, [isPartner, modules, leaderboardEnabled, t]);

  useEffect(() => {
    if (!tabs.find((t) => t.key === activeTab)) {
      setActiveTab(tabs[0]?.key || 'dashboard');
    }
  }, [tabs, activeTab]);

  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent<{ tab: string }>).detail?.tab;
      if (tab && tabs.find((t) => t.key === tab)) {
        setActiveTab(tab);
      }
    };
    window.addEventListener('pionts:navigate', handler);
    return () => window.removeEventListener('pionts:navigate', handler);
  }, [tabs]);

  if (loading) {
    return (
      <div className="pw-page">
        <div className="pw-loading">{t('common.loading')}</div>
      </div>
    );
  }

  if (authenticated === false) {
    return <LoginPage />;
  }

  if (customerData && (!customerData.name || !customerData.birthday)) {
    return <CompleteProfilePage />;
  }

  const PageComponent = PAGE_MAP[activeTab];

  return (
    <div className="pw-page">
      <TabNav active={activeTab} onChange={setActiveTab} tabs={tabs} />
      <main className="pw-main">
        <Suspense fallback={<div className="pw-loading">{t('common.loading')}</div>}>
          {PageComponent && <PageComponent />}
        </Suspense>
      </main>
    </div>
  );
}

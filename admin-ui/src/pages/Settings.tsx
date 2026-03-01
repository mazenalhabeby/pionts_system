import { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { NoProject } from '../components/ui/empty-state';
import { TABS } from './settings/shared';
import ModulesTab from './settings/ModulesTab';
import PointsTab from './settings/PointsTab';
import ReferralsTab from './settings/ReferralsTab';
import PartnersTab from './settings/PartnersTab';
import GamificationTab from './settings/GamificationTab';
import EmailTab from './settings/EmailTab';
import ProjectTeam from './settings/ProjectTeam';

export default function Settings() {
  const { currentProject, canEdit, canAdmin } = useProject();
  const pid = currentProject?.id;
  const [activeTab, setActiveTab] = useState('modules');

  // Filter visible tabs based on enabled modules
  const visibleTabs = TABS.filter(
    (t) =>
      (!t.requiresModule || currentProject?.[`${t.requiresModule}Enabled` as keyof typeof currentProject]) &&
      (!t.adminOnly || canAdmin),
  );

  // If the active tab is no longer visible (module was disabled), reset to 'modules'
  useEffect(() => {
    if (!visibleTabs.find((t) => t.key === activeTab)) {
      setActiveTab('modules');
    }
  }, [visibleTabs, activeTab]);

  if (!pid) return <NoProject />;

  const enabledModules = [
    currentProject?.pointsEnabled && 'Points',
    currentProject?.referralsEnabled && 'Referrals',
    currentProject?.partnersEnabled && 'Partners',
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <div className="page-hero settings-hero bg-bg-card border border-border-default rounded-2xl px-8 pt-8 pb-6 max-md:px-5 max-md:pt-6 max-md:pb-5">
        <div className="text-[11px] uppercase tracking-[2px] font-bold" style={{ color: '#6366f1' }}>Configuration</div>
        <div className="text-[26px] font-extrabold text-text-primary leading-tight mt-1 max-md:text-[20px]">Settings</div>
        <div className="text-[13px] text-text-muted mt-1">Configure modules, points, referrals, widget, and more</div>
        {enabledModules.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            {enabledModules.map((mod) => (
              <span key={mod as string} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-success-dim text-success">
                {mod}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Pill Tab Bar */}
      <div className="flex gap-1 overflow-x-auto bg-bg-card border border-border-default rounded-xl p-1.5">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-sans font-medium rounded-lg transition-colors duration-150 cursor-pointer border-none whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-[#ededed] text-[#0a0a0a]'
                : 'text-text-muted bg-transparent hover:text-text-secondary hover:bg-bg-surface-hover/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'modules' && <ModulesTab pid={pid} canEdit={canAdmin} />}
        {activeTab === 'points' && <PointsTab pid={pid} canEdit={canEdit} />}
        {activeTab === 'referrals' && <ReferralsTab pid={pid} canEdit={canEdit} />}
        {activeTab === 'partners' && <PartnersTab pid={pid} canEdit={canEdit} />}
        {activeTab === 'gamification' && <GamificationTab pid={pid} canEdit={canEdit} />}
        {activeTab === 'email' && <EmailTab pid={pid} canEdit={canEdit} />}
        {activeTab === 'team' && <ProjectTeam />}
      </div>
    </div>
  );
}

import { useState, useCallback } from 'react';
import useReferrals from '../../hooks/useReferrals';
import { UsersIcon, countDescendants } from '@pionts/shared';
import { useWidgetConfig } from '../../context/WidgetConfigContext';
import ReferralLinkSection from './ReferralLinkSection';
import NetworkTreeSection from './NetworkTreeSection';

export default function Referrals() {
  const { data, loading, error } = useReferrals();
  const { settings } = useWidgetConfig();
  const [tab, setTab] = useState<'referrals' | 'network'>('referrals');
  const [treeGen, setTreeGen] = useState<number | null>(null);
  const defaultLabels = ['Level 1', 'Level 2', 'Level 3'];
  const defaultEarn = ['earns you 5 pts/order', 'earns you 2 pts/order', ''];
  const levelLabels = settings?.level_labels && settings.level_labels.length > 0 ? settings.level_labels : defaultLabels;
  const levelEarn = settings?.level_earn && settings.level_earn.length > 0 ? settings.level_earn : defaultEarn;

  const expandAll = useCallback(() => setTreeGen((g) => Math.abs(g || 0) + 1), []);
  const collapseAll = useCallback(() => setTreeGen((g) => -(Math.abs(g || 0) + 1)), []);

  if (loading) return <div className="text-center p-10 text-[#888]">Loading...</div>;
  if (error) return <div className="px-4 py-3 rounded mb-4 text-sm bg-[#fef2f2] border border-[#d93025] text-[#d93025]">{error}</div>;
  if (!data) return null;

  const directReferrals = data.direct_referrals || [];
  const downlineTree = data.downline_tree || [];
  const storeUrl = settings?.referral_base_url || 'https://8bc.store';
  const refUrl = data.referral_link || `${storeUrl}?ref=${data.referral_code}`;
  const directCount = data.stats?.direct ?? 0;
  const networkCount = data.stats?.network ?? 0;
  const totalDescendants = downlineTree.reduce((s, n) => s + 1 + countDescendants(n), 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Page Header */}
      <div className="bg-white border border-[#e0e0e0] rounded-2xl px-8 py-7 flex items-center gap-[18px] shadow-[0_2px_16px_rgba(0,0,0,0.04)] max-[600px]:px-[22px] max-[600px]:py-5">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white bg-[#0ea5e9]">
          <UsersIcon size={24} />
        </div>
        <div>
          <div className="text-[22px] font-extrabold text-[#1a1a1a] leading-tight max-[600px]:text-lg">Referrals</div>
          <div className="text-[13px] text-[#999] mt-0.5">Grow your network, earn more points</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="bg-white border border-[#e0e0e0] rounded-xl flex items-center overflow-hidden max-[768px]:flex-wrap max-[600px]:flex-wrap">
        <div className="flex-1 text-center py-[18px] px-3 max-[600px]:flex-[0_0_50%] max-[600px]:py-3.5 max-[600px]:px-2">
          <div className="text-[22px] font-bold text-[#1a1a1a] leading-none max-[768px]:text-lg">{directCount}</div>
          <div className="text-[11px] text-[#999] mt-1 uppercase tracking-[0.5px]">Direct</div>
        </div>
        <div className="w-px h-10 bg-[#e0e0e0] shrink-0 max-[600px]:hidden" />
        <div className="flex-1 text-center py-[18px] px-3 max-[600px]:flex-[0_0_50%] max-[600px]:py-3.5 max-[600px]:px-2">
          <div className="text-[22px] font-bold text-[#1a1a1a] leading-none max-[768px]:text-lg">{networkCount}</div>
          <div className="text-[11px] text-[#999] mt-1 uppercase tracking-[0.5px]">Network</div>
        </div>
        <div className="w-px h-10 bg-[#e0e0e0] shrink-0 max-[600px]:hidden" />
        <div className="flex-1 text-center py-[18px] px-3 max-[600px]:flex-[0_0_50%] max-[600px]:py-3.5 max-[600px]:px-2">
          <div className="text-[22px] font-bold text-[#0a8a5a] leading-none max-[768px]:text-lg">{data.total_referral_earnings ?? 0}</div>
          <div className="text-[11px] text-[#999] mt-1 uppercase tracking-[0.5px]">Pts Earned</div>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="bg-white border border-[#e0e0e0] rounded-xl p-[22px]">
        <div className="flex border-b border-[#e0e0e0] -mx-[22px] -mt-[22px] mb-4 px-[22px]">
          <button
            className={`bg-transparent border-none px-5 py-3.5 text-sm font-semibold cursor-pointer relative flex items-center gap-2 font-sans transition-colors duration-200 hover:text-[#555] ${tab === 'referrals' ? 'text-[#1a1a1a] tab-active-indicator' : 'text-[#999]'}`}
            onClick={() => setTab('referrals')}
            type="button"
          >
            My Referrals
            <span className={`text-[11px] font-semibold text-white px-[7px] py-[1px] rounded-[10px] ${tab === 'referrals' ? 'bg-primary' : 'bg-[#ccc]'}`}>{directCount}</span>
          </button>
          <button
            className={`bg-transparent border-none px-5 py-3.5 text-sm font-semibold cursor-pointer relative flex items-center gap-2 font-sans transition-colors duration-200 hover:text-[#555] ${tab === 'network' ? 'text-[#1a1a1a] tab-active-indicator' : 'text-[#999]'}`}
            onClick={() => setTab('network')}
            type="button"
          >
            Network
            <span className={`text-[11px] font-semibold text-white px-[7px] py-[1px] rounded-[10px] ${tab === 'network' ? 'bg-primary' : 'bg-[#ccc]'}`}>{networkCount}</span>
          </button>
        </div>

        {tab === 'referrals' && (
          <ReferralLinkSection
            refUrl={refUrl}
            directCount={directCount}
            directReferrals={directReferrals}
          />
        )}

        {tab === 'network' && (
          <NetworkTreeSection
            downlineTree={downlineTree}
            totalDescendants={totalDescendants}
            directCount={directCount}
            referralCode={data.referral_code}
            treeGen={treeGen}
            levelLabels={levelLabels}
            levelEarn={levelEarn}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
          />
        )}
      </div>
    </div>
  );
}

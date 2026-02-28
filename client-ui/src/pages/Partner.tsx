import useCustomer from '../hooks/useCustomer';
import { useWidgetConfig } from '../context/WidgetConfigContext';
import CopyButton from '../components/CopyButton';

export default function Partner() {
  const { data, loading, error } = useCustomer();
  const { settings } = useWidgetConfig();

  if (loading) return <div className="text-center p-10 text-[#888]">Loading...</div>;
  if (error) return <div className="px-4 py-3 rounded mb-4 text-sm bg-[#fef2f2] border border-[#d93025] text-[#d93025]">{error}</div>;
  if (!data || !data.partner_info) return <div className="text-center p-10 text-[#888]">Partner information not available.</div>;

  const info = data.partner_info;
  const storeUrl = settings?.referral_base_url || 'https://8bc.store';
  const refUrl = `${storeUrl}?ref=${data.referral_code}`;

  return (
    <div className="flex flex-col gap-5">
      {/* Page Header */}
      <div className="bg-white border border-[#e0e0e0] rounded-2xl px-8 py-7 flex items-center gap-[18px] shadow-[0_2px_16px_rgba(0,0,0,0.04)] max-[600px]:px-[22px] max-[600px]:py-5">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white bg-[#f59e0b]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div>
          <div className="text-[22px] font-extrabold text-[#1a1a1a] leading-tight max-[600px]:text-lg">Partner Dashboard</div>
          <div className="text-[13px] text-[#999] mt-0.5">Your commission earnings and stats</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="bg-white border border-[#e0e0e0] rounded-xl flex items-center overflow-hidden max-[768px]:flex-wrap max-[600px]:flex-wrap">
        <div className="flex-1 text-center py-[18px] px-3 max-[600px]:flex-[0_0_50%] max-[600px]:py-3.5 max-[600px]:px-2">
          <div className="text-[22px] font-bold text-[#f59e0b] leading-none max-[768px]:text-lg">{info.commission_pct}%</div>
          <div className="text-[11px] text-[#999] mt-1 uppercase tracking-[0.5px]">Commission</div>
        </div>
        <div className="w-px h-10 bg-[#e0e0e0] shrink-0 max-[600px]:hidden" />
        <div className="flex-1 text-center py-[18px] px-3 max-[600px]:flex-[0_0_50%] max-[600px]:py-3.5 max-[600px]:px-2">
          <div className="text-[22px] font-bold text-[#0a8a5a] leading-none max-[768px]:text-lg">&euro;{info.total_earned.toFixed(2)}</div>
          <div className="text-[11px] text-[#999] mt-1 uppercase tracking-[0.5px]">Total Earned</div>
        </div>
        <div className="w-px h-10 bg-[#e0e0e0] shrink-0 max-[600px]:hidden" />
        <div className="flex-1 text-center py-[18px] px-3 max-[600px]:flex-[0_0_50%] max-[600px]:py-3.5 max-[600px]:px-2">
          <div className="text-[22px] font-bold text-[#1a1a1a] leading-none max-[768px]:text-lg">&euro;{info.credit_balance.toFixed(2)}</div>
          <div className="text-[11px] text-[#999] mt-1 uppercase tracking-[0.5px]">Credit Balance</div>
        </div>
        <div className="w-px h-10 bg-[#e0e0e0] shrink-0 max-[600px]:hidden" />
        <div className="flex-1 text-center py-[18px] px-3 max-[600px]:flex-[0_0_50%] max-[600px]:py-3.5 max-[600px]:px-2">
          <div className="text-[22px] font-bold text-[#1a1a1a] leading-none max-[768px]:text-lg">{info.total_orders}</div>
          <div className="text-[11px] text-[#999] mt-1 uppercase tracking-[0.5px]">Orders</div>
        </div>
      </div>

      {/* Referral Link for Partner */}
      <div className="bg-white border border-[#e0e0e0] rounded-xl p-[22px]">
        <div className="text-sm font-bold text-[#1a1a1a] uppercase tracking-[0.5px] mb-3.5">Your Partner Link</div>
        <div className="flex gap-2 mb-2.5 max-[600px]:flex-col">
          <input
            className="flex-1 bg-bg border border-[#ddd] text-[#1a1a1a] px-3.5 py-2.5 rounded-md text-sm font-sans outline-none focus:border-primary"
            type="text"
            value={refUrl}
            readOnly
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <CopyButton text={refUrl} />
        </div>
        <div className="text-xs text-[#999] mt-2.5">Share this link to earn {info.commission_pct}% commission on every purchase.</div>
      </div>

      {/* How it works */}
      <div className="bg-white border border-[#e0e0e0] rounded-xl p-[22px]">
        <div className="text-sm font-bold text-[#1a1a1a] uppercase tracking-[0.5px] mb-3">How It Works</div>
        <div className="text-[13px] text-[#666] leading-relaxed space-y-2">
          <p>As a partner, you earn <span className="font-semibold text-[#f59e0b]">{info.commission_pct}% commission</span> on every order placed by customers you refer.</p>
          <p>Your credit balance accumulates as referred customers make purchases. Credits can be applied toward future orders or withdrawn.</p>
        </div>
      </div>
    </div>
  );
}

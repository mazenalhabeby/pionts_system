import type { ReferralFunnelData } from '@pionts/shared';

interface Props {
  data: ReferralFunnelData;
}

const STEPS = [
  { key: 'totalCustomers' as const, label: 'Total Customers', color: '#ff3c00' },
  { key: 'referredSignups' as const, label: 'Referred Signups', color: '#f97316' },
  { key: 'referredPurchasers' as const, label: 'Converted Buyers', color: '#50e3c2' },
];

export default function ReferralFunnel({ data }: Props) {
  const max = Math.max(data.totalCustomers, 1);

  const referralRate = data.totalCustomers > 0
    ? ((data.referredSignups / data.totalCustomers) * 100).toFixed(1)
    : '0.0';
  const conversionRate = data.totalCustomers > 0
    ? ((data.referredPurchasers / data.totalCustomers) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="flex flex-col gap-3">
      {STEPS.map((step) => {
        const value = data[step.key];
        const pct = Math.round((value / max) * 100);
        return (
          <div key={step.key}>
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: step.color }} />
                <span className="text-[12px] font-medium text-text-muted">{step.label}</span>
              </div>
              <span className="text-[13px] font-bold text-text-primary tabular-nums">
                {value.toLocaleString()}
                <span className="text-text-faint font-normal ml-1.5 text-[11px]">{pct}%</span>
              </span>
            </div>
            <div className="h-2 bg-bg-surface-raised rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  background: step.color,
                  boxShadow: `0 0 8px ${step.color}40`,
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Bottom metrics */}
      <div className="flex items-center pt-3 mt-1 border-t border-border-default">
        <div className="flex-1 text-center">
          <div className="text-[9px] text-text-faint uppercase tracking-[0.1em] font-semibold">Referral Rate</div>
          <div className="text-[15px] font-extrabold text-[#f97316] tabular-nums mt-0.5">{referralRate}%</div>
        </div>
        <div className="w-px h-8 bg-border-default" />
        <div className="flex-1 text-center">
          <div className="text-[9px] text-text-faint uppercase tracking-[0.1em] font-semibold">Conversion Rate</div>
          <div className="text-[15px] font-extrabold text-success tabular-nums mt-0.5">{conversionRate}%</div>
        </div>
      </div>
    </div>
  );
}

import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import type { PointsEconomyBucket } from '@pionts/shared';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtK = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v));
const fmtDate = (d: string) => { const dt = new Date(d); return `${MONTHS[dt.getMonth()]} ${dt.getDate()}`; };

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const issued = payload.find((p: any) => p.dataKey === 'issued')?.value ?? 0;
  const redeemed = payload.find((p: any) => p.dataKey === 'redeemed')?.value ?? 0;
  const net = issued - redeemed;
  return (
    <div className="bg-bg-surface border border-border-default rounded-lg px-3.5 py-2.5 shadow-xl text-[12px]">
      <div className="text-text-faint mb-2 font-medium">{fmtDate(label)}</div>
      <div className="flex items-center gap-2.5 py-0.5">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#50e3c2', boxShadow: '0 0 6px rgba(80,227,194,0.4)' }} />
        <span className="text-text-muted">Issued</span>
        <span className="font-bold text-text-primary ml-auto tabular-nums">{issued.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2.5 py-0.5">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#6366f1', boxShadow: '0 0 6px rgba(99,102,241,0.4)' }} />
        <span className="text-text-muted">Redeemed</span>
        <span className="font-bold text-text-primary ml-auto tabular-nums">{redeemed.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2.5 py-0.5 border-t border-border-default mt-1 pt-1">
        <span className="w-2 h-2 rounded-full shrink-0 bg-transparent" />
        <span className="text-text-muted">Net</span>
        <span className={`font-bold ml-auto tabular-nums ${net >= 0 ? 'text-success' : 'text-[#ee5555]'}`}>
          {net >= 0 ? '+' : ''}{net.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export default function PointsEconomyChart({ buckets }: { buckets: PointsEconomyBucket[] }) {
  if (buckets.length < 2) {
    return <div className="text-center text-text-muted py-16 text-[13px]">Not enough data yet</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={buckets} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="an-grad-issued" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#50e3c2" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#50e3c2" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="an-grad-redeemed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" vertical={false} />
          <XAxis
            dataKey="bucket"
            tickFormatter={fmtDate}
            tick={{ fontSize: 11, fill: '#666' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            tickFormatter={fmtK}
            tick={{ fontSize: 11, fill: '#666' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(128,128,128,0.15)' }} />
          <Area
            type="monotone"
            dataKey="issued"
            stroke="#50e3c2"
            strokeWidth={2.5}
            fill="url(#an-grad-issued)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--color-bg-card, #111)' }}
          />
          <Area
            type="monotone"
            dataKey="redeemed"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#an-grad-redeemed)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--color-bg-card, #111)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      {/* Legend below chart */}
      <div className="flex items-center gap-5 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#50e3c2', boxShadow: '0 0 8px rgba(80,227,194,0.4)' }} />
          <span className="text-[12px] text-text-muted font-medium">Issued</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#6366f1', boxShadow: '0 0 8px rgba(99,102,241,0.4)' }} />
          <span className="text-[12px] text-text-muted font-medium">Redeemed</span>
        </div>
      </div>
    </div>
  );
}

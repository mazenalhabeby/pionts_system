import {
  ResponsiveContainer, AreaChart as RechartsArea, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import type { PointsEconomyBucket } from '@pionts/shared';
import { fmtK, fmtDate } from '../../constants';

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-surface border border-border-default rounded-lg px-3 py-2 shadow-lg text-[12px]">
      <div className="text-text-faint mb-1.5 font-medium">{fmtDate(label)}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-text-muted">{p.dataKey === 'issued' ? 'Issued' : 'Redeemed'}</span>
          <span className="font-bold text-text-primary ml-auto">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

interface PointsEconomyChartProps {
  buckets: PointsEconomyBucket[];
  issuedColor?: string;
  redeemedColor?: string;
  gradientId?: string;
}

export default function PointsEconomyChart({
  buckets,
  issuedColor = '#ff3c00',
  redeemedColor = '#6366f1',
  gradientId = 'default',
}: PointsEconomyChartProps) {
  if (buckets.length < 2) {
    return <div className="text-center text-text-muted py-10 text-[13px]">Not enough data yet</div>;
  }

  const issuedGradientId = `${gradientId}-grad-issued`;
  const redeemedGradientId = `${gradientId}-grad-redeemed`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-5 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: issuedColor }} />
          <span className="text-[12px] text-text-muted font-medium">Issued</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: redeemedColor }} />
          <span className="text-[12px] text-text-muted font-medium">Redeemed</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <RechartsArea data={buckets} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id={issuedGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={issuedColor} stopOpacity={0.2} />
              <stop offset="100%" stopColor={issuedColor} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={redeemedGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={redeemedColor} stopOpacity={0.2} />
              <stop offset="100%" stopColor={redeemedColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
          <XAxis
            dataKey="bucket"
            tickFormatter={fmtDate}
            tick={{ fontSize: 11, fill: '#888' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            tickFormatter={fmtK}
            tick={{ fontSize: 11, fill: '#888' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(128,128,128,0.2)' }} />
          <Area
            type="monotone"
            dataKey="issued"
            stroke={issuedColor}
            strokeWidth={2.5}
            fill={`url(#${issuedGradientId})`}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--color-bg-card, #111)' }}
          />
          <Area
            type="monotone"
            dataKey="redeemed"
            stroke={redeemedColor}
            strokeWidth={2.5}
            fill={`url(#${redeemedGradientId})`}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--color-bg-card, #111)' }}
          />
        </RechartsArea>
      </ResponsiveContainer>
    </div>
  );
}

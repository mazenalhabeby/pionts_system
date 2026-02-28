import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { CustomerSegments as Segments } from '@pionts/shared';

interface Props {
  data: Segments;
}

const COLORS = ['#50e3c2', '#f5a623', '#ee5555'];

export default function CustomerSegments({ data }: Props) {
  const total = data.active + data.at_risk + data.churned;

  const slices = [
    { name: 'Active', value: data.active, color: COLORS[0] },
    { name: 'At Risk', value: data.at_risk, color: COLORS[1] },
    { name: 'Churned', value: data.churned, color: COLORS[2] },
  ];

  if (total === 0) {
    return <div className="text-center text-text-muted py-10 text-[13px]">No customer data</div>;
  }

  const healthyPct = ((data.active / total) * 100).toFixed(0);
  const needsActionPct = (((data.at_risk + data.churned) / total) * 100).toFixed(0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-6 justify-center">
        {/* Donut */}
        <div className="relative shrink-0" style={{ width: 140, height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={58}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {slices.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
            <div className="text-[18px] font-extrabold text-text-primary leading-none tabular-nums">{total.toLocaleString()}</div>
            <div className="text-[9px] text-text-faint uppercase tracking-[0.08em] mt-1">total</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3">
          {slices.map((s) => (
            <div key={s.name} className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
              <div>
                <div className="text-[12px] text-text-muted">{s.name}</div>
                <div className="text-[16px] font-bold text-text-primary leading-tight tabular-nums">
                  {s.value.toLocaleString()}
                  <span className="text-[11px] font-normal text-text-faint ml-1">
                    ({((s.value / total) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom metrics */}
      <div className="flex items-center pt-3 border-t border-border-default">
        <div className="flex-1 text-center">
          <div className="text-[9px] text-text-faint uppercase tracking-[0.1em] font-semibold">Healthy</div>
          <div className="text-[15px] font-extrabold text-success tabular-nums mt-0.5">{healthyPct}%</div>
        </div>
        <div className="w-px h-8 bg-border-default" />
        <div className="flex-1 text-center">
          <div className="text-[9px] text-text-faint uppercase tracking-[0.1em] font-semibold">Needs Action</div>
          <div className="text-[15px] font-extrabold text-warning tabular-nums mt-0.5">{needsActionPct}%</div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  label: string;
  used: number;
  limit: number | null;
}

export default function UsageBar({ label, used, limit }: Props) {
  const pct = limit ? Math.min((used / limit) * 100, 100) : 0;
  const isUnlimited = limit === null;
  const barColor = pct >= 90 ? '#ee5555' : pct >= 70 ? '#f5a623' : '#50e3c2';

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-text-secondary">{label}</span>
        <div className="flex items-center gap-2">
          {!isUnlimited && (
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ color: barColor, background: `${barColor}15` }}>
              {Math.round(pct)}%
            </span>
          )}
          <span className="font-semibold text-text-primary">
            {used} / {isUnlimited ? '\u221E' : limit}
          </span>
        </div>
      </div>
      <div className="h-2.5 bg-bg-surface-raised rounded-full overflow-hidden">
        {!isUnlimited && (
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
            }}
          />
        )}
        {isUnlimited && (
          <div className="h-full rounded-full bg-success" style={{ width: '100%', opacity: 0.3 }} />
        )}
      </div>
    </div>
  );
}

interface HeroStat {
  label: string;
  value: string;
  accent?: boolean;
}

interface PageHeroProps {
  label: string;
  labelColor?: string;
  title: string;
  subtitle?: string;
  stats?: HeroStat[];
  className?: string;
}

export default function PageHero({ label, labelColor, title, subtitle, stats, className = '' }: PageHeroProps) {
  return (
    <div className={`bg-bg-card border border-border-default rounded-2xl ${className}`}>
      <div className="px-8 pt-8 pb-4 max-md:px-5 max-md:pt-6">
        <div
          className={`text-[11px] uppercase tracking-[2px] font-bold ${labelColor ? '' : 'text-primary'}`}
          style={labelColor ? { color: labelColor } : undefined}
        >
          {label}
        </div>
        <div className="text-[26px] font-extrabold text-text-primary leading-tight mt-1 max-md:text-[20px]">
          {title}
        </div>
        {subtitle && (
          <div className="text-[13px] text-text-muted mt-1">{subtitle}</div>
        )}
      </div>

      {stats && stats.length > 0 && (
        <div className={`grid border-t border-border-default max-md:grid-cols-2`} style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`px-8 py-5 max-md:px-5 max-md:py-4 ${i > 0 ? 'border-l border-border-default max-md:border-l-0' : ''} ${i >= 2 ? 'max-md:border-t max-md:border-border-default' : ''} ${i % 2 !== 0 ? 'max-md:border-l max-md:border-border-default' : ''}`}
            >
              <div className="text-[10px] uppercase tracking-wider font-semibold text-text-faint mb-1">{s.label}</div>
              <div className={`text-[22px] font-bold leading-none ${s.accent ? 'text-success' : 'text-text-primary'}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

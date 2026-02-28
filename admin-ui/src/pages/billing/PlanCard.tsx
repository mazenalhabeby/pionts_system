interface PlanCardProps {
  name: string;
  price: number;
  features: string[];
  current: boolean;
  onSelect?: () => void;
  popular?: boolean;
}

export default function PlanCard({ name, price, features, current, onSelect, popular }: PlanCardProps) {
  return (
    <div className={`rounded-xl border-2 relative overflow-hidden ${current ? 'border-primary bg-primary/5' : 'border-border-default bg-bg-card'}`}>
      {/* Accent strip at top for current plan */}
      {current && <div className="h-1 bg-gradient-to-r from-primary to-[#00c6ff]" />}

      {/* Popular badge */}
      {popular && !current && (
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)' }}>
            Popular
          </span>
        </div>
      )}

      <div className="p-5">
        <div className="text-lg font-bold text-text-primary">{name}</div>
        <div className="mt-2">
          <span className="text-3xl font-extrabold text-text-primary">
            {price === 0 ? 'Free' : `$${price}`}
          </span>
          {price > 0 && <span className="text-sm text-text-muted">/mo</span>}
        </div>
        <ul className="mt-4 space-y-2.5">
          {features.map((f) => (
            <li key={f} className="text-sm text-text-secondary flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 mt-px" style={{ color: '#50e3c2', background: 'rgba(80, 227, 194, 0.1)' }}>
                {'\u2713'}
              </span>
              {f}
            </li>
          ))}
        </ul>
        {current ? (
          <div className="mt-5 text-center text-sm font-semibold text-primary py-2.5">Current Plan</div>
        ) : onSelect ? (
          <button
            onClick={onSelect}
            className="mt-5 w-full bg-[#ededed] text-[#0a0a0a] border-none px-4 py-2.5 rounded-lg cursor-pointer text-sm font-semibold font-sans transition-all duration-200 hover:bg-white"
          >
            Upgrade
          </button>
        ) : null}
      </div>
    </div>
  );
}

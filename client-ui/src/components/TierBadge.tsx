interface Props {
  tier: string;
  multiplier: number;
}

const TIER_COLORS: Record<string, string> = {
  Bronze: '#cd7f32',
  Silver: '#a8a8a8',
  Gold: '#ffd700',
};

export default function TierBadge({ tier, multiplier }: Props) {
  const color = TIER_COLORS[tier] || 'var(--color-primary)';

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ backgroundColor: color + '22', color, border: `1px solid ${color}55` }}
    >
      {tier}
      {multiplier > 1 && <span className="text-[10px] opacity-75">×{multiplier}</span>}
    </span>
  );
}

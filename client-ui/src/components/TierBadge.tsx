interface Props {
  tier: string;
  multiplier: number;
}

export default function TierBadge({ tier, multiplier }: Props) {
  const tierClass = `pw-tier-badge pw-tier-badge--${tier.toLowerCase()}`;

  return (
    <span className={tierClass}>
      <span className="pw-tier-badge__icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </span>
      <span className="pw-tier-badge__label">{tier}</span>
      {multiplier > 1 && (
        <span className="pw-tier-badge__mult">{'\u00d7'}{multiplier}</span>
      )}
      <span className="pw-tier-badge__shimmer" />
    </span>
  );
}

export default function EmptyNetwork() {
  return (
    <div className="text-center px-5 pt-9 pb-6">
      <div className="mb-4">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="27" stroke="#333" strokeWidth="2" strokeDasharray="4 4"/>
          <circle cx="28" cy="20" r="6" fill="#222"/>
          <path d="M18 38a10 10 0 0 1 20 0" fill="#222"/>
          <circle cx="14" cy="30" r="4" fill="#1a1a1a"/>
          <path d="M8 40a6 6 0 0 1 12 0" fill="#1a1a1a"/>
          <circle cx="42" cy="30" r="4" fill="#1a1a1a"/>
          <path d="M36 40a6 6 0 0 1 12 0" fill="#1a1a1a"/>
        </svg>
      </div>
      <div className="text-base font-bold text-text-secondary mb-1.5">No referral chains yet</div>
      <div className="text-[13px] text-text-muted max-w-[300px] mx-auto leading-relaxed">When customers start referring others, the network tree will appear here.</div>
    </div>
  );
}

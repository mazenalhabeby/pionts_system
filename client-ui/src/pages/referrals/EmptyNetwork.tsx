export default function EmptyNetwork() {
  return (
    <div className="text-center pt-9 px-5 pb-6">
      <div className="mb-4">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="27" stroke="#e0e0e0" strokeWidth="2" strokeDasharray="4 4"/>
          <circle cx="28" cy="20" r="6" fill="#eee"/>
          <path d="M18 38a10 10 0 0 1 20 0" fill="#eee"/>
          <circle cx="14" cy="30" r="4" fill="#f5f5f5"/>
          <path d="M8 40a6 6 0 0 1 12 0" fill="#f5f5f5"/>
          <circle cx="42" cy="30" r="4" fill="#f5f5f5"/>
          <path d="M36 40a6 6 0 0 1 12 0" fill="#f5f5f5"/>
        </svg>
      </div>
      <div className="text-base font-bold text-[#555] mb-1.5">Your network starts here</div>
      <div className="text-[13px] text-[#aaa] max-w-[300px] mx-auto leading-normal">When your referrals invite others, your network tree will grow. You earn points from up to 3 levels deep.</div>
    </div>
  );
}

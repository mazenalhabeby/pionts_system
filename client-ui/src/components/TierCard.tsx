import React from 'react';

interface TierCardProps {
  points: number;
  discount: number;
  canRedeem: boolean;
  onRedeem: () => void;
  loading?: boolean;
}

const TierCard = React.memo(function TierCard({ points, discount, canRedeem, onRedeem, loading }: TierCardProps) {
  return (
    <div className={`bg-white border border-[#e0e0e0] rounded-lg p-5 text-center ${canRedeem ? '' : 'opacity-50'}`}>
      <div className="text-xl font-bold text-[#1a1a1a]">{points} pts</div>
      <div className="text-sm text-[#0a8a5a] my-1 mb-4">&euro;{discount} OFF</div>
      <button
        className="w-full bg-primary text-white border-none py-2 rounded cursor-pointer font-semibold text-[13px] font-sans transition-colors duration-200 hover:enabled:bg-[#e03500] disabled:bg-[#ddd] disabled:text-[#999] disabled:cursor-not-allowed"
        disabled={!canRedeem || loading}
        onClick={onRedeem}
        type="button"
      >
        {loading ? '...' : 'REDEEM'}
      </button>
    </div>
  );
});

export default TierCard;

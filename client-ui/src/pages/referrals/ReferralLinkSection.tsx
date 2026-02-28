import CopyButton from '../../components/CopyButton';
import { timeAgo } from '@pionts/shared';
import type { ReferralNode } from '@pionts/shared';

interface ReferralLinkSectionProps {
  refUrl: string;
  directCount: number;
  directReferrals: ReferralNode[];
}

export default function ReferralLinkSection({ refUrl, directCount, directReferrals }: ReferralLinkSectionProps) {
  return (
    <>
      {/* Referral Link */}
      <div className="flex justify-between items-center mb-3.5">
        <div className="text-sm font-bold text-[#1a1a1a] uppercase tracking-[0.5px]">Your Referral Link</div>
        <div className="text-xs text-white bg-primary px-2.5 py-[3px] rounded-full font-semibold">{directCount} referrals</div>
      </div>
      <div className="flex gap-2 mb-2.5 max-[600px]:flex-col">
        <input
          className="flex-1 bg-bg border border-[#ddd] text-[#1a1a1a] px-3.5 py-2.5 rounded-md text-sm font-sans outline-none focus:border-primary"
          type="text"
          value={refUrl}
          readOnly
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <CopyButton text={refUrl} />
      </div>
      <div className="text-xs text-[#999] mt-2.5">Share this link — they get 5% off, you earn 5 pts per order.</div>

      {/* Direct Referrals Table */}
      <div className="text-sm font-bold text-[#1a1a1a] uppercase tracking-[0.5px] mt-5">Direct Referrals</div>
      {directReferrals.length === 0 ? (
        <div className="text-center p-5 text-[#999]">No referrals yet. Share your link to get started!</div>
      ) : (
        <div className="-mx-[22px] overflow-x-auto">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr>
                <th className="text-left px-3 py-2.5 text-[13px] text-[#888] border-b border-[#e0e0e0]">Name</th>
                <th className="text-left px-3 py-2.5 text-[13px] text-[#888] border-b border-[#e0e0e0]">Email</th>
                <th className="text-left px-3 py-2.5 text-[13px] text-[#888] border-b border-[#e0e0e0]">Orders</th>
                <th className="text-left px-3 py-2.5 text-[13px] text-[#888] border-b border-[#e0e0e0]">Joined</th>
              </tr>
            </thead>
            <tbody>
              {directReferrals.map((r) => (
                <tr key={r.id} className="hover:[&_td]:bg-[#fafafa] last:[&_td]:border-b-0">
                  <td className="px-3 py-2.5 border-b border-[#f0f0f0] text-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[30px] h-[30px] rounded-full bg-[#f0f0f0] text-[#888] flex items-center justify-center text-[13px] font-bold shrink-0">{(r.name || r.email || '?')[0].toUpperCase()}</div>
                      {r.name || '\u2014'}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 border-b border-[#f0f0f0] text-sm">{r.email}</td>
                  <td className="px-3 py-2.5 border-b border-[#f0f0f0] text-sm">{r.order_count}</td>
                  <td className="px-3 py-2.5 border-b border-[#f0f0f0] text-sm">{timeAgo(r.created_at || '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

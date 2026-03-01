import CopyButton from '../../components/CopyButton';
import { timeAgo } from '@pionts/shared';
import type { ReferralNode } from '@pionts/shared';

interface ReferralLinkSectionProps {
  refUrl: string;
  directCount: number;
  directReferrals: ReferralNode[];
  discountPercent?: string;
  referrerPoints?: string;
}

export default function ReferralLinkSection({ refUrl, directCount, directReferrals, discountPercent = '5', referrerPoints = '5' }: ReferralLinkSectionProps) {
  return (
    <>
      {/* Referral Link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="pw-section__title">Your Referral Link</div>
        <span className="pw-table__badge pw-table__badge--active">{directCount} referrals</span>
      </div>
      <div className="pw-share__link" style={{ marginBottom: 12 }}>
        <input
          className="pw-input"
          type="text"
          value={refUrl}
          readOnly
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <CopyButton text={refUrl} />
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af' }}>Share this link — they get {discountPercent}% off, you earn {referrerPoints} pts per order.</div>

      {/* Direct Referrals Table */}
      <div className="pw-section__title" style={{ marginTop: 24, marginBottom: 12 }}>Direct Referrals</div>
      {directReferrals.length === 0 ? (
        <div className="pw-empty">
          <div className="pw-empty__desc">No referrals yet. Share your link to get started!</div>
        </div>
      ) : (
        <div className="pw-table-wrap" style={{ margin: '0 -28px' }}>
          <table className="pw-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Orders</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {directReferrals.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="pw-avatar">{(r.name || r.email || '?')[0].toUpperCase()}</div>
                      {r.name || '\u2014'}
                    </div>
                  </td>
                  <td>{r.email}</td>
                  <td>{r.order_count}</td>
                  <td>{timeAgo(r.created_at || '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

import useCustomer from '../hooks/useCustomer';
import useReferrals from '../hooks/useReferrals';
import { useWidgetConfig } from '../context/WidgetConfigContext';
import { timeAgo } from '@pionts/shared';
import CopyButton from '../components/CopyButton';

function isActive(lastActivity?: string): boolean {
  if (!lastActivity) return false;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return new Date(lastActivity).getTime() > thirtyDaysAgo;
}

export default function Partner() {
  const { data, loading, error } = useCustomer();
  const { data: refData, loading: refLoading } = useReferrals();
  const { settings } = useWidgetConfig();

  if (loading) return <div className="pw-loading">Loading...</div>;
  if (error) return <div className="pw-error">{error}</div>;
  if (!data || !data.partner_info) return <div className="pw-loading">Partner information not available.</div>;

  const info = data.partner_info;
  const storeUrl = String(settings?.referral_base_url || '');
  const refUrl = storeUrl ? `${storeUrl}${storeUrl.includes('?') ? '&' : '?'}ref=${data.referral_code}` : '';
  const directReferrals = refData?.direct_referrals || [];

  return (
    <div className="pw-page-content">
      {/* Page Header */}
      <div className="pw-page-header">
        <div className="pw-page-header__icon pw-page-header__icon--amber">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div>
          <div className="pw-page-header__title">Partner Dashboard</div>
          <div className="pw-page-header__subtitle">Your commission earnings and stats</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="pw-metric-row">
        <div className="pw-metric">
          <div className="pw-metric__value pw-metric__value--amber">{info.commission_pct}%</div>
          <div className="pw-metric__label">Commission</div>
        </div>
        <div className="pw-metric">
          <div className="pw-metric__value pw-metric__value--green">&euro;{info.total_earned.toFixed(2)}</div>
          <div className="pw-metric__label">Total Earned</div>
        </div>
        <div className="pw-metric">
          <div className="pw-metric__value">&euro;{info.credit_balance.toFixed(2)}</div>
          <div className="pw-metric__label">Credit Balance</div>
        </div>
        <div className="pw-metric">
          <div className="pw-metric__value">{info.total_orders}</div>
          <div className="pw-metric__label">Orders</div>
        </div>
      </div>

      {/* Referral Link for Partner */}
      <div className="pw-section pw-section--padded">
        <div className="pw-section__title" style={{ marginBottom: 14 }}>Your Partner Link</div>
        <div className="pw-share__link" style={{ marginBottom: 10 }}>
          <input
            className="pw-input"
            type="text"
            value={refUrl}
            readOnly
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <CopyButton text={refUrl} />
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 10 }}>Share this link to earn {info.commission_pct}% commission on every purchase.</div>
      </div>

      {/* Referrals Table */}
      <div className="pw-section pw-section--padded">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="pw-section__title">Your Referrals</div>
          <span className="pw-table__badge pw-table__badge--active">{directReferrals.length} referrals</span>
        </div>
        {refLoading ? (
          <div className="pw-loading">Loading referrals...</div>
        ) : directReferrals.length === 0 ? (
          <div className="pw-empty">
            <div className="pw-empty__desc">No referrals yet. Share your partner link to get started!</div>
          </div>
        ) : (
          <div className="pw-table-wrap" style={{ margin: '0 -28px' }}>
            <table className="pw-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Orders</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {directReferrals.map((r) => {
                  const active = isActive(r.last_activity || r.created_at);
                  return (
                    <tr key={r.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="pw-avatar">{(r.name || r.email || '?')[0].toUpperCase()}</div>
                          {r.name || r.email || '\u2014'}
                        </div>
                      </td>
                      <td>{r.order_count ?? 0}</td>
                      <td>
                        <span className={`pw-table__badge ${active ? 'pw-table__badge--active' : ''}`}>
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{timeAgo(r.created_at || '')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="pw-section pw-section--padded">
        <div className="pw-section__title" style={{ marginBottom: 12 }}>How It Works</div>
        <div className="pw-partner-info">
          <p>As a partner, you earn <span className="pw-partner-highlight">{info.commission_pct}% commission</span> on every order placed by customers you refer.</p>
          <p>Your credit balance accumulates as referred customers make purchases. Credits can be applied toward future orders or withdrawn.</p>
        </div>
      </div>
    </div>
  );
}

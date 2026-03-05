import useCustomer from '../hooks/useCustomer';
import useReferrals from '../hooks/useReferrals';
import { useWidgetConfig } from '../context/WidgetConfigContext';
import CopyButton from '../components/CopyButton';
import { useI18n } from '../i18n';
import { useTimeAgo } from '../i18n/timeAgoLocalized';

function isActive(lastActivity?: string): boolean {
  if (!lastActivity) return false;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return new Date(lastActivity).getTime() > thirtyDaysAgo;
}

export default function Partner() {
  const { data, loading, error } = useCustomer();
  const { data: refData, loading: refLoading } = useReferrals();
  const { settings } = useWidgetConfig();
  const { t, formatCurrency } = useI18n();
  const timeAgo = useTimeAgo();

  if (loading) return <div className="pw-loading">{t('common.loading')}</div>;
  if (error) return <div className="pw-error">{error}</div>;
  if (!data || !data.partner_info) return <div className="pw-loading">{t('partner.not_available')}</div>;

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
          <div className="pw-page-header__title">{t('partner.title')}</div>
          <div className="pw-page-header__subtitle">{t('partner.subtitle')}</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="pw-metric-row">
        <div className="pw-metric">
          <div className="pw-metric__value pw-metric__value--amber">{info.commission_pct}%</div>
          <div className="pw-metric__label">{t('partner.stat_commission')}</div>
        </div>
        <div className="pw-metric">
          <div className="pw-metric__value pw-metric__value--green">{formatCurrency(info.total_earned)}</div>
          <div className="pw-metric__label">{t('partner.stat_total_earned')}</div>
        </div>
        <div className="pw-metric">
          <div className="pw-metric__value">{formatCurrency(info.credit_balance)}</div>
          <div className="pw-metric__label">{t('partner.stat_credit_balance')}</div>
        </div>
        <div className="pw-metric">
          <div className="pw-metric__value">{info.total_orders}</div>
          <div className="pw-metric__label">{t('partner.stat_orders')}</div>
        </div>
      </div>

      {/* Referral Link for Partner */}
      <div className="pw-section pw-section--padded">
        <div className="pw-section__title" style={{ marginBottom: 14 }}>{t('partner.link_title')}</div>
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
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 10 }}>{t('partner.link_hint', { pct: info.commission_pct })}</div>
      </div>

      {/* Referrals Table */}
      <div className="pw-section pw-section--padded">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="pw-section__title">{t('partner.referrals_title')}</div>
          <span className="pw-table__badge pw-table__badge--active">{t('partner.referrals_count', { count: directReferrals.length })}</span>
        </div>
        {refLoading ? (
          <div className="pw-loading">{t('partner.loading_referrals')}</div>
        ) : directReferrals.length === 0 ? (
          <div className="pw-empty">
            <div className="pw-empty__desc">{t('partner.no_referrals')}</div>
          </div>
        ) : (
          <div className="pw-table-wrap" style={{ margin: '0 -28px' }}>
            <table className="pw-table">
              <thead>
                <tr>
                  <th>{t('partner.th_name')}</th>
                  <th>{t('partner.th_orders')}</th>
                  <th>{t('partner.th_status')}</th>
                  <th>{t('partner.th_joined')}</th>
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
                          {active ? t('partner.status_active') : t('partner.status_inactive')}
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
        <div className="pw-section__title" style={{ marginBottom: 12 }}>{t('partner.how_title')}</div>
        <div className="pw-partner-info">
          <p>{t('partner.how_desc', { pct: info.commission_pct })}</p>
          <p>{t('partner.how_desc2')}</p>
        </div>
      </div>
    </div>
  );
}

import CopyButton from '../../components/CopyButton';
import QRCode from '../../components/QRCode';
import ShareCardButton from '../../components/ShareCardButton';
import type { ReferralNode } from '@pionts/shared';
import { useI18n } from '../../i18n';
import { useTimeAgo } from '../../i18n/timeAgoLocalized';
import { useWidgetConfig } from '../../context/WidgetConfigContext';

interface ReferralLinkSectionProps {
  refUrl: string;
  directCount: number;
  directReferrals: ReferralNode[];
  discountPercent?: string;
  referrerPoints?: string;
}

export default function ReferralLinkSection({ refUrl, directCount, directReferrals, discountPercent = '5', referrerPoints = '5' }: ReferralLinkSectionProps) {
  const { t } = useI18n();
  const timeAgo = useTimeAgo();
  const { settings } = useWidgetConfig();
  const brandName = String(settings?.widget_brand_name || 'Rewards');

  return (
    <>
      {/* Referral Link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="pw-section__title">{t('ref_link.title')}</div>
        <span className="pw-table__badge pw-table__badge--active">{t('ref_link.count', { count: directCount })}</span>
      </div>
      <div className="pw-share__link" style={{ marginBottom: 12 }}>
        <input
          className="pw-input"
          type="text"
          value={refUrl}
          readOnly
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <div className="pw-share-actions">
          <CopyButton text={refUrl} />
          <ShareCardButton url={refUrl} brandName={brandName} discountPercent={discountPercent} />
        </div>
      </div>
      <QRCode url={refUrl} size={280} />
      <div style={{ fontSize: 12, color: '#71717a', marginTop: 10 }}>{t('ref_link.share_hint', { discount: discountPercent, pts: referrerPoints })}</div>

      {/* Direct Referrals Table */}
      <div className="pw-section__title" style={{ marginTop: 24, marginBottom: 12 }}>{t('ref_link.table_title')}</div>
      {directReferrals.length === 0 ? (
        <div className="pw-empty">
          <div className="pw-empty__desc">{t('ref_link.empty')}</div>
        </div>
      ) : (
        <div className="pw-table-wrap" style={{ margin: '0 -28px' }}>
          <table className="pw-table">
            <thead>
              <tr>
                <th>{t('ref_link.th_name')}</th>
                <th>{t('ref_link.th_email')}</th>
                <th>{t('ref_link.th_orders')}</th>
                <th>{t('ref_link.th_joined')}</th>
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

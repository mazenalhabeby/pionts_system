import { useI18n } from '../../i18n';

export default function EmptyNetwork() {
  const { t } = useI18n();

  return (
    <div className="pw-empty">
      <div className="pw-empty__icon">
        <svg width="64" height="64" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="27" stroke="#e0e0e0" strokeWidth="2" strokeDasharray="4 4"/>
          <circle cx="28" cy="20" r="6" fill="#eee"/>
          <path d="M18 38a10 10 0 0 1 20 0" fill="#eee"/>
          <circle cx="14" cy="30" r="4" fill="#f5f5f5"/>
          <path d="M8 40a6 6 0 0 1 12 0" fill="#f5f5f5"/>
          <circle cx="42" cy="30" r="4" fill="#f5f5f5"/>
          <path d="M36 40a6 6 0 0 1 12 0" fill="#f5f5f5"/>
        </svg>
      </div>
      <div className="pw-empty__title">{t('network.empty_title')}</div>
      <div className="pw-empty__desc">{t('network.empty_desc')}</div>
    </div>
  );
}

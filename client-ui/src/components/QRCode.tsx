import { useState, useEffect, memo } from 'react';
import QRCodeLib from 'qrcode';
import { useI18n } from '../i18n';

interface QRCodeProps {
  url: string;
  size?: number;
  compact?: boolean;
}

function QRCode({ url, size = 280, compact = false }: QRCodeProps) {
  const [src, setSrc] = useState('');
  const { t } = useI18n();

  useEffect(() => {
    if (!url) return;
    QRCodeLib.toDataURL(url, {
      width: size * 2,
      margin: 1,
      color: { dark: '#ffffff', light: '#00000000' },
      errorCorrectionLevel: 'M',
    }).then(setSrc).catch(() => {});
  }, [url, size]);

  if (!src) return null;

  if (compact) {
    return (
      <div className="pw-qrcode pw-qrcode--compact">
        <div className="pw-qrcode__card">
          <img src={src} alt="QR Code" width={size} height={size} className="pw-qrcode__img" />
        </div>
      </div>
    );
  }

  return (
    <div className="pw-qrcode">
      <div className="pw-qrcode__card">
        <div className="pw-qrcode__glow" />
        <img src={src} alt="QR Code" width={size} height={size} className="pw-qrcode__img" />
        <div className="pw-qrcode__label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
          {t('ref_link.qr_scan')}
        </div>
      </div>
    </div>
  );
}

export default memo(QRCode);

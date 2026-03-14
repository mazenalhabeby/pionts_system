import { memo, useCallback } from 'react';
import QRCodeLib from 'qrcode';
import { useI18n } from '../i18n';

interface ShareCardButtonProps {
  url: string;
  brandName: string;
  discountPercent: string;
}

async function generateCard(url: string, brandName: string, cta: string): Promise<Blob> {
  const W = 600;
  const H = 700;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0f0f11');
  bg.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 24);
  ctx.fill();

  // Subtle border
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(0.5, 0.5, W - 1, H - 1, 24);
  ctx.stroke();

  // Brand name
  ctx.fillStyle = '#fafafa';
  ctx.font = 'bold 28px Outfit, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(brandName, W / 2, 60);

  // CTA text
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 18px Outfit, system-ui, sans-serif';
  ctx.fillText(cta, W / 2, 96);

  // QR code
  const qrDataUrl = await QRCodeLib.toDataURL(url, {
    width: 320,
    margin: 2,
    color: { dark: '#ffffff', light: '#00000000' },
    errorCorrectionLevel: 'M',
  });

  const qrImg = new Image();
  await new Promise<void>((resolve, reject) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = reject;
    qrImg.src = qrDataUrl;
  });

  // QR white background with rounded corners
  const qrSize = 320;
  const qrX = (W - qrSize) / 2;
  const qrY = 130;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath();
  ctx.roundRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 20);
  ctx.fill();
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // Referral URL
  const displayUrl = url.replace(/^https?:\/\//, '');
  ctx.fillStyle = '#d4d4d8';
  ctx.font = '500 14px Outfit, system-ui, sans-serif';
  const maxWidth = W - 80;
  const truncated = displayUrl.length > 55 ? displayUrl.slice(0, 52) + '...' : displayUrl;
  ctx.fillText(truncated, W / 2, qrY + qrSize + 52);

  // Bottom accent line
  const accent = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
  const primary = getComputedStyle(document.documentElement).getPropertyValue('--pionts-primary').trim() || '#3b82f6';
  accent.addColorStop(0, 'transparent');
  accent.addColorStop(0.5, primary);
  accent.addColorStop(1, 'transparent');
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W * 0.15, H - 60);
  ctx.lineTo(W * 0.85, H - 60);
  ctx.stroke();

  // "Powered by Pionts" footer
  ctx.fillStyle = '#52525b';
  ctx.font = '400 12px Outfit, system-ui, sans-serif';
  ctx.fillText('Powered by Pionts', W / 2, H - 28);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
}

function ShareCardButton({ url, brandName, discountPercent }: ShareCardButtonProps) {
  const { t } = useI18n();
  const cta = t('ref_link.share_card_cta', { discount: discountPercent });

  const handleShare = useCallback(async () => {
    const blob = await generateCard(url, brandName, cta);
    const file = new File([blob], 'referral-card.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file], title: t('ref_link.share_card_title') }).catch(() => {});
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'referral-card.png';
      a.click();
      URL.revokeObjectURL(a.href);
    }
  }, [url, brandName, cta, t]);

  return (
    <button className="pw-share-img-btn" onClick={handleShare} type="button">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
      {t('ref_link.share_image')}
    </button>
  );
}

export default memo(ShareCardButton);

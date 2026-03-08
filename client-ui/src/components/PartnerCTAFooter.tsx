import React, { useState } from 'react';
import { useI18n } from '../i18n';
import PartnerApplyForm from './PartnerApplyForm';

export default function PartnerCTAFooter() {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(false);
  const [showForm, setShowForm] = useState(false);

  if (dismissed) return null;

  if (showForm) {
    return <PartnerApplyForm onClose={() => setShowForm(false)} />;
  }

  return (
    <footer className="pw-pcta">
      {/* Animated gradient border */}
      <div className="pw-pcta__border" />

      {/* Glassmorphism body */}
      <div className="pw-pcta__glass">
        {/* Ambient orbs */}
        <div className="pw-pcta__orb pw-pcta__orb--1" />
        <div className="pw-pcta__orb pw-pcta__orb--2" />
        <div className="pw-pcta__orb pw-pcta__orb--3" />

        {/* Dismiss */}
        <button
          className="pw-pcta__close"
          onClick={() => setDismissed(true)}
          type="button"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className="pw-pcta__content">
          {/* Left: Icon badge */}
          <div className="pw-pcta__badge">
            <div className="pw-pcta__badge-ring" />
            <span className="pw-pcta__badge-icon">{'\uD83D\uDC8E'}</span>
          </div>

          {/* Center: Text */}
          <div className="pw-pcta__text">
            <div className="pw-pcta__label">{t('footer_partner.label')}</div>
            <div className="pw-pcta__headline">{t('footer_partner.headline')}</div>
            <div className="pw-pcta__sub">{t('footer_partner.subtitle')}</div>
          </div>

          {/* Right: CTA */}
          <button
            className="pw-pcta__btn"
            onClick={() => setShowForm(true)}
            type="button"
          >
            <span className="pw-pcta__btn-text">
              {t('footer_partner.cta')}
            </span>
            <svg className="pw-pcta__btn-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="pw-pcta__btn-shine" />
          </button>
        </div>

        {/* Floating sparkles */}
        <div className="pw-pcta__sparkle pw-pcta__sparkle--1" />
        <div className="pw-pcta__sparkle pw-pcta__sparkle--2" />
        <div className="pw-pcta__sparkle pw-pcta__sparkle--3" />
        <div className="pw-pcta__sparkle pw-pcta__sparkle--4" />
      </div>
    </footer>
  );
}

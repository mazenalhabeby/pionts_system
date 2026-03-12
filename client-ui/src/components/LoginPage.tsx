import React, { useState, useCallback, useMemo } from 'react';
import { useWidgetConfig } from '../context/WidgetConfigContext';
import { useI18n } from '../i18n';

const INCENTIVE_ICONS: Record<string, React.ReactNode> = {
  signup: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 7H5M8 4v6M14 8a6 6 0 11-12 0 6 6 0 0112 0z" />
    </svg>
  ),
  first_order: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 1h2.5l1.1 5.5a1.5 1.5 0 001.5 1.2h5.4a1.5 1.5 0 001.4-1l1.1-4H4" />
      <circle cx="6" cy="13" r="1" />
      <circle cx="12" cy="13" r="1" />
    </svg>
  ),
  purchase: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
      <path d="M1.5 7h13" />
    </svg>
  ),
  birthday: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1v2M4 5.5h8a1 1 0 011 1v2H3v-2a1 1 0 011-1zM2.5 8.5h11v4a1 1 0 01-1 1h-9a1 1 0 01-1-1v-4z" />
    </svg>
  ),
  review_photo: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="3" width="13" height="10" rx="1.5" />
      <circle cx="5.5" cy="6.5" r="1.5" />
      <path d="M14.5 10.5l-3.5-3-4 4-2-1.5L1.5 13" />
    </svg>
  ),
  review_text: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 5h7M4.5 8h5M2.5 1.5h11a1 1 0 011 1v9a1 1 0 01-1 1h-3l-2.5 2.5L5.5 12.5h-3a1 1 0 01-1-1v-9a1 1 0 011-1z" />
    </svg>
  ),
  follow_tiktok: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 1.5v9a3.5 3.5 0 11-2.5-3.35M10 1.5h2a3 3 0 003 3" />
    </svg>
  ),
  follow_instagram: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="1.5" width="13" height="13" rx="3.5" />
      <circle cx="8" cy="8" r="3" />
      <circle cx="12" cy="4" r="0.5" fill="currentColor" />
    </svg>
  ),
  share_product: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="3" r="2" />
      <circle cx="4" cy="8" r="2" />
      <circle cx="12" cy="13" r="2" />
      <path d="M5.8 9.1l4.4 2.8M10.2 4.1l-4.4 2.8" />
    </svg>
  ),
};

const INCENTIVE_PRIORITY: Record<string, number> = {
  signup: 1,
  first_order: 2,
  purchase: 3,
  birthday: 4,
  review_photo: 5,
  follow_tiktok: 6,
  follow_instagram: 7,
  share_product: 8,
  review_text: 9,
};

const MAX_INCENTIVES = 4;

function CoinSvg({ symbol, size }: { symbol: '€' | '$'; size: number }) {
  const r = size / 2;
  const ir = r * 0.82;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`cg-${symbol}-${size}`} cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="25%" stopColor="#fcd34d" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="80%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </radialGradient>
        <radialGradient id={`cs-${symbol}-${size}`} cx="35%" cy="25%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.7" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`ce-${symbol}-${size}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="50%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      {/* Outer edge — ridged look */}
      <circle cx={r} cy={r} r={r - 0.5} fill={`url(#ce-${symbol}-${size})`} />
      {/* Main face */}
      <circle cx={r} cy={r} r={r - 2} fill={`url(#cg-${symbol}-${size})`} />
      {/* Inner ring groove */}
      <circle cx={r} cy={r} r={ir} fill="none" stroke="#92400e" strokeWidth="1" opacity="0.4" />
      <circle cx={r} cy={r} r={ir - 1} fill="none" stroke="#fde68a" strokeWidth="0.5" opacity="0.3" />
      {/* Currency symbol — embossed */}
      <text
        x={r}
        y={r + size * 0.12}
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="bold"
        fontSize={size * 0.44}
        fill="#92400e"
        opacity="0.6"
      >
        {symbol}
      </text>
      <text
        x={r - 0.5}
        y={r + size * 0.12 - 0.8}
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="bold"
        fontSize={size * 0.44}
        fill="#fef3c7"
        opacity="0.5"
      >
        {symbol}
      </text>
      {/* Specular highlight */}
      <ellipse cx={r * 0.72} cy={r * 0.55} rx={r * 0.38} ry={r * 0.22} fill={`url(#cs-${symbol}-${size})`} transform={`rotate(-15 ${r * 0.72} ${r * 0.55})`} />
    </svg>
  );
}

export default function LoginPage() {
  const { login, api, settings, preAuthConfig } = useWidgetConfig();
  const { t } = useI18n();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const incentives = useMemo(() => {
    if (!preAuthConfig?.earn_actions) return [];
    return [...preAuthConfig.earn_actions]
      .sort((a, b) => (INCENTIVE_PRIORITY[a.slug] ?? 99) - (INCENTIVE_PRIORITY[b.slug] ?? 99))
      .slice(0, MAX_INCENTIVES)
      .map((a) => ({
        slug: a.slug,
        icon: INCENTIVE_ICONS[a.slug] || (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="8,1 10,6 15,6 11,9.5 12.5,14.5 8,11.5 3.5,14.5 5,9.5 1,6 6,6" />
          </svg>
        ),
        label: a.label,
        points: a.points,
      }));
  }, [preAuthConfig?.earn_actions]);

  const referralDiscount = preAuthConfig?.settings?.referral_discount_percent;
  const showReferralBadge = referralDiscount && Number(referralDiscount) > 0 && preAuthConfig?.enabled_modules?.referrals;
  const brandName = String(settings?.widget_brand_name || 'Rewards');

  const handleSendCode = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.sendCode(email) as { code?: string } | undefined;
      if (res?.code) setCode(res.code);
      setStep('code');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('login.error_send'));
    } finally {
      setLoading(false);
    }
  }, [email, api, t]);

  const handleVerifyCode = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, code);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('login.error_verify'));
    } finally {
      setLoading(false);
    }
  }, [email, code, login, t]);

  const handleBack = useCallback(() => {
    setStep('email');
    setCode('');
    setError('');
  }, []);

  return (
    <div className="pw-login">
      <div className="pw-login__coins" aria-hidden="true">
        {/* Outer coins — spread around edges */}
        <div className="pw-login__coin pw-login__coin--1"><CoinSvg symbol="€" size={64} /></div>
        <div className="pw-login__coin pw-login__coin--2"><CoinSvg symbol="$" size={56} /></div>
        <div className="pw-login__coin pw-login__coin--3"><CoinSvg symbol="€" size={44} /></div>
        <div className="pw-login__coin pw-login__coin--4"><CoinSvg symbol="$" size={42} /></div>
        <div className="pw-login__coin pw-login__coin--5"><CoinSvg symbol="€" size={48} /></div>
        <div className="pw-login__coin pw-login__coin--6"><CoinSvg symbol="$" size={46} /></div>
        <div className="pw-login__coin pw-login__coin--7"><CoinSvg symbol="€" size={28} /></div>
        <div className="pw-login__coin pw-login__coin--8"><CoinSvg symbol="$" size={24} /></div>
        <div className="pw-login__coin pw-login__coin--9"><CoinSvg symbol="€" size={32} /></div>
        <div className="pw-login__coin pw-login__coin--10"><CoinSvg symbol="$" size={20} /></div>
        <div className="pw-login__coin pw-login__coin--11"><CoinSvg symbol="€" size={36} /></div>
        <div className="pw-login__coin pw-login__coin--12"><CoinSvg symbol="$" size={26} /></div>
        {/* Center coins — close to / behind the form card */}
        <div className="pw-login__coin pw-login__coin--c1"><CoinSvg symbol="€" size={54} /></div>
        <div className="pw-login__coin pw-login__coin--c2"><CoinSvg symbol="$" size={48} /></div>
        <div className="pw-login__coin pw-login__coin--c3"><CoinSvg symbol="€" size={40} /></div>
        <div className="pw-login__coin pw-login__coin--c4"><CoinSvg symbol="$" size={44} /></div>
        <div className="pw-login__coin pw-login__coin--c5"><CoinSvg symbol="€" size={36} /></div>
        <div className="pw-login__coin pw-login__coin--c6"><CoinSvg symbol="$" size={50} /></div>
        <div className="pw-login__coin pw-login__coin--c7"><CoinSvg symbol="€" size={30} /></div>
        <div className="pw-login__coin pw-login__coin--c8"><CoinSvg symbol="$" size={42} /></div>
      </div>

      <div className="pw-login__card">
        <h1 className="pw-login__heading">
          {brandName}
          <br />
          <span className="pw-login__heading-accent">{t('login.heading_accent')}</span>
        </h1>
        <p className="pw-login__subtitle">
          {step === 'email'
            ? t('login.subtitle_email')
            : t('login.subtitle_code', { email })}
        </p>

        {step === 'email' && (
          <div className="pw-login__value-props">
            <div className="pw-login__vp">
              <div className="pw-login__vp-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                  <path d="M9 1.5l2.2 4.4 4.8.7-3.5 3.4.8 4.8L9 12.5l-4.3 2.3.8-4.8L2 6.6l4.8-.7L9 1.5z" />
                </svg>
              </div>
              <span className="pw-login__vp-label">{t('login.bonus_points')}</span>
            </div>
            <div className="pw-login__vp">
              <div className="pw-login__vp-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 9.5V3a1 1 0 011-1h6.5L17 9.5 9.5 17 2 9.5z" />
                  <circle cx="6" cy="6" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <span className="pw-login__vp-label">{t('login.earn_discounts')}</span>
            </div>
            <div className="pw-login__vp">
              <div className="pw-login__vp-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="6.5" cy="5" r="2.5" />
                  <path d="M1 16c0-3 2.5-5.5 5.5-5.5S12 13 12 16" />
                  <circle cx="13" cy="5.5" r="2" />
                  <path d="M13.5 10c2 .5 3.5 2.5 3.5 5" />
                </svg>
              </div>
              <span className="pw-login__vp-label">{t('login.refer_friends')}</span>
            </div>
          </div>
        )}

        {error && <div className="pw-error" style={{ marginBottom: 16 }}>{error}</div>}

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="pw-login__form">
            <div className="pw-login__input-row">
              <input
                type="email"
                placeholder={t('login.placeholder_email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="pw-input pw-login__input"
              />
              <button
                type="submit"
                disabled={loading || !email}
                className="pw-btn pw-btn--primary pw-login__cta"
              >
                {loading ? t('login.btn_sending') : t('login.btn_get_started')}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="pw-login__form">
            <input
              type="text"
              placeholder={t('login.placeholder_code')}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              autoFocus
              className="pw-input pw-input--code"
              style={{ marginBottom: 16 }}
            />
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="pw-btn pw-btn--primary pw-btn--full"
              style={{ padding: '12px 16px' }}
            >
              {loading ? t('login.btn_verifying') : t('login.btn_verify')}
            </button>
            <button
              type="button"
              className="pw-login__back"
              onClick={handleBack}
            >
              {t('login.back_email')}
            </button>
          </form>
        )}

        {/* Incentive chips — below form */}
        {incentives.length > 0 && step === 'email' && (
          <div className="pw-login__chips" data-testid="incentive-grid">
            {incentives.map((inc) => (
              <span key={inc.slug} className="pw-login__chip">
                <span className="pw-login__chip-icon">{inc.icon}</span>
                +{inc.points} {inc.label}
              </span>
            ))}
            {showReferralBadge && (
              <span className="pw-login__chip pw-login__chip--referral">
                <span className="pw-login__chip-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 7a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1 14v-1a4 4 0 014-4h2M12.5 9l2 2-2 2M10 7a2.5 2.5 0 100-5" />
                  </svg>
                </span>
                {t('login.referral_discount', { percent: String(referralDiscount) })}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="pw-login__accent-line" />
    </div>
  );
}

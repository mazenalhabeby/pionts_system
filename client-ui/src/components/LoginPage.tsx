import React, { useState, useCallback, useMemo } from 'react';
import { useWidgetConfig } from '../context/WidgetConfigContext';

const INCENTIVE_ICONS: Record<string, string> = {
  signup: '\uD83C\uDF81',
  first_order: '\uD83D\uDED2',
  purchase: '\uD83D\uDCB0',
  birthday: '\uD83C\uDF82',
  review_photo: '\uD83D\uDCF8',
  review_text: '\u270D\uFE0F',
  follow_tiktok: '\uD83C\uDFB5',
  follow_instagram: '\uD83D\uDCF7',
  share_product: '\uD83D\uDD17',
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

export default function LoginPage() {
  const { login, api, settings, preAuthConfig } = useWidgetConfig();
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
        icon: INCENTIVE_ICONS[a.slug] || '\u2B50',
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
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setLoading(false);
    }
  }, [email, api]);

  const handleVerifyCode = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, code);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setLoading(false);
    }
  }, [email, code, login]);

  const handleBack = useCallback(() => {
    setStep('email');
    setCode('');
    setError('');
  }, []);

  return (
    <div className="pw-login">
      {/* Left side — Content */}
      <div className="pw-login__content">
        <div className="pw-login__content-inner">
          <h1 className="pw-login__heading">
            {brandName}
            <br />
            <span className="pw-login__heading-accent">Rewards Program</span>
          </h1>
          <p className="pw-login__subtitle">
            {step === 'email'
              ? 'Sign up to earn points on every purchase, unlock exclusive discounts, and get rewarded for sharing with friends.'
              : `We sent a 6-digit code to ${email}`}
          </p>

          {error && <div className="pw-error" style={{ marginBottom: 16 }}>{error}</div>}

          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="pw-login__form">
              <div className="pw-login__input-row">
                <input
                  type="email"
                  placeholder="you@example.com"
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
                  {loading ? 'Sending...' : 'Get Started'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="pw-login__form">
              <input
                type="text"
                placeholder="000000"
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
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                type="button"
                className="pw-login__back"
                onClick={handleBack}
              >
                Use a different email
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
                  <span className="pw-login__chip-icon">{'\uD83E\uDD1D'}</span>
                  {referralDiscount}% off Referral Discount
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side — Visual showcase */}
      <div className="pw-login__visual">
        <div className="pw-login__scene">
          {/* Floating decorative elements */}
          <div className="pw-login__float pw-login__float--gift1">{'\uD83C\uDF81'}</div>
          <div className="pw-login__float pw-login__float--gift2">{'\uD83C\uDF80'}</div>
          <div className="pw-login__float pw-login__float--coin1">{'\uD83E\uDE99'}</div>
          <div className="pw-login__float pw-login__float--coin2">{'\uD83E\uDE99'}</div>
          <div className="pw-login__float pw-login__float--star1">{'\u2B50'}</div>
          <div className="pw-login__float pw-login__float--star2">{'\u2728'}</div>
          <div className="pw-login__float pw-login__float--confetti1">{'\uD83C\uDF89'}</div>
          <div className="pw-login__float pw-login__float--heart">{'\u2764\uFE0F'}</div>

          {/* Central reward card */}
          <div className="pw-login__reward-card">
            <div className="pw-login__reward-icon">{'\uD83C\uDFC6'}</div>
            <div className="pw-login__reward-pts">+100</div>
            <div className="pw-login__reward-label">Bonus Points</div>
          </div>

          {/* Secondary floating cards */}
          <div className="pw-login__mini-card pw-login__mini-card--top">
            <span>{'\uD83D\uDCB3'}</span> Earn Discounts
          </div>
          <div className="pw-login__mini-card pw-login__mini-card--bottom">
            <span>{'\uD83D\uDC65'}</span> Refer Friends
          </div>
        </div>
      </div>

      {/* Decorative bottom accent stripe */}
      <div className="pw-login__stripe" />
    </div>
  );
}

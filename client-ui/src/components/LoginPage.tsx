import React, { useState, useCallback } from 'react';
import { useWidgetConfig } from '../context/WidgetConfigContext';

export default function LoginPage() {
  const { login, api, settings } = useWidgetConfig();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      <div className="pw-login__card">
        <div className="pw-login__accent" />
        <div className="pw-login__body">
          <h1 className="pw-login__title">{String(settings?.widget_brand_name || 'Rewards')}</h1>
          <p className="pw-login__desc">
            {step === 'email'
              ? 'Enter your email to access your points, referrals, and rewards.'
              : `We sent a 6-digit code to ${email}`}
          </p>

          {error && <div className="pw-error" style={{ marginBottom: 16 }}>{error}</div>}

          {step === 'email' ? (
            <form onSubmit={handleSendCode}>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="pw-input"
                style={{ marginBottom: 16 }}
              />
              <button
                type="submit"
                disabled={loading || !email}
                className="pw-btn pw-btn--primary pw-btn--full"
                style={{ padding: '12px 16px' }}
              >
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode}>
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
        </div>
      </div>
    </div>
  );
}

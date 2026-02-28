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
      const res = await api.sendCode(email);
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white border border-[#e0e0e0] rounded-lg p-10 w-[360px] text-center shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
        <h1 className="text-[22px] font-bold mb-2 text-primary">{settings?.widget_brand_name || '8BC CREW'}</h1>
        <p className="text-[#888] text-sm mb-6">
          {step === 'email'
            ? 'Enter your email to access your points, referrals, and rewards.'
            : `We sent a 6-digit code to ${email}`}
        </p>

        {error && <div className="px-4 py-3 rounded mb-4 text-sm bg-[#fef2f2] border border-[#d93025] text-[#d93025]">{error}</div>}

        {step === 'email' ? (
          <form onSubmit={handleSendCode}>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full bg-bg border border-[#ddd] text-text px-3.5 py-2.5 rounded text-sm mb-4 outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-primary text-white border-none py-2 px-4 rounded cursor-pointer text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="w-full bg-bg border border-[#ddd] text-text px-3.5 py-2.5 rounded mb-4 outline-none focus:border-primary text-[28px] font-bold tracking-[8px] font-mono text-center"
            />
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-primary text-white border-none py-2 px-4 rounded cursor-pointer text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button
              type="button"
              className="bg-transparent border-none text-[#888] text-[13px] cursor-pointer p-2 font-sans underline mt-2 hover:text-[#1a1a1a] w-full"
              onClick={handleBack}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

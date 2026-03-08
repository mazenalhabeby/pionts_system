import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/ui/alert';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      if (msg === 'Invalid credentials') {
        setError('Incorrect email or password. Please try again.');
      } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        setError('Unable to reach the server. Check your connection and try again.');
      } else {
        setError(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page px-5 py-12">
      <div className="w-full max-w-[380px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10 auth-up">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="text-[20px] font-bold text-text-primary tracking-tight">PIONTS</span>
        </div>

        {/* Card */}
        <div className="auth-card rounded-2xl bg-bg-surface p-8 sm:p-10">
          <div className="mb-7 auth-up auth-d1">
            <h1 className="text-[22px] font-bold text-text-primary tracking-tight">Sign in</h1>
            <p className="text-[13px] text-text-muted mt-1">Welcome back. Enter your credentials to continue.</p>
          </div>

          {error && <Alert className="mb-5">{error}</Alert>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="auth-up auth-d2">
              <label htmlFor="login-email" className="block text-[12px] font-medium text-text-secondary mb-1.5">Email address</label>
              <input
                id="login-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                className="w-full bg-bg-page border border-border-default text-text-primary px-3.5 py-2.5 rounded-lg text-[14px] font-sans outline-none transition-all duration-150 focus:border-border-focus focus:ring-2 focus:ring-text-primary/[0.06] placeholder:text-text-faint/40"
              />
            </div>

            {/* Password */}
            <div className="auth-up auth-d3">
              <label htmlFor="login-password" className="block text-[12px] font-medium text-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg-page border border-border-default text-text-primary px-3.5 py-2.5 pr-10 rounded-lg text-[14px] font-sans outline-none transition-all duration-150 focus:border-border-focus focus:ring-2 focus:ring-text-primary/[0.06] placeholder:text-text-faint/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-secondary transition-colors duration-150 cursor-pointer bg-transparent border-none p-0"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="auth-up auth-d4 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-text-primary text-bg-page py-2.5 rounded-lg text-[13px] font-semibold transition-colors duration-150 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-[13px] text-text-muted mt-6 auth-up auth-d5">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-text-primary font-medium hover:underline no-underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

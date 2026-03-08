import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/ui/alert';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.orgName.trim()) {
      setError('Please enter your organization name.');
      return;
    }
    if (!form.email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!form.password.trim()) {
      setError('Please enter a password.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await signup(form);
      navigate('/projects');
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      if (msg === 'Email already registered') {
        setError('This email is already registered. Try signing in instead.');
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
            <h1 className="text-[22px] font-bold text-text-primary tracking-tight">Create your account</h1>
            <p className="text-[13px] text-text-muted mt-1">Set up your organization to get started.</p>
          </div>

          {error && <Alert className="mb-5">{error}</Alert>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Organization */}
            <div className="auth-up auth-d2">
              <label htmlFor="signup-org" className="block text-[12px] font-medium text-text-secondary mb-1.5">Organization name</label>
              <input
                id="signup-org"
                type="text"
                name="orgName"
                placeholder="Acme Inc."
                value={form.orgName}
                onChange={handleChange}
                autoFocus
                className="w-full bg-bg-page border border-border-default text-text-primary px-3.5 py-2.5 rounded-lg text-[14px] font-sans outline-none transition-all duration-150 focus:border-border-focus focus:ring-2 focus:ring-text-primary/[0.06] placeholder:text-text-faint/40"
              />
            </div>

            {/* Name */}
            <div className="auth-up auth-d3">
              <label htmlFor="signup-name" className="block text-[12px] font-medium text-text-secondary mb-1.5">
                Your name <span className="text-text-faint">(optional)</span>
              </label>
              <input
                id="signup-name"
                type="text"
                name="name"
                placeholder="Jane Doe"
                value={form.name}
                onChange={handleChange}
                className="w-full bg-bg-page border border-border-default text-text-primary px-3.5 py-2.5 rounded-lg text-[14px] font-sans outline-none transition-all duration-150 focus:border-border-focus focus:ring-2 focus:ring-text-primary/[0.06] placeholder:text-text-faint/40"
              />
            </div>

            {/* Email */}
            <div className="auth-up auth-d4">
              <label htmlFor="signup-email" className="block text-[12px] font-medium text-text-secondary mb-1.5">Email address</label>
              <input
                id="signup-email"
                type="email"
                name="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-bg-page border border-border-default text-text-primary px-3.5 py-2.5 rounded-lg text-[14px] font-sans outline-none transition-all duration-150 focus:border-border-focus focus:ring-2 focus:ring-text-primary/[0.06] placeholder:text-text-faint/40"
              />
            </div>

            {/* Password */}
            <div className="auth-up auth-d5">
              <label htmlFor="signup-password" className="block text-[12px] font-medium text-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={handleChange}
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
            <div className="auth-up auth-d6 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-text-primary text-bg-page py-2.5 rounded-lg text-[13px] font-semibold transition-colors duration-150 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-[13px] text-text-muted mt-6 auth-up auth-d7">
          Already have an account?{' '}
          <Link to="/login" className="text-text-primary font-medium hover:underline no-underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

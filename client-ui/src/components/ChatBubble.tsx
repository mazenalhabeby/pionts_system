import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWidgetConfig } from '../context/WidgetConfigContext';
import useCustomer from '../hooks/useCustomer';

/* ================================================================ */
/*  ICONS (inline SVGs for zero-dependency)                         */
/* ================================================================ */
const icons = {
  star: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  close: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  home: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  gift: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  ),
  tag: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  users: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  clock: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  check: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  copy: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  ),
  share: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  ),
  chevDown: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
  ),
};

/* ================================================================ */
/*  HELPERS                                                         */
/* ================================================================ */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

type TabKey = 'home' | 'earn' | 'redeem' | 'refer' | 'history';

const TABS: { key: TabKey; label: string; icon: (s?: number) => React.ReactNode }[] = [
  { key: 'home', label: 'Home', icon: icons.home },
  { key: 'earn', label: 'Earn', icon: icons.gift },
  { key: 'redeem', label: 'Redeem', icon: icons.tag },
  { key: 'refer', label: 'Refer', icon: icons.users },
  { key: 'history', label: 'History', icon: icons.clock },
];

/* ================================================================ */
/*  HOME SECTION                                                    */
/* ================================================================ */
function HomeSection({ customer, settings }: { customer: any; settings: any }) {
  const balance = customer.points_balance ?? 0;
  const earned = customer.points_earned_total ?? 0;
  const orders = customer.order_count ?? 0;
  const tiers = Array.isArray(settings?.gamification_tiers) ? settings.gamification_tiers : [];
  const currentTier = tiers
    .filter((t: any) => earned >= (t.min_points || 0))
    .sort((a: any, b: any) => (b.min_points || 0) - (a.min_points || 0))[0];
  const nextTier = tiers
    .filter((t: any) => (t.min_points || 0) > earned)
    .sort((a: any, b: any) => (a.min_points || 0) - (b.min_points || 0))[0];
  const progress = nextTier ? Math.min(100, Math.round((earned / nextTier.min_points) * 100)) : 100;

  return (
    <div className="cb-section">
      {/* Balance hero */}
      <div className="cb-balance-card">
        <div className="cb-balance-top">
          <div className="cb-balance-pts">
            <span className="cb-balance-num">{balance.toLocaleString()}</span>
            <span className="cb-balance-label">Points</span>
          </div>
          {currentTier && (
            <span className="cb-tier-badge">{currentTier.name || 'Member'}</span>
          )}
        </div>

        {nextTier && (
          <div className="cb-progress-wrap">
            <div className="cb-progress-bar">
              <div className="cb-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="cb-progress-label">
              <span>{progress}% to {nextTier.name}</span>
              <span>{(nextTier.min_points - earned).toLocaleString()} pts left</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="cb-stats-row">
        <div className="cb-stat">
          <span className="cb-stat-num">{earned.toLocaleString()}</span>
          <span className="cb-stat-label">Total earned</span>
        </div>
        <div className="cb-stat">
          <span className="cb-stat-num">{orders}</span>
          <span className="cb-stat-label">Orders</span>
        </div>
        <div className="cb-stat">
          <span className="cb-stat-num">{customer.referral_stats?.direct || 0}</span>
          <span className="cb-stat-label">Referrals</span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================ */
/*  EARN SECTION                                                    */
/* ================================================================ */
function EarnSection({ customer, onClaim, claimingAction }: { customer: any; onClaim: (slug: string) => void; claimingAction: string | null }) {
  const actions = Array.isArray(customer.earn_actions) ? customer.earn_actions.filter((a: any) => a.enabled) : [];
  const completed = Array.isArray(customer.completed_actions) ? customer.completed_actions : [];

  return (
    <div className="cb-section">
      <h3 className="cb-section-title">Earn Points</h3>
      <div className="cb-earn-list">
        {actions.map((action: any) => {
          const isDone = completed.includes(action.slug);
          const isClaiming = claimingAction === action.slug;

          // Birthday: only claimable during birthday month
          let isBirthdayClaimable = false;
          if (action.slug === 'birthday' && customer.birthday) {
            const parts = customer.birthday.split('-');
            const birthdayMonth = parts.length === 3 ? parseInt(parts[1], 10) : parseInt(parts[0], 10);
            isBirthdayClaimable = birthdayMonth === new Date().getMonth() + 1;
          }

          const isClaimable = !isDone && (
            (action.slug === 'birthday' && isBirthdayClaimable) ||
            (action.slug !== 'birthday' && ['follow_tiktok', 'follow_instagram', 'share_product'].includes(action.slug))
          );

          return (
            <div key={action.slug} className={`cb-earn-item ${isDone ? 'cb-earn-item--done' : ''}`}>
              <div className="cb-earn-icon">
                {isDone ? icons.check(14) : icons.star(14)}
              </div>
              <div className="cb-earn-info">
                <span className="cb-earn-name">{action.label}</span>
                <span className="cb-earn-pts">
                  {action.points_mode === 'per_amount'
                    ? `${action.points} point${action.points !== 1 ? 's' : ''} per €1 spent`
                    : `+${action.points} point${action.points !== 1 ? 's' : ''}`}
                  {action.frequency === 'one_time' ? ' · one-time' : action.frequency === 'yearly' ? ' · yearly' : ''}
                </span>
              </div>
              {isClaimable && (
                <button
                  className="cb-earn-btn"
                  onClick={() => onClaim(action.slug)}
                  disabled={isClaiming}
                >
                  {isClaiming ? '...' : 'Claim'}
                </button>
              )}
            </div>
          );
        })}
        {actions.length === 0 && (
          <p className="cb-empty">No earn actions available yet.</p>
        )}
      </div>
    </div>
  );
}

/* ================================================================ */
/*  REDEEM SECTION                                                  */
/* ================================================================ */
function RedeemSection({ customer, api, onRedeem, redeemingTier, lastCode, onRefresh }: { customer: any; api: any; onRedeem: (pts: number) => void; redeemingTier: number | null; lastCode: string | null; onRefresh: () => void }) {
  const tiers = Array.isArray(customer.redemption_tiers) ? [...customer.redemption_tiers].sort((a: any, b: any) => a.points - b.points) : [];
  const balance = customer.points_balance ?? 0;
  const [copiedCode, setCopiedCode] = useState('');
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [loadingRedemptions, setLoadingRedemptions] = useState(true);

  // Load unused redemptions
  useEffect(() => {
    api.getMyRedemptions()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.redemptions ?? [];
        setRedemptions(list.filter((r: any) => !r.used));
      })
      .catch(() => {})
      .finally(() => setLoadingRedemptions(false));
  }, [api, customer.points_balance]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancel = async (id: string | number) => {
    setCancellingId(String(id));
    setCancelError(null);
    try {
      await api.cancelRedemption(id);
      setRedemptions((prev) => prev.filter((r) => String(r.id) !== String(id)));
      onRefresh();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Cannot cancel this code';
      setCancelError(msg);
      setTimeout(() => setCancelError(null), 5000);
    }
    setCancellingId(null);
  };

  return (
    <div className="cb-section">
      <h3 className="cb-section-title">Redeem Points</h3>

      {/* Unused discount codes */}
      {redemptions.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
            Active Codes
          </p>
          {cancelError && (
            <div style={{ padding: '8px 12px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', marginBottom: '8px', fontSize: '12px', color: '#e53e3e' }}>
              {cancelError}
            </div>
          )}
          {redemptions.map((r: any) => {
            const code = r.discount_code || r.discountCode;
            const amount = r.discount_amount || r.discountAmount;
            const pts = r.points_spent || r.pointsSpent;
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#fff', border: '1px solid #eee', borderRadius: '10px', marginBottom: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a' }}>€{amount} off</div>
                  <code style={{ fontSize: '11px', color: '#888', letterSpacing: '0.3px' }}>{code}</code>
                </div>
                <button
                  onClick={() => copyCode(code)}
                  style={{ padding: '6px 10px', background: '#f5f5f5', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: '#555' }}
                >
                  {copiedCode === code ? '✓ Copied' : 'Copy'}
                </button>
                <button
                  onClick={() => handleCancel(r.id)}
                  disabled={cancellingId === String(r.id)}
                  style={{ padding: '6px 10px', background: '#fff5f5', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: '#e53e3e' }}
                >
                  {cancellingId === String(r.id) ? '...' : 'Refund'}
                </button>
              </div>
            );
          })}
        </div>
      )}


      <p style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
        Rewards
      </p>
      <div className="cb-tier-grid">
        {tiers.map((tier: any) => {
          const canRedeem = balance >= tier.points;
          const needed = tier.points - balance;
          const pct = Math.min(100, Math.round((balance / tier.points) * 100));
          return (
            <div key={tier.id || tier.points} className={`cb-tier-card ${canRedeem ? 'cb-tier-card--ready' : ''}`}>
              <div className="cb-tier-top">
                <span className="cb-tier-discount">€{tier.discount} off</span>
                <span className="cb-tier-cost">{tier.points.toLocaleString()} points</span>
              </div>
              <div className="cb-tier-bar">
                <div className="cb-tier-fill" style={{ width: `${canRedeem ? 100 : pct}%` }} />
              </div>
              <button
                className={`cb-tier-btn ${canRedeem ? 'cb-tier-btn--active' : ''}`}
                disabled={!canRedeem || redeemingTier === tier.points}
                onClick={() => onRedeem(tier.points)}
              >
                {redeemingTier === tier.points ? 'Redeeming...' : canRedeem ? 'Redeem' : `Need ${needed.toLocaleString()} more`}
              </button>
            </div>
          );
        })}
        {tiers.length === 0 && (
          <p className="cb-empty">No redemption tiers configured yet.</p>
        )}
      </div>
    </div>
  );
}

/* ================================================================ */
/*  REFER SECTION                                                   */
/* ================================================================ */
function ReferSection({ customer, settings }: { customer: any; settings: any }) {
  const [copied, setCopied] = useState(false);
  const code = customer.referral_code || '';
  const baseUrl = settings?.referral_base_url || window.location.origin;
  const link = code ? `${baseUrl}?ref=${code}` : '';
  const stats = customer.referral_stats || {};
  const earnings = customer.referral_earnings ?? 0;

  const copyLink = () => {
    if (link) {
      navigator.clipboard.writeText(link).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="cb-section">
      <h3 className="cb-section-title">Refer Friends</h3>
      <p className="cb-section-desc">Share your link and earn points when friends make a purchase.</p>

      {link && (
        <div className="cb-ref-link-box">
          <div className="cb-ref-link-text">{link}</div>
          <button className="cb-ref-copy-btn" onClick={copyLink}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      <div className="cb-stats-row">
        <div className="cb-stat">
          <span className="cb-stat-num">{stats.direct || 0}</span>
          <span className="cb-stat-label">Direct</span>
        </div>
        <div className="cb-stat">
          <span className="cb-stat-num">{stats.network || 0}</span>
          <span className="cb-stat-label">Network</span>
        </div>
        <div className="cb-stat">
          <span className="cb-stat-num">{earnings}</span>
          <span className="cb-stat-label">Pts earned</span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================ */
/*  HISTORY SECTION                                                 */
/* ================================================================ */
function HistorySection({ customer }: { customer: any }) {
  const history = Array.isArray(customer.history) ? customer.history.slice(0, 20) : [];

  const typeLabel: Record<string, string> = {
    signup: 'Sign-up bonus', purchase: 'Purchase', first_order: 'First order',
    referral_l2: 'Referral reward', referral_l3: 'Network reward',
    review_photo: 'Photo review', review_text: 'Text review',
    follow_tiktok: 'TikTok follow', follow_instagram: 'Instagram follow',
    share_product: 'Product share', birthday: 'Birthday bonus',
    redeem: 'Redeemed', clawback: 'Clawback',
    manual_award: 'Bonus', manual_deduct: 'Deduction',
  };

  return (
    <div className="cb-section">
      <h3 className="cb-section-title">Points History</h3>
      <div className="cb-history-list">
        {history.map((entry: any, i: number) => {
          const pts = entry.points ?? 0;
          const isPositive = pts >= 0;
          return (
            <div key={entry.id || i} className="cb-history-item">
              <div className="cb-history-left">
                <span className="cb-history-type">{typeLabel[entry.type] || entry.type}</span>
                <span className="cb-history-time">{timeAgo(entry.created_at)}</span>
              </div>
              <span className={`cb-history-pts ${isPositive ? 'cb-history-pts--pos' : 'cb-history-pts--neg'}`}>
                {isPositive ? '+' : ''}{pts}
              </span>
            </div>
          );
        })}
        {history.length === 0 && (
          <p className="cb-empty">No activity yet. Start earning points!</p>
        )}
      </div>
    </div>
  );
}

/* ================================================================ */
/*  LOGIN SECTION (for unauthenticated visitors)                    */
/* ================================================================ */
function LoginSection({ api, onLogin }: { api: any; onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async () => {
    if (!email.includes('@')) { setError('Enter a valid email'); return; }
    setSending(true); setError('');
    try {
      await api.sendCode(email);
      setStep('code');
    } catch (e: any) { setError(e.message || 'Failed to send code'); }
    setSending(false);
  };

  const verify = async () => {
    if (code.length < 4) { setError('Enter the code from your email'); return; }
    setSending(true); setError('');
    try {
      await api.verifyCode(email, code);
      onLogin();
    } catch (e: any) { setError(e.message || 'Invalid code'); }
    setSending(false);
  };

  return (
    <div className="cb-section cb-login">
      <div className="cb-login-icon">{icons.star(32)}</div>
      <h3 className="cb-login-title">Rewards Program</h3>
      <p className="cb-login-desc">Sign in with your email to view your points and rewards.</p>

      {error && <div className="cb-login-error">{error}</div>}

      {step === 'email' ? (
        <>
          <input
            className="cb-login-input"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendCode()}
          />
          <button className="cb-login-btn" onClick={sendCode} disabled={sending}>
            {sending ? 'Sending...' : 'Continue'}
          </button>
        </>
      ) : (
        <>
          <p className="cb-login-sent">Code sent to <strong>{email}</strong></p>
          <input
            className="cb-login-input"
            type="text"
            placeholder="Enter code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && verify()}
            autoFocus
          />
          <button className="cb-login-btn" onClick={verify} disabled={sending}>
            {sending ? 'Verifying...' : 'Verify'}
          </button>
          <button className="cb-login-back" onClick={() => { setStep('email'); setCode(''); setError(''); }}>
            Use different email
          </button>
        </>
      )}
    </div>
  );
}

/* ================================================================ */
/*  COMPLETE PROFILE SECTION (name + birthday required)             */
/* ================================================================ */
function CompleteProfileSection({ api, customer, onComplete }: { api: any; customer: any; onComplete: () => void }) {
  const [name, setName] = useState(customer?.name || '');
  const [birthday, setBirthday] = useState(customer?.birthday || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = name.trim().length >= 2 && birthday && birthday.split('-').length === 3;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    setError('');
    try {
      await api.updateProfile({ name: name.trim(), birthday });
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cb-section" style={{ padding: '24px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎉</div>
      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px', color: '#1a1a1a' }}>
        Complete Your Profile
      </h3>
      <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px' }}>
        Add your name and birthday to unlock rewards and earn bonus points!
      </p>
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '4px' }}>
            Full Name *
          </label>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '4px' }}>
            Birthday *
          </label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
          />
          <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
            Earn bonus points every year on your birthday!
          </p>
        </div>
        {error && <p style={{ fontSize: '12px', color: '#e53e3e', margin: 0 }}>{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || saving}
          style={{
            width: '100%', padding: '12px', border: 'none', borderRadius: '8px',
            background: canSubmit ? '#1a1a1a' : '#ccc', color: '#fff',
            fontSize: '14px', fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

/* ================================================================ */
/*  MAIN CHAT BUBBLE WIDGET                                         */
/* ================================================================ */
export default function ChatBubble() {
  const { authenticated, loading: authLoading, settings, api, logout, refresh } = useWidgetConfig();
  const { data: customer, loading: custLoading, refresh: refreshCustomer } = useCustomer();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [redeemingTier, setRedeemingTier] = useState<number | null>(null);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [claimingAction, setClaimingAction] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isLoading = authLoading || custLoading;
  const balance = customer?.points_balance ?? 0;

  // External events
  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    const onToggle = () => setOpen((p) => !p);
    window.addEventListener('pionts:open', onOpen);
    window.addEventListener('pionts:close', onClose);
    window.addEventListener('pionts:toggle', onToggle);
    return () => {
      window.removeEventListener('pionts:open', onOpen);
      window.removeEventListener('pionts:close', onClose);
      window.removeEventListener('pionts:toggle', onToggle);
    };
  }, []);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Redeem handler
  const handleRedeem = useCallback(async (tierPoints: number) => {
    if (!api) return;
    setRedeemingTier(tierPoints);
    try {
      const result = await api.redeem(tierPoints);
      setLastCode(result.discount_code);
      await refreshCustomer();
    } catch { /* silent */ }
    setRedeemingTier(null);
  }, [api, refreshCustomer]);

  // Claim handler
  const handleClaim = useCallback(async (slug: string) => {
    if (!api) return;
    setClaimingAction(slug);
    try {
      if (slug.startsWith('follow_')) {
        await api.initiateSocialFollow(slug);
      }
      await api.award(slug);
      await refreshCustomer();
    } catch { /* silent */ }
    setClaimingAction(null);
  }, [api, refreshCustomer]);

  // After login, refresh data
  const handleLogin = useCallback(() => {
    refresh?.();
    refreshCustomer();
  }, [refresh, refreshCustomer]);

  /* ---- RENDER ---- */
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="cb-loading">
          <div className="cb-spinner" />
          <span>Loading rewards...</span>
        </div>
      );
    }

    if (!authenticated) {
      return <LoginSection api={api} onLogin={handleLogin} />;
    }

    if (!customer) {
      return (
        <div className="cb-section">
          <p className="cb-empty">Unable to load rewards. Please try again.</p>
        </div>
      );
    }

    // Block until name and full birthday (YYYY-MM-DD) are provided
    const hasValidBirthday = customer.birthday && customer.birthday.split('-').length === 3;
    if (!customer.name || !hasValidBirthday) {
      return <CompleteProfileSection api={api} customer={customer} onComplete={refreshCustomer} />;
    }

    const projSettings = customer.settings || settings || {};

    switch (activeTab) {
      case 'home':
        return <HomeSection customer={customer} settings={projSettings} />;
      case 'earn':
        return <EarnSection customer={customer} onClaim={handleClaim} claimingAction={claimingAction} />;
      case 'redeem':
        return <RedeemSection customer={customer} api={api} onRedeem={handleRedeem} redeemingTier={redeemingTier} lastCode={lastCode} onRefresh={refreshCustomer} />;
      case 'refer':
        return <ReferSection customer={customer} settings={projSettings} />;
      case 'history':
        return <HistorySection customer={customer} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        className={`cb-trigger ${open ? 'cb-trigger--open' : ''}`}
        onClick={() => setOpen((p) => !p)}
        aria-label={open ? 'Close rewards' : 'Open rewards'}
        type="button"
      >
        <span className="cb-trigger-icon">
          {open ? icons.close(22) : icons.star(22)}
        </span>
        {!open && balance > 0 && authenticated && (
          <span className="cb-trigger-badge">{balance > 99 ? '99+' : balance}</span>
        )}
      </button>

      {/* Backdrop (mobile) */}
      {open && <div className="cb-backdrop" onClick={() => setOpen(false)} />}

      {/* Panel */}
      <div className={`cb-panel ${open ? 'cb-panel--open' : ''}`} ref={panelRef}>
        {/* Header */}
        <div className="cb-header">
          <div className="cb-header-left">
            <span className="cb-header-icon">{icons.star(18)}</span>
            <span className="cb-header-title">Rewards</span>
          </div>
          <button className="cb-header-close" onClick={() => setOpen(false)} type="button">
            {icons.close(18)}
          </button>
        </div>

        {/* Tab bar (only when authenticated) */}
        {authenticated && customer && (
          <nav className="cb-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`cb-tab ${activeTab === tab.key ? 'cb-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                {tab.icon(16)}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        )}

        {/* Content */}
        <div className="cb-content">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="cb-footer">
          <span>Powered by <strong>Pionts</strong></span>
        </div>
      </div>
    </>
  );
}

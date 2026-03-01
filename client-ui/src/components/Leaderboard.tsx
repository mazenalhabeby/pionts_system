import { useState, useEffect } from 'react';
import { useWidgetConfig } from '../context/WidgetConfigContext';
import useCustomer from '../hooks/useCustomer';
import { ChartIcon } from '@pionts/shared';

interface LeaderboardEntry {
  id: number;
  name?: string;
  email: string;
  direct: number;
  network: number;
}

function getInitial(entry: { name?: string; email?: string }): string {
  return (entry.name || entry.email || '?')[0].toUpperCase();
}

function getDisplayName(entry: LeaderboardEntry): string {
  if (entry.name) return entry.name;
  const at = entry.email.indexOf('@');
  return at > 0 ? entry.email.substring(0, at) : entry.email;
}

export default function Leaderboard() {
  const { api, customer } = useWidgetConfig();
  const { data: customerData } = useCustomer();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLeaderboard()
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [api]);

  if (loading) return <div className="pw-loading">Loading...</div>;

  const top3 = entries.slice(0, 3);
  const top10 = entries.slice(0, 10);
  const myEmail = customer?.email;
  const myRank = myEmail ? entries.findIndex((e) => e.email === myEmail) + 1 : 0;
  const myEntry = myRank > 0 ? entries[myRank - 1] : null;

  // Podium visual order: 2nd, 1st, 3rd
  const podiumOrder = top3.length >= 3
    ? [{ entry: top3[1], rank: 2 }, { entry: top3[0], rank: 1 }, { entry: top3[2], rank: 3 }]
    : top3.map((e, i) => ({ entry: e, rank: i + 1 }));

  const RANK_CLS = ['', 'lb-gold', 'lb-silver', 'lb-bronze'];
  const RANK_LABEL = ['', '1st', '2nd', '3rd'];

  return (
    <div className="pw-page-content">
      {/* Page Header */}
      <div className="pw-page-header">
        <div className="pw-page-header__icon pw-page-header__icon--chart">
          <ChartIcon size={24} />
        </div>
        <div>
          <div className="pw-page-header__title">Leaderboard</div>
          <div className="pw-page-header__subtitle">Top referrers in the community</div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="pw-section pw-section--padded">
          <div className="pw-empty"><div className="pw-empty__desc">No data yet</div></div>
        </div>
      ) : (
        <>
          <div className="pw-lb-layout">
            {/* ── Left: Podium Card ── */}
            <div className="pw-lb-podium-card">
              {/* Trophy + Title */}
              <div className="pw-lb-trophy">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
              <div className="pw-lb-title">Top Referrers</div>
              <div className="pw-lb-sub">This month's leaders</div>

              {/* Divider with crown */}
              <div className="pw-lb-divider">
                <span className="pw-lb-divider__line" />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4a373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pw-lb-divider__icon">
                  <path d="M2 4l3 12h14l3-12-6 7-4-9-4 9-6-7z" />
                </svg>
                <span className="pw-lb-divider__line" />
              </div>

              {/* Podium */}
              {top3.length >= 3 && (
                <div className="pw-lb-podium">
                  {podiumOrder.map(({ entry, rank }) => {
                    const cls = RANK_CLS[rank];
                    const isFirst = rank === 1;
                    return (
                      <div key={entry.id} className={`pw-lb-col ${cls}`}>
                        {isFirst && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4a373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pw-lb-col__crown">
                            <path d="M2 4l3 12h14l3-12-6 7-4-9-4 9-6-7z" />
                          </svg>
                        )}
                        <div className={`pw-lb-ava ${cls}`} style={{ width: isFirst ? 48 : 38, height: isFirst ? 48 : 38, fontSize: isFirst ? 18 : 14 }}>
                          {getInitial(entry)}
                        </div>
                        <div className={`pw-lb-ped ${cls}`} style={{ height: isFirst ? 68 : rank === 2 ? 48 : 36 }}>
                          <span className="pw-lb-ped__label">{RANK_LABEL[rank]}</span>
                        </div>
                        <div className="pw-lb-col__name">{getDisplayName(entry)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Right: Top 10 List ── */}
            <div className="pw-lb-list-card">
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1f2937', marginBottom: 12 }}>Top 10</div>
              <div className="pw-lb-list">
                {top10.map((entry, i) => {
                  const isMe = myEmail === entry.email;
                  return (
                    <div key={entry.id} className={`pw-lb-row ${isMe ? 'pw-lb-row--me' : ''}`}>
                      <span className={`pw-lb-row__rank ${i < 3 ? `pw-lb-row__rank--${['gold', 'silver', 'bronze'][i]}` : ''}`}>
                        {i + 1}
                      </span>
                      <div className="pw-lb-row__avatar">{getInitial(entry)}</div>
                      <div className="pw-lb-row__name">
                        {getDisplayName(entry)}
                        {isMe && <span className="pw-lb-you__badge">YOU</span>}
                      </div>
                      <div className="pw-lb-row__stat">{entry.network}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* You card */}
          {customerData && (
            <div className="pw-lb-you">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <div className="pw-lb-you__rank">{myRank || '-'}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>{customerData.name || 'You'}</span>
                    <span className="pw-lb-you__badge">YOU</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>
                    {myEntry ? `${myEntry.network} referrals` : `${customerData.referral_stats?.network || 0} referrals`}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--pionts-primary, #3b82f6)' }}>
                {customerData.points_balance} <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>pts</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

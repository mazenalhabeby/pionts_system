import { useState, useEffect } from 'react';
import { useWidgetConfig } from '../context/WidgetConfigContext';

interface LeaderboardEntry {
  id: number;
  name?: string;
  email: string;
  direct: number;
  network: number;
}

export default function Leaderboard() {
  const { api } = useWidgetConfig();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLeaderboard()
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [api]);

  if (loading) return <div className="text-center py-6 text-sm opacity-60">Loading...</div>;
  if (entries.length === 0) return <div className="text-center py-6 text-sm opacity-60">No data yet</div>;

  const rankColors = ['#ff3c00', '#06b6d4', '#6366f1'];

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold uppercase tracking-wide opacity-70 mb-3">Top Referrers</h3>
      {entries.map((entry, i) => (
        <div
          key={entry.id}
          className="flex items-center gap-3 rounded-lg px-3 py-2"
          style={{ backgroundColor: i < 3 ? `${rankColors[i]}11` : undefined }}
        >
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: rankColors[i] || '#999' }}
          >
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{entry.name || entry.email}</div>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold">{entry.network}</div>
            <div className="opacity-50">referrals</div>
          </div>
        </div>
      ))}
    </div>
  );
}

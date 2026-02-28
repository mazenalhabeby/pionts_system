import { useNavigate } from 'react-router-dom';
import { formatDate, getInitial } from '@pionts/shared';

interface DirectReferral {
  id: number | string;
  name?: string;
  email?: string;
  points_balance?: number;
  order_count?: number;
  created_at?: string;
}

interface DirectReferralsTableProps {
  directReferrals: DirectReferral[];
}

export default function DirectReferralsTable({ directReferrals }: DirectReferralsTableProps) {
  const navigate = useNavigate();

  if (directReferrals.length === 0) {
    return <div className="text-center py-8 text-[13px] text-text-muted">No direct referrals yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-text-faint uppercase tracking-[0.1em] border-b border-border-default whitespace-nowrap select-none">Customer</th>
            <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-text-faint uppercase tracking-[0.1em] border-b border-border-default whitespace-nowrap select-none">Balance</th>
            <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-text-faint uppercase tracking-[0.1em] border-b border-border-default whitespace-nowrap select-none">Orders</th>
            <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-text-faint uppercase tracking-[0.1em] border-b border-border-default whitespace-nowrap select-none">Joined</th>
          </tr>
        </thead>
        <tbody>
          {directReferrals.map((ref: DirectReferral) => (
            <tr
              key={ref.id}
              className="cursor-pointer transition-colors duration-150 hover:[&_td]:bg-bg-surface-hover/50 last:[&_td]:border-b-0 group"
              onClick={() => navigate(`/customer/${ref.id}`)}
            >
              <td className="px-4 py-3 border-b border-border-subtle/50 text-sm align-middle">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-accent to-[#ff6a3d] text-white flex items-center justify-center text-[12px] font-extrabold shrink-0 transition-shadow duration-200 group-hover:shadow-[0_0_12px_rgba(255,60,0,0.2)]">
                    {getInitial(ref.name, ref.email)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="text-[13px] font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">{ref.name || ref.email}</div>
                    <div className="text-[11px] text-text-faint whitespace-nowrap overflow-hidden text-ellipsis">{ref.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 border-b border-border-subtle/50 text-sm align-middle">
                <span className="inline-block font-bold text-[13px] text-primary bg-primary/8 px-2.5 py-0.5 rounded-md tabular-nums">{ref.points_balance || 0}</span>
              </td>
              <td className="px-4 py-3 border-b border-border-subtle/50 text-[13px] align-middle text-text-secondary tabular-nums">{ref.order_count || 0}</td>
              <td className="px-4 py-3 border-b border-border-subtle/50 text-[12px] align-middle text-text-faint whitespace-nowrap">{formatDate(ref.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

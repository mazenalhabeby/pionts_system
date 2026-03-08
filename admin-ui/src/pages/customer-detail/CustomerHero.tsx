import { Link } from 'react-router-dom';
import { ArrowRightIcon, getInitial } from '@pionts/shared';

interface CustomerHeroProps {
  customer: {
    name?: string;
    email?: string;
    points_balance?: number;
    points_earned_total?: number;
    order_count?: number;
    is_partner?: boolean;
  };
  canEdit?: boolean;
  onDelete?: () => void;
}

export default function CustomerHero({ customer, canEdit, onDelete }: CustomerHeroProps) {
  const stats = [
    { label: 'Balance', value: customer.points_balance || 0, color: 'text-accent', glow: 'rgba(255, 60, 0, 0.35)' },
    { label: 'Earned', value: customer.points_earned_total || 0, color: 'text-success', glow: 'rgba(80, 227, 194, 0.35)' },
    { label: 'Orders', value: customer.order_count || 0, color: 'text-text-primary', glow: 'rgba(237, 237, 237, 0.2)' },
  ];

  return (
    <div className="page-hero cd-hero bg-bg-card border border-border-default rounded-2xl relative overflow-hidden">
      <div className="px-8 pt-6 pb-7 flex flex-wrap items-center gap-5 max-md:flex-col max-md:items-stretch max-md:px-5 max-md:pt-5 max-md:pb-6">
        <Link to="/customers" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-faint no-underline transition-colors duration-150 w-full hover:text-text-secondary">
          <ArrowRightIcon size={14} style={{ transform: 'rotate(180deg)' }} />
          <span>Customers</span>
        </Link>

        <div className="flex items-center gap-4.5 flex-1 min-w-0">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-accent to-[#ff6a3d] flex items-center justify-center text-[24px] font-extrabold text-white shrink-0 max-md:w-[50px] max-md:h-[50px] max-md:text-lg" style={{ boxShadow: '0 0 28px rgba(255, 60, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
              {getInitial(customer.name, customer.email)}
            </div>
            <div className="absolute -inset-1 rounded-full border border-accent/20 pointer-events-none" />
          </div>
          <div>
            <div className="text-[28px] font-extrabold text-text-primary leading-tight tracking-[-0.02em] max-md:text-xl">
              {customer.name || 'Customer'}
            </div>
            <div className="flex items-center gap-2.5 mt-1">
              <span className="text-[13px] text-text-muted">{customer.email}</span>
              {customer.is_partner && (
                <span className="text-[10px] font-bold text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider" style={{ textShadow: '0 0 12px rgba(245, 158, 11, 0.4)' }}>
                  Partner
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 max-md:justify-center max-sm:flex-wrap max-sm:gap-2">
          {stats.map((s) => (
            <div key={s.label} className="text-center px-5 py-3.5 bg-bg-surface-raised/80 border border-border-default rounded-xl min-w-[96px] backdrop-blur-sm transition-all duration-200 hover:border-border-focus/30 hover:bg-bg-surface-raised max-md:px-4 max-md:py-2.5 max-sm:min-w-[80px]">
              <div className={`text-[22px] font-extrabold ${s.color} leading-none max-md:text-lg`} style={{ textShadow: `0 0 20px ${s.glow}` }}>
                {s.value.toLocaleString()}
              </div>
              <div className="text-[9px] text-text-faint mt-1.5 uppercase tracking-[0.1em] font-semibold">{s.label}</div>
            </div>
          ))}
          {canEdit && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-2.5 rounded-xl bg-transparent text-error/80 border border-error/20 cursor-pointer text-[11px] font-bold font-sans transition-all duration-200 hover:bg-error-dim hover:border-error/40 hover:text-error active:scale-[0.97] min-w-[96px]"
              title="Delete Customer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

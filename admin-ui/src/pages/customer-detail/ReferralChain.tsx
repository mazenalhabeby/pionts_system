import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, getInitial } from '@pionts/shared';

interface ChainPerson {
  id: number | string;
  name?: string;
  email?: string;
}

interface ReferralChainProps {
  customer: {
    name?: string;
    email?: string;
  };
  referredByCustomer?: ChainPerson | null;
  grandparent?: ChainPerson | null;
}

const LEVEL_STYLES = [
  { gradient: 'from-accent to-[#ff6a3d]', glow: '0 0 18px rgba(255, 60, 0, 0.25)', border: 'border-accent/20', bg: 'bg-accent/5' },
  { gradient: 'from-[#0ea5e9] to-[#38bdf8]', glow: '0 0 18px rgba(14, 165, 233, 0.25)', border: 'border-[#0ea5e9]/20', bg: 'bg-[#0ea5e9]/5' },
  { gradient: 'from-[#6366f1] to-[#818cf8]', glow: '0 0 18px rgba(99, 102, 241, 0.2)', border: 'border-[#6366f1]/20', bg: 'bg-[#6366f1]/5' },
];

function ChainNode({ person, label, level, clickable, onClick }: {
  person: { name?: string; email?: string };
  label: string;
  level: number;
  clickable?: boolean;
  onClick?: () => void;
}) {
  const style = LEVEL_STYLES[level] || LEVEL_STYLES[0];
  return (
    <div
      className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl border ${style.border} ${style.bg} transition-all duration-200 ${clickable ? 'cursor-pointer hover:brightness-110' : ''} max-sm:px-3 max-sm:py-2.5`}
      onClick={onClick}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-extrabold text-white shrink-0 bg-linear-to-br ${style.gradient} max-sm:w-8 max-sm:h-8 max-sm:text-[12px]`}
        style={{ boxShadow: style.glow }}
      >
        {getInitial(person.name, person.email)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">{person.name || person.email}</div>
        <div className="text-[11px] text-text-faint font-medium">{label}</div>
      </div>
      {clickable && <ArrowRightIcon size={14} className="text-text-faint shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />}
    </div>
  );
}

function ChainConnector({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center py-0.5">
      <div className="w-px h-4 bg-linear-to-b from-border-default to-text-faint/30" />
      <div className="text-[9px] text-text-faint font-semibold uppercase tracking-[0.15em] py-0.5">{text}</div>
    </div>
  );
}

export default function ReferralChain({ customer, referredByCustomer, grandparent }: ReferralChainProps) {
  const navigate = useNavigate();

  if (!referredByCustomer && !grandparent) {
    return <div className="text-center px-4 py-8 text-[13px] text-text-muted">This customer is a top-level referrer — not referred by anyone.</div>;
  }

  return (
    <div className="flex flex-col">
      <ChainNode person={customer} label="This customer" level={0} />

      {referredByCustomer && (
        <>
          <ChainConnector text="referred by" />
          <ChainNode
            person={referredByCustomer}
            label="Referrer (L2)"
            level={1}
            clickable
            onClick={() => navigate(`/customer/${referredByCustomer.id}`)}
          />
        </>
      )}

      {grandparent && (
        <>
          <ChainConnector text="referred by" />
          <ChainNode
            person={grandparent}
            label="Grand-Referrer (L3)"
            level={2}
            clickable
            onClick={() => navigate(`/customer/${grandparent.id}`)}
          />
        </>
      )}
    </div>
  );
}

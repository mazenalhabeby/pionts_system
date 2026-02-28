import { Link } from 'react-router-dom';
import { formatDate, timeAgo } from '@pionts/shared';

interface CustomerProfileProps {
  customer: {
    referral_code?: string;
    referred_by?: string;
    created_at?: string;
    last_activity?: string;
    shopify_customer_id?: string;
  };
  referredByCustomer?: {
    id: number | string;
    name?: string;
    email?: string;
  } | null;
}

interface InfoCellProps {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}

function InfoCell({ label, children, mono }: InfoCellProps) {
  return (
    <div className="flex-1 text-center px-4 py-4 max-md:flex-[0_0_33.33%] max-md:px-2 max-md:py-3 max-sm:flex-[0_0_50%]">
      <div className="text-[10px] text-text-faint uppercase tracking-[0.1em] font-semibold mb-1.5">{label}</div>
      <div className={`text-[13px] font-semibold text-text-primary ${mono ? 'font-mono tracking-wide' : ''}`}>{children}</div>
    </div>
  );
}

function Divider() {
  return <div className="w-px self-stretch my-3 bg-border-default/60 shrink-0 max-md:hidden" />;
}

export default function CustomerProfile({ customer, referredByCustomer }: CustomerProfileProps) {
  return (
    <div className="bg-bg-card border border-border-default rounded-xl flex items-center overflow-hidden transition-colors duration-200 max-md:flex-wrap">
      <InfoCell label="Referral Code" mono>{customer.referral_code || '--'}</InfoCell>
      <Divider />
      <InfoCell label="Referred By">
        {referredByCustomer ? (
          <Link to={`/customer/${referredByCustomer.id}`} className="text-primary no-underline hover:underline transition-colors">
            {referredByCustomer.name || referredByCustomer.email}
          </Link>
        ) : (
          <span className="text-text-faint">{customer.referred_by || '--'}</span>
        )}
      </InfoCell>
      <Divider />
      <InfoCell label="Joined">{formatDate(customer.created_at)}</InfoCell>
      <Divider />
      <InfoCell label="Last Active">{customer.last_activity ? timeAgo(customer.last_activity) : '--'}</InfoCell>
      {customer.shopify_customer_id && (
        <>
          <Divider />
          <InfoCell label="Shopify ID" mono>{customer.shopify_customer_id}</InfoCell>
        </>
      )}
    </div>
  );
}

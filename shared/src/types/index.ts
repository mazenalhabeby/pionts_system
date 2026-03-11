// ─── Customer ───
export interface Customer {
  id: number | string;
  email: string;
  name?: string;
  referral_code: string;
  referred_by?: string;
  points_balance: number;
  points_earned_total: number;
  order_count: number;
  signup_rewarded: boolean;
  first_order_rewarded: boolean;
  followed_tiktok: boolean;
  followed_instagram: boolean;
  birthday?: string;
  birthday_rewarded_year?: number;
  created_at: string;
  last_activity?: string;
  external_customer_id?: string;
  shopify_customer_id?: string;
  is_partner?: boolean;
  partner_commission_pct?: number;
  partner_credit_balance?: number;
}

// ─── Points Log ───
export interface PointsLogEntry {
  id: number | string;
  points: number;
  type: string;
  description: string;
  order_id?: string;
  created_at: string;
  customer_id?: number | string;
  name?: string;
  email?: string;
}

// ─── Referral ───
export interface ReferralStats {
  direct: number;
  network: number;
}

export interface ReferralNode {
  id: number | string;
  name?: string;
  email?: string;
  referral_code: string;
  order_count?: number;
  points_balance?: number;
  last_activity?: string;
  created_at?: string;
  children?: ReferralNode[];
}

export interface ReferralData {
  referral_code: string;
  referral_link?: string;
  stats?: ReferralStats;
  direct_referrals: ReferralNode[];
  downline_tree: ReferralNode[];
  total_referral_earnings?: number;
}

// ─── Redemption ───
export interface RedemptionTier {
  id?: number;
  points: number;
  discount: number;
  sort_order?: number;
}

export interface Redemption {
  id: number | string;
  points_spent: number;
  discount_amount: number;
  discount_code: string;
  used: boolean;
  created_at: string;
}

// ─── Earn Actions ───
export interface EarnAction {
  id: number;
  slug: string;
  label: string;
  points: number;
  points_mode?: 'flat' | 'per_amount';
  category: 'predefined' | 'social_follow' | 'custom';
  frequency: 'one_time' | 'repeatable' | 'yearly';
  enabled: boolean;
  social_url?: string;
  sort_order: number;
  completed?: boolean;
}

// ─── Referral Levels ───
export interface ReferralLevelConfig {
  id?: number;
  level: number;
  points: number;
}

// ─── Enabled Modules ───
export interface EnabledModules {
  points: boolean;
  referrals: boolean;
  partners: boolean;
}

// ─── Partner Info ───
export interface PartnerInfo {
  commission_pct: number;
  credit_balance: number;
  total_earned: number;
  total_orders: number;
}

export interface PartnerListItem {
  id: number;
  name?: string;
  email: string;
  commission_pct: number;
  credit_balance: number;
  total_earned: number;
  total_orders: number;
  created_at: string;
}

export interface PartnerEarning {
  id: number;
  order_id: string;
  order_total: number;
  commission_pct: number;
  amount_earned: number;
  reward_type: 'points' | 'credit';
  created_at: string;
  customer?: { id: number; name?: string; email: string };
}

// ─── Customer Data (combined response) ───
export interface CustomerData extends Customer {
  history?: PointsLogEntry[];
  redemption_tiers?: RedemptionTier[];
  redemption_stats?: {
    total_redeemed?: number;
    unused_codes?: number;
  };
  referral_stats?: ReferralStats;
  referral_earnings?: number;
  settings?: Record<string, string>;
  enabled_modules?: EnabledModules;
  earn_actions?: EarnAction[];
  completed_actions?: string[];
  referral_levels?: ReferralLevelConfig[];
  partner_info?: PartnerInfo | null;
  pending_social_claims?: { slug: string; initiated_at: string }[];
}

// ─── Project Settings ───
export interface ProjectSettings {
  referral_base_url?: string;
  social_tiktok_url?: string;
  social_instagram_url?: string;
  widget_primary_color?: string;
  widget_bg_color?: string;
  widget_text_color?: string;
  widget_brand_name?: string;
  level_labels?: string[];
  level_earn?: string[];
  [key: string]: unknown;
}

// ─── Nav Item ───
export interface NavItem {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
  requiresModule?: 'points' | 'referrals' | 'partners';
}

// ─── Analytics ───
export interface PointsEconomyBucket {
  bucket: string;
  issued: number;
  redeemed: number;
}

export interface ReferralFunnelData {
  totalCustomers: number;
  referredSignups: number;
  referredPurchasers: number;
}

export interface CustomerSegments {
  active: number;
  at_risk: number;
  churned: number;
}

// ─── RBAC ───
export type OrgRole = 'owner' | 'member';
export type ProjectRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  role: ProjectRole;
  createdAt: string;
  user: {
    id: number;
    email: string;
    name?: string;
    role: OrgRole;
  };
}

export interface ProjectMembership {
  projectId: number;
  role: ProjectRole;
}

// ─── Icon Props ───
export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

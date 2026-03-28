import type {
  Customer, PointsLogEntry, PointsEconomyBucket,
  ReferralFunnelData, CustomerSegments, ReferralNode,
  EarnAction, RedemptionTier, ReferralLevelConfig,
  PartnerListItem, PartnerEarning,
} from './index';

export interface DashboardStatsResponse {
  stats: {
    totalCustomers: number;
    totalOrders: number;
    totalPoints: number;
    totalRedeemed: number;
  };
  recentActivity: PointsLogEntry[];
  topReferrers: Array<{
    id: number;
    name?: string;
    email: string;
    direct: number;
    network: number;
    points_earned_total: number;
  }>;
}

export interface CustomerListResponse {
  customers: Customer[];
  total: number;
}

export interface CustomerDetailResponse {
  customer: Customer & { id: number };
  history: PointsLogEntry[];
  referralStats: { direct: number; network: number };
  directReferrals: Array<{ id: number; name?: string; email: string; points_earned_total?: number; created_at?: string }>;
  referredByCustomer?: { id: number; name?: string; email?: string } | null;
  grandparent?: { id: number; name?: string; email?: string } | null;
}

export interface PointsEconomyResponse {
  buckets: PointsEconomyBucket[];
}

export interface ReferralFunnelResponse extends ReferralFunnelData {}

export interface ReferralTreeResponse {
  trees: ReferralNode[];
  totalChains: number;
  totalMembers: number;
}

export interface SegmentCustomersResponse {
  customers: Customer[];
  total: number;
}

export interface AuthLoginResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    name?: string;
    role: string;
    orgId: number;
    isSuperAdmin?: boolean;
    projectMemberships?: Array<{ projectId: number; role: string }>;
  };
  org?: { id: number; name: string; slug: string } | null;
  orgs?: Array<{ id: number; name: string; slug: string; role: string }>;
  project?: { id: number; name: string };
  apiKeys?: { publicKey: string; secretKey: string };
  role?: string;
}

export interface AuthMeResponse {
  id: number;
  email: string;
  name?: string;
  role: string;
  orgId: number;
  isSuperAdmin?: boolean;
  org?: { id: number; name: string; slug: string } | null;
  orgs?: Array<{ id: number; name: string; slug: string; role: string }>;
  projectMemberships?: Array<{ projectId: number; role: string }>;
}

export interface ProjectResponse {
  id: number;
  name: string;
  domain?: string;
  platform?: string;
  status: string;
  pointsEnabled?: boolean;
  referralsEnabled?: boolean;
  partnersEnabled?: boolean;
  createdAt?: string;
  customerCount?: number;
  keyCount?: number;
  projectRole?: string;
}

export interface ProjectCreateResponse {
  project: ProjectResponse;
  apiKeys: { publicKey: string; secretKey: string };
}

export interface ApiKeyResponse {
  id: number;
  type: string;
  keyPrefix: string;
  label: string;
  createdAt: string;
  lastUsedAt?: string;
  revoked: boolean;
}

export interface BillingSubscriptionResponse {
  plan: string;
  label: string;
  priceMonthly: number;
  limits: {
    maxProjects: number | null;
    maxCustomersPerProject: number | null;
  };
  usage: {
    projectCount?: number;
    maxCustomersInProject?: number;
    customers?: number;
    customersLimit?: number;
    apiCalls?: number;
    apiCallsLimit?: number;
  };
  stripeConfigured: boolean;
  currentPeriodEnd?: string | null;
  status: string;
}

/** Settings endpoint returns settings + defaults */
export interface SettingsResponse {
  settings: Record<string, string>;
  defaults?: Record<string, string>;
}

// Re-export types that are already in the main types/index.ts
export type {
  EarnAction,
  RedemptionTier,
  ReferralLevelConfig,
  CustomerSegments,
  PartnerListItem,
  PartnerEarning,
};

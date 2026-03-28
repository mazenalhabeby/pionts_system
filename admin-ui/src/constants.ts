import type { NavItem } from '@pionts/shared';

/* ── Chart helpers ── */
export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const fmtK = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v));
export const fmtDate = (d: string) => { const dt = new Date(d); return `${MONTHS[dt.getMonth()]} ${dt.getDate()}`; };

// minRole: minimum project role required to see the nav item
// undefined = visible to all authenticated users
export interface AppNavItem extends NavItem {
  minRole?: 'viewer' | 'editor' | 'admin';
}

export const NAV_ITEMS_NO_PROJECT: AppNavItem[] = [
  { path: '/', label: 'Projects', exact: true, icon: 'dashboard' },
  { path: '/customers', label: 'Customers', icon: 'users' },
  { path: '/referrals', label: 'Referrals', icon: 'gift' },
  { path: '/analytics', label: 'Analytics', icon: 'chart' },
];

export const NAV_ITEMS_PROJECT: AppNavItem[] = [
  { path: '/', label: 'Overview', exact: true, icon: 'home' },
  { path: '/customers', label: 'Customers', icon: 'users' },
  { path: '/points', label: 'Points', icon: 'star', requiresModule: 'points' },
  { path: '/referrals', label: 'Referrals', icon: 'gift', requiresModule: 'referrals' },
  { path: '/partners', label: 'Partners', icon: 'users', requiresModule: 'partners' },
  { path: '/analytics', label: 'Analytics', icon: 'chart' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

export interface SecondaryNavItem {
  path: string;
  label: string;
  icon: string;
  minRole?: 'viewer' | 'editor' | 'admin';
  ownerOnly?: boolean;
}

export const PLATFORM_NAV: SecondaryNavItem[] = [
  { path: '/platform', label: 'Dashboard', icon: 'dashboard' },
  { path: '/platform/orgs', label: 'Organizations', icon: 'building' },
  { path: '/platform/users', label: 'Users', icon: 'users' },
];

export const SECONDARY_NAV: SecondaryNavItem[] = [
  { path: '/api-keys', label: 'API Keys', icon: 'key', minRole: 'admin' },
  { path: '/guides', label: 'Guides', icon: 'book' },
  { path: '/billing', label: 'Billing', icon: 'creditcard', ownerOnly: true },
  { path: '/org', label: 'Organization', icon: 'building', ownerOnly: true },
];

export interface ColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
}

export const CUSTOMER_COLUMNS: ColumnDef[] = [
  { key: 'email', label: 'Email' },
  { key: 'name', label: 'Name' },
  { key: 'points_balance', label: 'Balance', sortable: true },
  { key: 'points_earned_total', label: 'Earned', sortable: true },
  { key: 'order_count', label: 'Orders', sortable: true },
  { key: 'referral_code', label: 'Ref Code' },
];

export interface SettingField {
  key: string;
  label: string;
  type?: 'number' | 'text' | 'select' | 'toggle';
  options?: { value: string; label: string }[];
}

export interface SettingGroup {
  title: string;
  fields: SettingField[];
}


import type { NavItem } from '@pionts/shared';

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

// Settings groups — only contains settings that remain in the Settings table.
// Earn actions, redemption tiers, and referral levels are now managed via
// their own CRUD endpoints and displayed in the tabbed Settings page.
export const SETTING_GROUPS: SettingGroup[] = [
  {
    title: 'Anti-Abuse',
    fields: [
      { key: 'min_order_referral', label: 'Min order for referral (EUR)' },
      { key: 'max_direct_referrals', label: 'Max direct referrals' },
      { key: 'points_expiry_months', label: 'Points expiry (months)' },
      { key: 'referral_discount_percent', label: 'New customer discount (%)' },
    ],
  },
  {
    title: 'Partner Program',
    fields: [
      {
        key: 'partner_reward_type',
        label: 'Partner reward type',
        type: 'select',
        options: [
          { value: 'points', label: 'Points' },
          { value: 'credit', label: 'Store Credit' },
        ],
      },
    ],
  },
  {
    title: 'Gamification',
    fields: [
      { key: 'gamification_enabled', label: 'Enable tiers', type: 'toggle' },
      { key: 'tier_bronze_label', label: 'Bronze tier name', type: 'text' },
      { key: 'tier_bronze_threshold', label: 'Bronze threshold (pts)' },
      { key: 'tier_bronze_multiplier', label: 'Bronze multiplier', type: 'text' },
      { key: 'tier_silver_label', label: 'Silver tier name', type: 'text' },
      { key: 'tier_silver_threshold', label: 'Silver threshold (pts)' },
      { key: 'tier_silver_multiplier', label: 'Silver multiplier', type: 'text' },
      { key: 'tier_gold_label', label: 'Gold tier name', type: 'text' },
      { key: 'tier_gold_threshold', label: 'Gold threshold (pts)' },
      { key: 'tier_gold_multiplier', label: 'Gold multiplier', type: 'text' },
      { key: 'leaderboard_enabled', label: 'Show leaderboard', type: 'toggle' },
    ],
  },
  {
    title: 'Widget Appearance',
    fields: [
      { key: 'widget_primary_color', label: 'Primary color', type: 'text' },
      { key: 'widget_bg_color', label: 'Background color', type: 'text' },
      { key: 'widget_text_color', label: 'Text color', type: 'text' },
      { key: 'widget_brand_name', label: 'Brand name', type: 'text' },
      { key: 'social_tiktok_url', label: 'TikTok URL', type: 'text' },
      { key: 'social_instagram_url', label: 'Instagram URL', type: 'text' },
      { key: 'referral_base_url', label: 'Referral base URL', type: 'text' },
    ],
  },
  {
    title: 'Email Notifications',
    fields: [
      {
        key: 'email_notification_mode',
        label: 'Points earned emails',
        type: 'select',
        options: [
          { value: 'off', label: 'Off' },
          { value: 'instant', label: 'Instant' },
          { value: 'digest', label: 'Daily Digest' },
        ],
      },
      { key: 'email_welcome_enabled', label: 'Welcome email', type: 'toggle' },
      { key: 'email_referral_enabled', label: 'Referral notifications', type: 'toggle' },
      { key: 'email_from_name', label: 'Sender name', type: 'text' },
    ],
  },
];

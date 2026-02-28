import type { NavItem } from '@pionts/shared';

export const SOCIAL_URLS = {
  tiktok: 'https://www.tiktok.com/@8bc.store',
  instagram: 'https://www.instagram.com/8bc.store',
};

export const STORE_URL = 'https://8bc.store';

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: 'home', exact: true },
  { path: '/referrals', label: 'Referrals', icon: 'users' },
  { path: '/redeem', label: 'Redeem', icon: 'gift' },
  { path: '/earn', label: 'Earn', icon: 'star' },
];

export const LEVEL_LABELS = ['Level 1', 'Level 2', 'Level 3'];
export const LEVEL_EARN = ['earns you 5 pts/order', 'earns you 2 pts/order', ''];

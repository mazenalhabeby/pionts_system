import type { IconProps } from '@pionts/shared';
import {
  HomeIcon, UsersIcon, GiftIcon, SettingsIcon, ChartIcon,
  KeyIcon, BookIcon, CreditCardIcon, BuildingIcon,
  DashboardIcon, StarIcon,
} from '@pionts/shared';

export const PRIMARY_ICON_MAP: Record<string, React.ComponentType<IconProps>> = {
  home: HomeIcon,
  dashboard: DashboardIcon,
  users: UsersIcon,
  gift: GiftIcon,
  star: StarIcon,
  settings: SettingsIcon,
  chart: ChartIcon,
};

export const SECONDARY_ICON_MAP: Record<string, React.ComponentType<IconProps>> = {
  key: KeyIcon,
  book: BookIcon,
  creditcard: CreditCardIcon,
  building: BuildingIcon,
};

export const SIDEBAR_KEY = 'pionts-sidebar-open';
export const SIDEBAR_OPEN_W = 260;
export const SIDEBAR_CLOSED_W = 60;

export const ROLE_LEVEL: Record<string, number> = { viewer: 1, editor: 2, admin: 3 };

export function hasMinRole(userRole: string | null, minRole?: string): boolean {
  if (!minRole) return true;
  if (!userRole) return false;
  return (ROLE_LEVEL[userRole] ?? 0) >= (ROLE_LEVEL[minRole] ?? 0);
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'Overview',
  '/customers': 'Customers',
  '/referrals': 'Referrals',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
  '/points': 'Points',
  '/partners': 'Partners',
  '/api-keys': 'API Keys',
  '/guides': 'Guides',
  '/billing': 'Billing',
  '/org': 'Organization',
  '/projects': 'Projects',
  '/projects/new': 'New Project',
};

export function getPageTitle(pathname: string, hasProject: boolean): string {
  if (PAGE_TITLES[pathname]) {
    if (pathname === '/' && !hasProject) return 'Overview';
    return PAGE_TITLES[pathname];
  }
  if (pathname.startsWith('/customer/')) return 'Customer Detail';
  if (pathname.startsWith('/guides/')) return 'Guides';
  return '';
}

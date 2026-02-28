import React from 'react';
import { NavLink } from 'react-router-dom';
import { useWidgetConfig } from '../context/WidgetConfigContext';
import { NAV_ITEMS } from '../constants';
import { HomeIcon, UsersIcon, GiftIcon, StarIcon, LogOutIcon } from '@pionts/shared';
import type { IconProps } from '@pionts/shared';

const NAV_ICONS: Record<string, React.ComponentType<IconProps>> = {
  home: HomeIcon,
  users: UsersIcon,
  gift: GiftIcon,
  star: StarIcon,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout, settings } = useWidgetConfig();
  const brandName = settings?.widget_brand_name || '8BC CREW';
  const parts = brandName.split(' ');
  const mark = parts[0] || '';
  const text = parts.slice(1).join(' ') || '';

  return (
    <div>
      <nav className="bg-white border-b border-black/[0.06] px-6 flex items-center h-[60px] sticky top-0 z-[100] shadow-[0_1px_3px_rgba(0,0,0,0.04)] max-[600px]:px-4 max-[600px]:h-14">
        <div className="flex items-center gap-1.5 mr-2 shrink-0">
          <span className="nav-brand-mark-bg text-white font-extrabold text-[13px] tracking-[0.5px] px-2 py-1 rounded-md leading-none">{mark}</span>
          {text && <span className="font-bold text-[15px] text-[#1a1a1a] tracking-[1px] max-[600px]:hidden">{text}</span>}
        </div>
        <div className="flex items-center gap-0.5 ml-4 h-full max-[600px]:ml-2 max-[600px]:gap-0">
          {NAV_ITEMS.map((item) => {
            const IconComp = NAV_ICONS[item.icon];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact || false}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 relative whitespace-nowrap no-underline max-[600px]:px-2.5 max-[600px]:py-1.5 max-[600px]:text-xs max-[600px]:gap-1 ${
                    isActive
                      ? 'text-primary bg-[#fff5f2] font-semibold hover:text-primary hover:bg-[#fff0eb] [&_svg]:opacity-100'
                      : 'text-[#888] hover:text-[#555] hover:bg-bg [&_svg]:opacity-70'
                  }`
                }
              >
                {IconComp && <IconComp size={16} />}
                <span className="max-[600px]:hidden">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
        <button
          className="ml-auto flex items-center gap-1.5 bg-transparent border border-[#eee] text-[#999] px-3.5 py-[7px] rounded-lg cursor-pointer text-[13px] font-medium font-sans transition-all duration-200 shrink-0 hover:text-[#e53e3e] hover:border-[#fed7d7] hover:bg-[#fff5f5] max-[600px]:px-2.5 max-[600px]:py-[7px]"
          onClick={logout}
          type="button"
        >
          <LogOutIcon size={15} />
          <span className="max-[600px]:hidden">Logout</span>
        </button>
      </nav>
      <div className="max-w-[800px] mx-auto p-6 max-[600px]:p-4">{children}</div>
    </div>
  );
}

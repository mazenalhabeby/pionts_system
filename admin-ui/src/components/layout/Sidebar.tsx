import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useProject } from "../../context/ProjectContext";
import { useTheme } from "../../context/ThemeContext";
import {
  SettingsIcon,
  LogOutIcon,
  SidebarToggleIcon,
  MonitorIcon,
  SunIcon,
  MoonIcon,
  BookIcon,
  CreditCardIcon,
  BuildingIcon,
} from "@pionts/shared";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  PRIMARY_ICON_MAP,
  SECONDARY_ICON_MAP,
  SIDEBAR_OPEN_W,
} from "./constants";
import ProjectFavicon from "./ProjectFavicon";
import type { AppNavItem, SecondaryNavItem } from "../../constants";

interface SidebarProps {
  collapsed: boolean;
  setOpen: (v: boolean) => void;
  setMobileOpen: (v: boolean) => void;
  visibleNavItems: AppNavItem[];
  visibleSecondaryNav: SecondaryNavItem[];
}

export default function Sidebar({
  collapsed,
  setOpen,
  setMobileOpen,
  visibleNavItems,
  visibleSecondaryNav,
}: SidebarProps) {
  const { user, org, orgs, logout, switchOrg } = useAuth();
  const { currentProject } = useProject();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const isOwner = user?.role === "owner";
  const userInitials = (user?.name || user?.email || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col h-full" style={{ width: SIDEBAR_OPEN_W }}>
      {/* Header */}
      <div className="h-14 shrink-0 px-3 border-b border-border-default flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 px-1 min-w-0 flex-1">
            {/* Logo — hover reveals sidebar toggle when collapsed */}
            {collapsed ? (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="group/logo shrink-0 bg-transparent border-none cursor-pointer p-0"
                title="Open sidebar"
              >
                <span className="bg-linear-to-br from-accent to-[#ff6a00] text-white font-extrabold text-[13px] tracking-wide rounded-md leading-none flex items-center justify-center w-7.5 h-7">
                  <span className="group-hover/logo:hidden">P</span>
                  <span className="hidden group-hover/logo:block text-white">
                    <SidebarToggleIcon size={15} />
                  </span>
                </span>
              </button>
            ) : (
              <span className="bg-linear-to-br from-accent to-[#ff6a00] text-white font-extrabold text-[13px] tracking-wide px-2 py-1 rounded-md leading-none shrink-0">
                P
              </span>
            )}

            {/* Org name + role badge — fades */}
            <div
              className={`flex items-center gap-1.5 min-w-0 flex-1 whitespace-nowrap transition-opacity duration-200 ${collapsed ? "opacity-0" : "opacity-100"}`}
            >
              {orgs.length > 1 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 min-w-0 bg-transparent border-none cursor-pointer p-0 font-sans"
                      title="Switch organization"
                    >
                      <span className="font-semibold text-[13px] text-text-primary truncate">
                        {org?.name || "Pionts"}
                      </span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-text-faint shrink-0"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="bottom"
                    align="start"
                    sideOffset={4}
                    className="w-50"
                  >
                    {orgs.map((o) => (
                      <DropdownMenuItem
                        key={String(o.id)}
                        onSelect={() => {
                          if (o.id !== org?.id) switchOrg(Number(o.id));
                        }}
                      >
                        <span className="flex-1 truncate">{o.name}</span>
                        {o.id === org?.id && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-accent shrink-0"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span className="font-semibold text-[13px] text-text-primary truncate">
                  {org?.name || "Pionts"}
                </span>
              )}
              {user?.role && (
                <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-text-faint/15 text-text-muted shrink-0">
                  {user.role === "owner" ? "Pro" : user.role}
                </span>
              )}
            </div>
          </div>

          {/* Close button — only visible when open */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={`w-8 h-8 rounded-md flex items-center justify-center text-text-faint hover:text-text-secondary hover:bg-sidebar-hover transition-all duration-200 bg-transparent border-none cursor-pointer shrink-0 max-md:hidden ${collapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            title="Close sidebar"
          >
            <SidebarToggleIcon size={18} />
          </button>
        </div>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 overflow-y-auto px-2 pt-3">
        <div
          className={`text-[10px] font-semibold uppercase tracking-wider text-text-faint px-3 mb-1.5 whitespace-nowrap transition-opacity duration-200 ${collapsed ? "opacity-0" : "opacity-100"}`}
        >
          {currentProject ? currentProject.name : "Navigation"}
        </div>
        <div className="flex flex-col gap-0.5">
          {visibleNavItems.map((item) => {
            const IconComponent = PRIMARY_ICON_MAP[item.icon];
            const useProjectIcon =
              item.path === "/" && item.exact && currentProject;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact || false}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 no-underline [&_svg]:shrink-0 ${
                    isActive
                      ? "bg-sidebar-active text-text-primary [&_svg]:opacity-100"
                      : "text-text-muted hover:bg-sidebar-hover hover:text-text-secondary hover:no-underline [&_svg]:opacity-60"
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                {useProjectIcon ? (
                  <ProjectFavicon
                    domain={currentProject.domain}
                    name={currentProject.name}
                    size={18}
                  />
                ) : (
                  IconComponent && <IconComponent size={18} />
                )}
                <span
                  className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? "opacity-0" : "opacity-100"}`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-px bg-border-default my-3 mx-1" />

        {/* Secondary Nav */}
        <div
          className={`text-[10px] font-semibold uppercase tracking-wider text-text-faint px-3 mb-1.5 whitespace-nowrap transition-opacity duration-200 ${collapsed ? "opacity-0" : "opacity-100"}`}
        >
          General
        </div>
        <div className="flex flex-col gap-0.5">
          {visibleSecondaryNav.map((item) => {
            const IconComponent = SECONDARY_ICON_MAP[item.icon];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 no-underline [&_svg]:shrink-0 ${
                    isActive
                      ? "bg-sidebar-active text-text-primary [&_svg]:opacity-100"
                      : "text-text-muted hover:bg-sidebar-hover hover:text-text-secondary hover:no-underline [&_svg]:opacity-60"
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                {IconComponent && <IconComponent size={18} />}
                <span
                  className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? "opacity-0" : "opacity-100"}`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Bottom: User area */}
      <div className="border-t border-border-default px-2 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-left bg-transparent border-none cursor-pointer font-sans transition-colors duration-150 hover:bg-sidebar-hover group outline-none data-[state=open]:bg-sidebar-hover"
              title={
                collapsed ? user?.name || user?.email || "User" : undefined
              }
            >
              <div className="w-8 h-8 rounded-full bg-[#4ade80] text-black flex items-center justify-center text-xs font-bold tracking-tight shrink-0">
                {userInitials}
              </div>
              <div
                className={`flex-1 min-w-0 whitespace-nowrap transition-opacity duration-200 ${collapsed ? "opacity-0" : "opacity-100"}`}
              >
                <div className="text-[13px] font-medium text-text-primary truncate">
                  {user?.name || user?.email}
                </div>
                <div className="text-[11px] text-text-faint">Free</div>
              </div>
              <span
                className={`text-[11px] font-medium text-text-muted border border-border-default rounded-full px-2.5 py-0.5 shrink-0 hover:bg-bg-surface-hover hover:text-text-secondary transition-opacity duration-200 ${collapsed ? "opacity-0" : "opacity-100"}`}
              >
                Upgrade
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-60"
          >
            {/* Header: user info + settings gear */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-text-primary truncate">
                  {user?.name || user?.email?.split("@")[0]}
                </div>
                <div className="text-[12px] text-text-muted truncate">
                  {user?.email}
                </div>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-md flex items-center justify-center text-text-faint hover:text-text-secondary hover:bg-sidebar-hover transition-colors bg-transparent border-none cursor-pointer shrink-0"
                onClick={() => {
                  setMobileOpen(false);
                  navigate("/settings");
                }}
              >
                <SettingsIcon size={16} />
              </button>
            </div>
            <DropdownMenuSeparator />

            {/* Theme toggle */}
            <div className="flex items-center px-3 py-2">
              <span className="flex-1 text-[13px] font-medium text-text-secondary">
                Theme
              </span>
              <div className="flex items-center bg-bg-surface rounded-lg border border-border-default p-0.5">
                {[
                  {
                    value: "system" as const,
                    icon: MonitorIcon,
                    label: "System",
                  },
                  { value: "light" as const, icon: SunIcon, label: "Light" },
                  { value: "dark" as const, icon: MoonIcon, label: "Dark" },
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors bg-transparent border-none cursor-pointer ${
                      theme === value
                        ? "bg-bg-surface-raised text-text-primary shadow-sm"
                        : "text-text-faint hover:text-text-secondary"
                    }`}
                    title={label}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>

            <DropdownMenuItem
              onSelect={() => {
                setMobileOpen(false);
                navigate("/settings");
              }}
            >
              <span className="flex-1">Settings</span>
              <SettingsIcon size={16} />
            </DropdownMenuItem>
            {isOwner && (
              <DropdownMenuItem
                onSelect={() => {
                  setMobileOpen(false);
                  navigate("/org");
                }}
              >
                <span className="flex-1">Organization</span>
                <BuildingIcon size={16} />
              </DropdownMenuItem>
            )}
            {isOwner && (
              <DropdownMenuItem
                onSelect={() => {
                  setMobileOpen(false);
                  navigate("/billing");
                }}
              >
                <span className="flex-1">Billing</span>
                <CreditCardIcon size={16} />
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onSelect={() => {
                setMobileOpen(false);
                navigate("/guides");
              }}
            >
              <span className="flex-1">Guides</span>
              <BookIcon size={16} />
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => logout()}>
              <span className="flex-1">Log Out</span>
              <LogOutIcon size={16} />
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Upgrade to Pro CTA */}
            <div className="px-1 py-1">
              <button
                type="button"
                className="w-full py-2 rounded-md text-[13px] font-semibold text-bg-page bg-text-primary cursor-pointer border-none font-sans transition-colors hover:bg-text-secondary"
                onClick={() => {
                  setMobileOpen(false);
                  navigate("/billing");
                }}
              >
                Upgrade to Pro
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

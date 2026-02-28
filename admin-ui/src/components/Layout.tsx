import { type ReactNode, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { NAV_ITEMS_NO_PROJECT, NAV_ITEMS_PROJECT, SECONDARY_NAV, type AppNavItem, type SecondaryNavItem } from '../constants';
import { MenuIcon, SearchIcon, CheckIcon, ChevronsUpDownIcon, PlusIcon } from '@pionts/shared';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { SIDEBAR_KEY, SIDEBAR_OPEN_W, SIDEBAR_CLOSED_W, hasMinRole, getPageTitle } from './layout/constants';
import Sidebar from './layout/Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const { projects, currentProject, currentProjectRole, selectProject } = useProject();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(() => localStorage.getItem(SIDEBAR_KEY) !== 'false');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const pageTitle = getPageTitle(location.pathname, !!currentProject);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(open));
  }, [open]);

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()),
  );

  const isOwner = user?.role === 'owner';

  // Filter nav items based on project selection, role, and enabled modules
  const baseNavItems = currentProject ? NAV_ITEMS_PROJECT : NAV_ITEMS_NO_PROJECT;
  const visibleNavItems = baseNavItems.filter((item: AppNavItem) => {
    if (!hasMinRole(currentProjectRole, item.minRole)) return false;
    if (item.requiresModule && currentProject) {
      const moduleMap: Record<string, boolean | undefined> = {
        points: currentProject.pointsEnabled,
        referrals: currentProject.referralsEnabled,
        partners: currentProject.partnersEnabled,
      };
      if (moduleMap[item.requiresModule] === false) return false;
    }
    return true;
  });
  const visibleSecondaryNav = SECONDARY_NAV.filter((item: SecondaryNavItem) => {
    if (item.ownerOnly && !isOwner) return false;
    return hasMinRole(currentProjectRole, item.minRole);
  });

  return (
    <div className="flex h-screen bg-bg-page">
      {/* Desktop sidebar — full height */}
      <div
        className="shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out hidden md:block"
        style={{ width: open ? SIDEBAR_OPEN_W : SIDEBAR_CLOSED_W }}
      >
        <aside className="h-full bg-sidebar border-r border-border-default flex flex-col">
          <Sidebar
            collapsed={!open}
            setOpen={setOpen}
            setMobileOpen={setMobileOpen}
            visibleNavItems={visibleNavItems}
            visibleSecondaryNav={visibleSecondaryNav}
          />
        </aside>
      </div>

      {/* Mobile hamburger */}
      <button
        type="button"
        className="fixed top-3 left-3 z-[110] flex items-center justify-center w-10 h-10 rounded-lg bg-bg-surface border border-border-default text-text-muted cursor-pointer md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <MenuIcon size={20} />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[99] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer — full height */}
      <aside
        className={`fixed top-0 left-0 h-full bg-sidebar border-r border-border-default z-[100] transition-transform duration-300 ease-in-out md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar
          collapsed={false}
          setOpen={setOpen}
          setMobileOpen={setMobileOpen}
          visibleNavItems={visibleNavItems}
          visibleSecondaryNav={visibleSecondaryNav}
        />
      </aside>

      {/* Right side: header + main */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* ── Top Header Bar ── */}
        <header className="h-14 shrink-0 border-b border-border-default bg-sidebar flex items-center px-4 gap-1.5 z-40 relative">
          {/* Page title — centered */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[13px] font-medium text-text-primary">
              {pageTitle}
            </span>
          </div>

          {/* Project Dropdown */}
          <DropdownMenu onOpenChange={(isOpen) => { if (!isOpen) setProjectSearch(''); }}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-sidebar-hover transition-colors bg-transparent border-none cursor-pointer font-sans outline-none data-[state=open]:bg-sidebar-hover data-[state=open]:text-text-primary"
              >
                <span className="truncate max-w-[180px]">
                  {currentProject?.name || 'All Projects'}
                </span>
                <ChevronsUpDownIcon size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={8}
              className="w-[260px]"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              {/* Search input */}
              <div className="px-2 pb-1 pt-1">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-bg-surface border border-border-default">
                  <SearchIcon size={14} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search projects..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent border-none outline-none text-[13px] text-text-primary placeholder:text-text-faint font-sans"
                    autoFocus
                  />
                </div>
              </div>
              <DropdownMenuSeparator />

              {/* Project list */}
              <div className="max-h-[240px] overflow-y-auto py-1">
                {filteredProjects.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    onSelect={() => {
                      selectProject(p);
                      navigate('/');
                    }}
                  >
                    <span className="flex-1 truncate">{p.name}</span>
                    {currentProject?.id === p.id && (
                      <CheckIcon size={15} />
                    )}
                  </DropdownMenuItem>
                ))}
                {filteredProjects.length === 0 && (
                  <div className="px-3 py-2 text-[12px] text-text-faint">No projects found</div>
                )}
              </div>

              <DropdownMenuSeparator />

              {/* All Projects + Create */}
              <DropdownMenuItem
                onSelect={() => {
                  selectProject(null);
                  navigate('/');
                }}
              >
                All Projects
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => navigate('/projects/new')}
              >
                <PlusIcon size={15} />
                <span>Create Project</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto min-w-0 bg-sidebar">
          <div className="max-w-[1400px] mx-auto px-6 py-6 max-md:pt-16 max-sm:px-4 max-sm:pt-16">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

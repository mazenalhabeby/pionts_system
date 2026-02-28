import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import {
  formatDate, ShopifyIcon, WordPressIcon, CodeIcon, GlobeIcon,
  GridViewIcon, ListViewIcon, SearchIcon, ChevronDownIcon, CheckIcon, PlusIcon,
} from '@pionts/shared';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const STATUS_STYLES: Record<string, string> = {
  active: 'text-success bg-success-dim',
  paused: 'text-warning bg-warning-dim',
  archived: 'text-text-muted bg-bg-surface-raised',
};

const PLATFORM_LABELS: Record<string, string> = {
  shopify: 'Shopify',
  wordpress: 'WordPress',
  custom: 'Custom Code',
  other: 'Other',
};

function PlatformBadge({ platform }: { platform?: string }) {
  const p = platform || 'custom';
  const label = PLATFORM_LABELS[p] || PLATFORM_LABELS.other;
  const iconMap: Record<string, React.ReactNode> = {
    shopify: <ShopifyIcon size={12} />,
    wordpress: <WordPressIcon size={12} />,
    custom: <CodeIcon size={12} />,
    other: <GlobeIcon size={12} />,
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-text-muted px-2 py-0.5 rounded-md border border-border-default bg-bg-surface">
      {iconMap[p] || iconMap.other}
      {label}
    </span>
  );
}

type StatusFilter = 'all' | 'active' | 'paused' | 'archived';
type ViewMode = 'grid' | 'list';

function ProjectAvatar({ name, domain }: { name: string; domain?: string }) {
  const [imgError, setImgError] = useState(false);
  const letter = (name || '?')[0].toUpperCase();
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
    : null;

  if (faviconUrl && !imgError) {
    return (
      <div className="w-10 h-10 rounded-xl bg-bg-surface-raised border border-border-default flex items-center justify-center shrink-0 overflow-hidden">
        <img
          src={faviconUrl}
          alt={name}
          width={24}
          height={24}
          className="object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 border border-border-default flex items-center justify-center text-[15px] font-bold text-text-primary shrink-0">
      {letter}
    </div>
  );
}

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'All Status',
  active: 'Active',
  paused: 'Paused',
  archived: 'Archived',
};

export default function ProjectList() {
  const { projects, selectProject, loading } = useProject();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [view, setView] = useState<ViewMode>('grid');

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.domain || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [projects, search, statusFilter]);

  function handleSelect(project: any) {
    selectProject(project);
    navigate('/');
  }

  if (loading) return <div className="text-center p-10 text-text-muted">Loading projects...</div>;

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar: search + filter + view toggle + add new */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-card border border-border-default flex-1">
          <SearchIcon size={15} />
          <input
            type="text"
            placeholder="Search Projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-text-primary placeholder:text-text-faint font-sans"
          />
        </div>

        {/* Filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border border-border-default bg-bg-card text-text-secondary hover:text-text-primary hover:border-text-faint transition-colors cursor-pointer font-sans outline-none shrink-0"
            >
              {FILTER_LABELS[statusFilter]}
              <ChevronDownIcon size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={6} className="w-[160px]">
            {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((key) => (
              <DropdownMenuItem
                key={key}
                onSelect={() => setStatusFilter(key)}
              >
                <span className="flex-1">{FILTER_LABELS[key]}</span>
                {statusFilter === key && <CheckIcon size={15} />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View toggles */}
        <div className="flex items-center rounded-lg border border-border-default overflow-hidden">
          <button
            type="button"
            onClick={() => setView('grid')}
            className={`w-8 h-8 flex items-center justify-center border-none cursor-pointer transition-colors ${
              view === 'grid'
                ? 'bg-bg-card text-text-primary'
                : 'bg-transparent text-text-faint hover:text-text-secondary'
            }`}
            title="Grid view"
          >
            <GridViewIcon size={15} />
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className={`w-8 h-8 flex items-center justify-center border-none cursor-pointer transition-colors ${
              view === 'list'
                ? 'bg-bg-card text-text-primary'
                : 'bg-transparent text-text-faint hover:text-text-secondary'
            }`}
            title="List view"
          >
            <ListViewIcon size={15} />
          </button>
        </div>

        {/* New Project button */}
        <button
          type="button"
          className="flex items-center gap-1.5 bg-text-primary text-bg-page border-none px-4 py-2 rounded-lg cursor-pointer text-[13px] font-semibold font-sans transition-colors hover:bg-text-secondary"
          onClick={() => navigate('/projects/new')}
        >
          <PlusIcon size={14} />
          New Project
        </button>
      </div>

      {/* Projects label */}
      <div className="text-[13px] font-medium text-text-muted">
        Projects ({filtered.length})
      </div>

      {/* Empty state */}
      {projects.length === 0 ? (
        <div className="bg-bg-card border border-border-default rounded-xl text-center py-12 px-6">
          <div className="text-lg font-bold text-text-secondary mb-2">No projects yet</div>
          <div className="text-sm text-text-muted">Create your first project to get started.</div>
          <button
            className="mt-4 flex items-center gap-1.5 mx-auto bg-text-primary text-bg-page border-none px-5 py-2.5 rounded-lg cursor-pointer text-sm font-semibold font-sans transition-colors hover:bg-text-secondary"
            onClick={() => navigate('/projects/new')}
          >
            <PlusIcon size={15} />
            Create Project
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-bg-card border border-border-default rounded-xl text-center py-12 px-6">
          <div className="text-sm text-text-muted">No projects match your filters.</div>
        </div>
      ) : view === 'grid' ? (
        /* Grid view */
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 max-md:grid-cols-1">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-bg-card border border-border-default rounded-xl p-5 cursor-pointer transition-all duration-200 hover:border-text-faint hover:shadow-[0_4px_24px_rgba(0,0,0,0.12)] group"
              onClick={() => handleSelect(p)}
            >
              <div className="flex items-center gap-3.5 mb-1">
                <ProjectAvatar name={p.name} domain={p.domain} />
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold text-text-primary truncate group-hover:text-accent transition-colors">{p.name}</div>
                  {p.domain && (
                    <div className="text-[12px] text-text-muted truncate mt-0.5">{p.domain}</div>
                  )}
                </div>
              </div>
              <div className="ml-[3.375rem] mb-3">
                <PlatformBadge platform={p.platform} />
              </div>
              <div className="border-t border-border-subtle pt-3 flex items-center gap-3 text-[12px] text-text-muted">
                <span>{p.customerCount || 0} customers</span>
                <span className="w-1 h-1 rounded-full bg-border-default" />
                <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${(p.status && STATUS_STYLES[p.status]) || ''}`}>
                  {p.status}
                </span>
                <span className="ml-auto text-[11px] text-text-faint">{formatDate(p.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden divide-y divide-border-subtle">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-all duration-200 hover:bg-bg-card-hover group"
              onClick={() => handleSelect(p)}
            >
              <ProjectAvatar name={p.name} domain={p.domain} />
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-text-primary truncate group-hover:text-accent transition-colors">{p.name}</div>
                {p.domain && (
                  <div className="text-[12px] text-text-muted truncate mt-0.5">{p.domain}</div>
                )}
              </div>
              <PlatformBadge platform={p.platform} />
              <div className="flex items-center gap-4 text-[12px] text-text-muted shrink-0">
                <span>{p.customerCount || 0} customers</span>
                <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${(p.status && STATUS_STYLES[p.status]) || ''}`}>
                  {p.status}
                </span>
                <span className="text-[11px] text-text-faint">{formatDate(p.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

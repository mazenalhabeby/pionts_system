import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { projectApi } from '../api';
import { useAuth } from './AuthContext';

interface Project {
  id: number;
  name: string;
  domain?: string;
  platform?: string;
  status?: string;
  customerCount?: number;
  createdAt?: string;
  projectRole?: string;
  pointsEnabled?: boolean;
  referralsEnabled?: boolean;
  partnersEnabled?: boolean;
}

interface ProjectContextValue {
  projects: Project[];
  currentProject: Project | null;
  currentProjectRole: string | null;
  isProjectOwner: boolean;
  canEdit: boolean;
  canAdmin: boolean;
  selectProject: (project: Project | null) => void;
  refreshProjects: () => Promise<void>;
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { authenticated, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProjects = useCallback(async () => {
    try {
      const list: Project[] = await projectApi.list();
      setProjects(list);

      // Restore selection from sessionStorage
      const savedId = sessionStorage.getItem('currentProjectId');
      const saved = savedId ? list.find((p) => p.id === parseInt(savedId, 10)) : null;

      if (saved) {
        setCurrentProject(saved);
      } else if (!currentProject || !list.find((p) => p.id === currentProject.id)) {
        setCurrentProject(null);
      }
    } catch {
      // not logged in or error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      refreshProjects();
    } else {
      setProjects([]);
      setCurrentProject(null);
      setLoading(false);
    }
  }, [authenticated, refreshProjects]);

  const selectProject = useCallback((project: Project | null) => {
    setCurrentProject(project);
    if (project) {
      sessionStorage.setItem('currentProjectId', String(project.id));
    } else {
      sessionStorage.removeItem('currentProjectId');
    }
  }, []);

  // Compute current project role — check projectRole from API first, then org-owner fallback
  const currentProjectRole = useMemo(() => {
    if (!currentProject || !user) return null;
    // Explicit project membership role (from list response)
    if (currentProject.projectRole) return currentProject.projectRole;
    // Fallback to memberships from /auth/me
    const membership = user.projectMemberships?.find(
      (m: any) => m.projectId === currentProject.id,
    );
    if (membership?.role) return membership.role;
    // Org owners have implicit admin on projects without explicit membership
    if (user.role === 'owner') return 'admin';
    return null;
  }, [currentProject, user]);

  const isProjectOwner = currentProjectRole === 'owner';
  const canEdit = currentProjectRole === 'editor' || currentProjectRole === 'admin' || currentProjectRole === 'owner';
  const canAdmin = currentProjectRole === 'admin' || currentProjectRole === 'owner';

  const value = useMemo(
    () => ({ projects, currentProject, currentProjectRole, isProjectOwner, canEdit, canAdmin, selectProject, refreshProjects, loading }),
    [projects, currentProject, currentProjectRole, isProjectOwner, canEdit, canAdmin, selectProject, refreshProjects, loading],
  );

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}

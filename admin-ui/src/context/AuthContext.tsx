import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { authApi, setAccessToken } from '../api';

interface ProjectMembership {
  projectId: number;
  role: string;
}

interface User {
  id: number | string;
  email: string;
  name?: string;
  role: string;
  isSuperAdmin?: boolean;
  projectMemberships: ProjectMembership[];
}

interface Org {
  id: number | string;
  name: string;
  slug?: string;
}

export interface OrgWithRole {
  id: number | string;
  name: string;
  slug?: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  org: Org | null;
  orgs: OrgWithRole[];
  loading: boolean;
  authenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (data: { name?: string; email: string; password: string; orgName: string }) => Promise<any>;
  logout: () => Promise<void>;
  switchOrg: (orgId: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [orgs, setOrgs] = useState<OrgWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    // Refresh every 13 minutes (token expires in 15m)
    refreshTimerRef.current = setInterval(async () => {
      const ok = await authApi.refresh();
      if (!ok) {
        setUser(null);
        setOrg(null);
        setOrgs([]);
        setAccessToken(null);
      }
    }, 13 * 60 * 1000);
  }, []);

  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // On mount: try silent refresh
  useEffect(() => {
    (async () => {
      try {
        const ok = await authApi.refresh();
        if (ok) {
          const me = await authApi.me();
          setUser({ id: me.id, email: me.email, name: me.name, role: me.role, isSuperAdmin: me.isSuperAdmin, projectMemberships: me.projectMemberships || [] });
          setOrg(me.org);
          setOrgs(me.orgs || []);
          startRefreshTimer();
        }
      } catch {
        // not logged in
      } finally {
        setLoading(false);
      }
    })();
    return () => stopRefreshTimer();
  }, [startRefreshTimer, stopRefreshTimer]);

  // Listen for auth:unauthorized
  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
      setOrg(null);
      setOrgs([]);
      setAccessToken(null);
      stopRefreshTimer();
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [stopRefreshTimer]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setAccessToken(res.accessToken);
    setUser({ ...res.user, isSuperAdmin: res.user.isSuperAdmin, projectMemberships: res.user.projectMemberships || [] });
    setOrg(res.org);
    setOrgs(res.orgs || []);
    startRefreshTimer();
    return res;
  }, [startRefreshTimer]);

  const signup = useCallback(async (data: { name?: string; email: string; password: string; orgName: string }) => {
    const res = await authApi.register(data);
    setAccessToken(res.accessToken);
    setUser({ ...res.user, projectMemberships: [] });
    setOrg(res.org);
    setOrgs(res.orgs || []);
    startRefreshTimer();
    return res;
  }, [startRefreshTimer]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    setUser(null);
    setOrg(null);
    setOrgs([]);
    setAccessToken(null);
    stopRefreshTimer();
  }, [stopRefreshTimer]);

  const switchOrg = useCallback(async (orgId: number) => {
    const res = await authApi.switchOrg(orgId);
    setAccessToken(res.accessToken);
    setOrg(res.org);
    // Update user role to the role in the new org
    setUser((prev) => prev ? { ...prev, role: res.role, projectMemberships: [] } : null);
    // Clear project selection since we're changing org
    sessionStorage.removeItem('pionts-current-project');
    // Reload the page to reset project context
    window.location.href = '/';
  }, []);

  const authenticated = user !== null;

  const value = useMemo(
    () => ({ user, org, orgs, loading, authenticated, login, signup, logout, switchOrg }),
    [user, org, orgs, loading, authenticated, login, signup, logout, switchOrg],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

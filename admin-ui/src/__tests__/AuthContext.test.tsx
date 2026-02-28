import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

// Mock the api module
vi.mock('../api', () => {
  const mockAuthApi = {
    refresh: vi.fn(),
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  };
  return {
    authApi: mockAuthApi,
    setAccessToken: vi.fn(),
    getErrorMessage: (err: unknown) => err instanceof Error ? err.message : String(err),
  };
});

import { authApi, setAccessToken } from '../api';

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: not logged in (refresh fails)
    (authApi.refresh as ReturnType<typeof vi.fn>).mockResolvedValue(false);
  });

  it('starts with loading=true, then loading=false', async () => {
    function TestComponent() {
      const { loading } = useAuth();
      return <div>{loading ? 'loading' : 'ready'}</div>;
    }
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('loading')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('ready')).toBeInTheDocument();
    });
  });

  it('login() sets user and org on success', async () => {
    (authApi.refresh as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    (authApi.login as ReturnType<typeof vi.fn>).mockResolvedValue({
      accessToken: 'tok123',
      user: { id: '1', email: 'a@b.com', name: 'Alice', role: 'owner' },
      org: { id: 'org1', name: 'TestOrg' },
    });

    const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login('a@b.com', 'pass');
    });

    expect(result.current.user).toEqual({ id: '1', email: 'a@b.com', name: 'Alice', role: 'owner', projectMemberships: [] });
    expect(result.current.org).toEqual({ id: 'org1', name: 'TestOrg' });
    expect(result.current.authenticated).toBe(true);
    expect(setAccessToken).toHaveBeenCalledWith('tok123');
  });

  it('logout() clears user', async () => {
    (authApi.refresh as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (authApi.me as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: '1', email: 'a@b.com', name: 'Alice', role: 'owner',
      org: { id: 'org1', name: 'TestOrg' },
    });
    (authApi.logout as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.authenticated).toBe(true);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.org).toBeNull();
    expect(result.current.authenticated).toBe(false);
    expect(setAccessToken).toHaveBeenCalledWith(null);
  });

  it('useAuth() throws outside AuthProvider', () => {
    function BadComponent() {
      useAuth();
      return null;
    }
    expect(() => render(<BadComponent />)).toThrow(
      'useAuth must be used within AuthProvider'
    );
  });

  it('restores session on mount when refresh succeeds', async () => {
    (authApi.refresh as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (authApi.me as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: '2', email: 'b@c.com', name: 'Bob', role: 'admin',
      org: { id: 'org2', name: 'Org2' },
    });

    const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toEqual({ id: '2', email: 'b@c.com', name: 'Bob', role: 'admin', projectMemberships: [] });
    expect(result.current.org).toEqual({ id: 'org2', name: 'Org2' });
  });
});

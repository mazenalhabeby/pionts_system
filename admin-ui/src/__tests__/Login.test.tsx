import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthProvider } from '../context/AuthContext';

// Mock the api module
vi.mock('../api', () => {
  const mockAuthApi = {
    refresh: vi.fn().mockResolvedValue(false),
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

import { authApi } from '../api';

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authApi.refresh as ReturnType<typeof vi.fn>).mockResolvedValue(false);
  });

  it('renders email + password inputs and submit button', async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('calls login on form submit with email and password', async () => {
    (authApi.login as ReturnType<typeof vi.fn>).mockResolvedValue({
      accessToken: 'tok',
      user: { id: '1', email: 'a@b.com', name: 'A', role: 'owner' },
      org: { id: 'o1', name: 'O' },
    });

    const user = userEvent.setup();
    renderLogin();

    await waitFor(() => {
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Email address'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith('a@b.com', 'secret');
    });
  });

  it('shows error message on login failure', async () => {
    (authApi.login as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Invalid credentials'));

    const user = userEvent.setup();
    renderLogin();

    await waitFor(() => {
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Email address'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows "Signing in..." while submitting', async () => {
    let resolveLogin: (value: any) => void;
    (authApi.login as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise((r) => { resolveLogin = r; })
    );

    const user = userEvent.setup();
    renderLogin();

    await waitFor(() => {
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Email address'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'pass');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });

    resolveLogin!({
      accessToken: 'tok',
      user: { id: '1', email: 'a@b.com', name: 'A', role: 'owner' },
      org: { id: 'o1', name: 'O' },
    });

    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../components/LoginPage';
import { AuthProvider } from '../context/AuthContext';
import { StandaloneConfigProvider } from '../context/WidgetConfigContext';

// Mock the api module
vi.mock('../api', () => ({
  api: {
    sendCode: vi.fn(),
    verifyCode: vi.fn(),
    checkAuth: vi.fn().mockRejectedValue(new Error('not authed')),
    logout: vi.fn(),
    getCustomer: vi.fn(),
    redeem: vi.fn(),
    award: vi.fn(),
    getMyReferrals: vi.fn(),
    getMyRedemptions: vi.fn(),
  },
}));

import { api } from '../api';

const mockApi = api as {
  sendCode: ReturnType<typeof vi.fn>;
  verifyCode: ReturnType<typeof vi.fn>;
  checkAuth: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  getCustomer: ReturnType<typeof vi.fn>;
  redeem: ReturnType<typeof vi.fn>;
  award: ReturnType<typeof vi.fn>;
  getMyReferrals: ReturnType<typeof vi.fn>;
  getMyRedemptions: ReturnType<typeof vi.fn>;
};

function renderLoginPage() {
  return render(
    <AuthProvider>
      <StandaloneConfigProvider>
        <LoginPage />
      </StandaloneConfigProvider>
    </AuthProvider>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.checkAuth.mockRejectedValue(new Error('not authed'));
  });

  it('renders email input initially (step=email)', () => {
    renderLoginPage();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Code' })).toBeInTheDocument();
  });

  it('transitions to code step after successful sendCode', async () => {
    mockApi.sendCode.mockResolvedValue({});
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@x.com');
    await user.click(screen.getByRole('button', { name: 'Send Code' }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });
    expect(screen.getByText(/We sent a 6-digit code to test@x.com/)).toBeInTheDocument();
  });

  it('shows error on sendCode failure', async () => {
    mockApi.sendCode.mockRejectedValue(new Error('Rate limited'));
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@x.com');
    await user.click(screen.getByRole('button', { name: 'Send Code' }));

    await waitFor(() => {
      expect(screen.getByText('Rate limited')).toBeInTheDocument();
    });
    // Should still be on email step
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('"Use a different email" returns to email step', async () => {
    mockApi.sendCode.mockResolvedValue({});
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@x.com');
    await user.click(screen.getByRole('button', { name: 'Send Code' }));

    await waitFor(() => {
      expect(screen.getByText('Use a different email')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Use a different email'));

    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Code' })).toBeInTheDocument();
  });

  it('calls login (verifyCode) with email and code on verify', async () => {
    mockApi.sendCode.mockResolvedValue({});
    mockApi.verifyCode.mockResolvedValue({});
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@x.com');
    await user.click(screen.getByRole('button', { name: 'Send Code' }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('000000'), '123456');
    await user.click(screen.getByRole('button', { name: 'Verify' }));

    await waitFor(() => {
      expect(mockApi.verifyCode).toHaveBeenCalledWith('test@x.com', '123456');
    });
  });
});

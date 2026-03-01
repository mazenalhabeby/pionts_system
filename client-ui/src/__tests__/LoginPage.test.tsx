import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../components/LoginPage';
import { WidgetProvider } from '../context/WidgetContext';
import { WidgetConfigProvider } from '../context/WidgetConfigContext';
import type { SdkConfig } from '@pionts/shared';

// Mock api-sdk module
vi.mock('../api-sdk', () => ({
  createSdkApi: vi.fn(() => mockSdkApi),
}));

const mockSdkApi = {
  getCustomer: vi.fn().mockRejectedValue(new Error('not authed')),
  redeem: vi.fn(),
  award: vi.fn(),
  getMyReferrals: vi.fn(),
  getMyRedemptions: vi.fn(),
  sendCode: vi.fn(),
  verifyCode: vi.fn(),
  getLeaderboard: vi.fn(),
  signup: vi.fn(),
  checkRef: vi.fn(),
};

const testConfig: SdkConfig = {
  projectKey: 'pk_test',
  apiBase: 'http://localhost:3000',
  mode: 'embedded',
  containerEl: document.createElement('div'),
};

function renderLoginPage() {
  return render(
    <WidgetProvider config={testConfig}>
      <WidgetConfigProvider>
        <LoginPage />
      </WidgetConfigProvider>
    </WidgetProvider>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdkApi.getCustomer.mockRejectedValue(new Error('not authed'));
  });

  it('renders email input initially (step=email)', async () => {
    renderLoginPage();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Send Code' })).toBeInTheDocument();
  });

  it('transitions to code step after successful sendCode', async () => {
    mockSdkApi.sendCode.mockResolvedValue({});
    const user = userEvent.setup();
    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@x.com');
    await user.click(screen.getByRole('button', { name: 'Send Code' }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });
    expect(screen.getByText(/We sent a 6-digit code to test@x.com/)).toBeInTheDocument();
  });

  it('shows error on sendCode failure', async () => {
    mockSdkApi.sendCode.mockRejectedValue(new Error('Rate limited'));
    const user = userEvent.setup();
    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@x.com');
    await user.click(screen.getByRole('button', { name: 'Send Code' }));

    await waitFor(() => {
      expect(screen.getByText('Rate limited')).toBeInTheDocument();
    });
    // Should still be on email step
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('"Use a different email" returns to email step', async () => {
    mockSdkApi.sendCode.mockResolvedValue({});
    const user = userEvent.setup();
    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });

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
    mockSdkApi.sendCode.mockResolvedValue({});
    mockSdkApi.verifyCode.mockResolvedValue({ token: 'test-token' });
    const user = userEvent.setup();
    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@x.com');
    await user.click(screen.getByRole('button', { name: 'Send Code' }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('000000'), '123456');
    await user.click(screen.getByRole('button', { name: 'Verify' }));

    await waitFor(() => {
      expect(mockSdkApi.verifyCode).toHaveBeenCalledWith('test@x.com', '123456');
    });
  });
});

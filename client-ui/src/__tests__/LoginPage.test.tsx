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
  getConfig: vi.fn().mockResolvedValue({
    settings: { widget_brand_name: 'TestStore' },
    earn_actions: [
      { slug: 'signup', label: 'Welcome Bonus', points: 20, category: 'predefined', frequency: 'one_time' },
      { slug: 'first_order', label: 'First Order Bonus', points: 50, category: 'predefined', frequency: 'one_time' },
      { slug: 'purchase', label: 'Every Purchase', points: 10, category: 'predefined', frequency: 'repeatable' },
      { slug: 'birthday', label: 'Birthday Reward', points: 25, category: 'predefined', frequency: 'yearly' },
    ],
    enabled_modules: { points: true, referrals: true, partners: false },
  }),
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
    mockSdkApi.getConfig.mockResolvedValue({
      settings: { widget_brand_name: 'TestStore' },
      earn_actions: [
        { slug: 'signup', label: 'Welcome Bonus', points: 20, category: 'predefined', frequency: 'one_time' },
        { slug: 'first_order', label: 'First Order Bonus', points: 50, category: 'predefined', frequency: 'one_time' },
        { slug: 'purchase', label: 'Every Purchase', points: 10, category: 'predefined', frequency: 'repeatable' },
        { slug: 'birthday', label: 'Birthday Reward', points: 25, category: 'predefined', frequency: 'yearly' },
      ],
      enabled_modules: { points: true, referrals: true, partners: false },
    });
  });

  it('renders email input initially (step=email)', async () => {
    renderLoginPage();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();
  });

  it('shows brand name from preAuthConfig', async () => {
    renderLoginPage();
    await waitFor(() => {
      expect(screen.getByText('TestStore')).toBeInTheDocument();
    });
  });

  it('renders incentive chips from preAuthConfig earn_actions', async () => {
    renderLoginPage();
    await waitFor(() => {
      expect(screen.getByTestId('incentive-grid')).toBeInTheDocument();
    });
    expect(screen.getByText(/Welcome Bonus/)).toBeInTheDocument();
    expect(screen.getByText(/First Order Bonus/)).toBeInTheDocument();
    expect(screen.getByText(/Every Purchase/)).toBeInTheDocument();
    expect(screen.getByText(/Birthday Reward/)).toBeInTheDocument();
  });

  it('works gracefully when getConfig fails', async () => {
    mockSdkApi.getConfig.mockRejectedValue(new Error('Network error'));
    renderLoginPage();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();
    expect(screen.queryByTestId('incentive-grid')).not.toBeInTheDocument();
  });

  it('transitions to code step after successful sendCode', async () => {
    mockSdkApi.sendCode.mockResolvedValue({});
    const user = userEvent.setup();
    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@x.com');
    await user.click(screen.getByRole('button', { name: 'Get Started' }));

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
    await user.click(screen.getByRole('button', { name: 'Get Started' }));

    await waitFor(() => {
      expect(screen.getByText('Rate limited')).toBeInTheDocument();
    });
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
    await user.click(screen.getByRole('button', { name: 'Get Started' }));

    await waitFor(() => {
      expect(screen.getByText('Use a different email')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Use a different email'));

    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();
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
    await user.click(screen.getByRole('button', { name: 'Get Started' }));

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

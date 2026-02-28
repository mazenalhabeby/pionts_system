import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TierCard from '../components/TierCard';

describe('TierCard', () => {
  it('renders points and discount text', () => {
    render(<TierCard points={100} discount={5} canRedeem={true} onRedeem={vi.fn()} />);
    expect(screen.getByText('100 pts')).toBeInTheDocument();
    expect(screen.getByText(/5 OFF/)).toBeInTheDocument();
  });

  it('button is enabled when canRedeem=true', () => {
    render(<TierCard points={50} discount={2} canRedeem={true} onRedeem={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'REDEEM' })).toBeEnabled();
  });

  it('button is disabled when canRedeem=false', () => {
    render(<TierCard points={50} discount={2} canRedeem={false} onRedeem={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'REDEEM' })).toBeDisabled();
  });

  it('calls onRedeem when clicked', async () => {
    const user = userEvent.setup();
    const onRedeem = vi.fn();
    render(<TierCard points={100} discount={5} canRedeem={true} onRedeem={onRedeem} />);

    await user.click(screen.getByRole('button', { name: 'REDEEM' }));
    expect(onRedeem).toHaveBeenCalledTimes(1);
  });
});

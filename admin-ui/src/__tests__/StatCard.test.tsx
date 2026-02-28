import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from '../components/StatCard';
import type { IconProps } from '@pionts/shared';

describe('StatCard', () => {
  it('renders value and label text', () => {
    render(<StatCard value="150" label="Total Points" />);
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Total Points')).toBeInTheDocument();
  });

  it('renders icon component when provided', () => {
    function TestIcon({ size }: IconProps) {
      return <svg data-testid="test-icon" width={size} height={size} />;
    }
    render(<StatCard value="42" label="Orders" icon={TestIcon} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders without icon (no crash)', () => {
    render(<StatCard value="0" label="Empty" />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });
});

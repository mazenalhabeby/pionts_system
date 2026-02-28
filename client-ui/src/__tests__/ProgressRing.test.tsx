import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressRing from '../components/ProgressRing';

describe('ProgressRing', () => {
  it('renders SVG with correct viewBox from size prop', () => {
    const { container } = render(
      <ProgressRing size={120} radius={50} strokeWidth={8} progressPct={50} gradientId="g1">
        <span>Inner</span>
      </ProgressRing>
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg!.getAttribute('viewBox')).toBe('0 0 120 120');
  });

  it('renders children inside the ring', () => {
    render(
      <ProgressRing size={100} radius={40} strokeWidth={6} progressPct={75} gradientId="g2">
        <span data-testid="child">Points</span>
      </ProgressRing>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Points')).toBeInTheDocument();
  });

  it('applies gradient with provided gradientId', () => {
    const { container } = render(
      <ProgressRing size={100} radius={40} strokeWidth={6} progressPct={50} gradientId="my-gradient">
        <span>Test</span>
      </ProgressRing>
    );
    const gradient = container.querySelector('#my-gradient');
    expect(gradient).toBeInTheDocument();
    expect(gradient!.tagName).toBe('linearGradient');
  });
});

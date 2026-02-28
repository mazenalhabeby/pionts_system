import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PointsForm from '../components/PointsForm';

describe('PointsForm', () => {
  it('renders label, points input, reason input, submit button', () => {
    render(<PointsForm label="Award" onSubmit={vi.fn()} />);
    expect(screen.getByText('Award:')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Pts')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Reason')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Award' })).toBeInTheDocument();
  });

  it('calls onSubmit with { points, reason } on valid submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<PointsForm label="Award" onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('Pts'), '25');
    await user.type(screen.getByPlaceholderText('Reason'), 'Good job');
    await user.click(screen.getByRole('button', { name: 'Award' }));

    expect(onSubmit).toHaveBeenCalledWith({ points: 25, reason: 'Good job' });
  });

  it('does not submit with zero points', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PointsForm label="Award" onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('Pts'), '0');
    await user.type(screen.getByPlaceholderText('Reason'), 'Test');
    await user.click(screen.getByRole('button', { name: 'Award' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears inputs after successful submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<PointsForm label="Award" onSubmit={onSubmit} />);

    const ptsInput = screen.getByPlaceholderText('Pts');
    const reasonInput = screen.getByPlaceholderText('Reason');

    await user.type(ptsInput, '10');
    await user.type(reasonInput, 'Bonus');
    await user.click(screen.getByRole('button', { name: 'Award' }));

    expect(ptsInput).toHaveValue(null);
    expect(reasonInput).toHaveValue('');
  });
});

import { useState } from 'react';

interface PointsFormProps {
  onSubmit: (data: { points: number; reason: string }) => void | Promise<void>;
  label: string;
  variant?: 'green' | 'red';
}

export default function PointsForm({ onSubmit, label, variant }: PointsFormProps) {
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pts = parseInt(points, 10);
    if (!pts || pts <= 0) return;
    if (!reason.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({ points: pts, reason: reason.trim() });
      setPoints('');
      setReason('');
    } catch {
      // error handling done by parent
    } finally {
      setSubmitting(false);
    }
  }

  const isGreen = variant === 'green';
  const isRed = variant === 'red';

  const inputBase = 'bg-bg-inset border border-border-default text-text-primary px-3.5 py-2.5 rounded-lg text-sm font-sans outline-none transition-all duration-200 placeholder:text-text-faint/50';
  const ringColor = isGreen ? 'focus:border-success/50 focus:shadow-[0_0_0_3px_rgba(80,227,194,0.08)]' : isRed ? 'focus:border-error/50 focus:shadow-[0_0_0_3px_rgba(238,85,85,0.08)]' : 'focus:border-border-focus focus:shadow-[0_0_0_3px_rgba(237,237,237,0.05)]';

  const btnBase = 'border-none px-6 py-2.5 rounded-lg cursor-pointer text-[13px] font-bold font-sans transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none inline-flex items-center justify-center gap-2 min-w-[120px] active:scale-[0.97]';
  const btnClass = isGreen
    ? `${btnBase} bg-success text-white shadow-[0_0_20px_rgba(80,227,194,0.25)] hover:shadow-[0_0_28px_rgba(80,227,194,0.4)] hover:brightness-110`
    : isRed
    ? `${btnBase} bg-error text-white shadow-[0_0_20px_rgba(238,85,85,0.25)] hover:shadow-[0_0_28px_rgba(238,85,85,0.4)] hover:brightness-110`
    : `${btnBase} bg-[#ededed] text-[#0a0a0a] hover:bg-white`;

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <span className="text-text-muted text-[13px] sr-only">{label}:</span>
      <div className="flex gap-3 max-sm:flex-col">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-text-faint font-semibold uppercase tracking-[0.1em]">Points</label>
          <input
            type="number"
            min="1"
            placeholder="Pts"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            required
            className={`w-24 ${inputBase} ${ringColor} max-sm:w-full`}
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-[10px] text-text-faint font-semibold uppercase tracking-[0.1em]">Reason</label>
          <input
            type="text"
            placeholder="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={`w-full ${inputBase} ${ringColor}`}
            required
          />
        </div>
      </div>
      <button
        type="submit"
        className={btnClass}
        disabled={submitting}
      >
        {submitting && (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {submitting ? `${label}ing...` : label}
      </button>
    </form>
  );
}

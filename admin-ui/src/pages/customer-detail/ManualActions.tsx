import { useState } from 'react';
import PointsForm from '../../components/PointsForm';

interface ManualActionsProps {
  onAward: (data: { points: number; reason: string }) => void | Promise<void>;
  onDeduct: (data: { points: number; reason: string }) => void | Promise<void>;
}

type Tab = 'award' | 'deduct';

export default function ManualActions({ onAward, onDeduct }: ManualActionsProps) {
  const [active, setActive] = useState<Tab>('award');

  return (
    <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden flex flex-col">
      <div className="px-5 py-3.5 border-b border-border-default">
        <span className="text-[13px] font-bold text-text-primary tracking-wide">Manual Actions</span>
      </div>
      <div className="flex items-center border-b border-border-default">
        {([
          { id: 'award' as const, label: 'Award Points', color: 'text-success', bar: 'bg-success' },
          { id: 'deduct' as const, label: 'Deduct Points', color: 'text-error', bar: 'bg-error' },
        ]).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`relative flex-1 py-3.5 text-[13px] font-medium transition-all duration-200 bg-transparent border-none cursor-pointer font-sans ${
              active === tab.id ? tab.color : 'text-text-faint hover:text-text-secondary'
            }`}
          >
            {tab.label}
            {active === tab.id && <span className={`absolute bottom-0 left-6 right-6 h-[2px] ${tab.bar} rounded-full`} />}
          </button>
        ))}
      </div>
      <div className="p-5 flex-1">
        {active === 'award' && <PointsForm onSubmit={onAward} label="Award" variant="green" />}
        {active === 'deduct' && <PointsForm onSubmit={onDeduct} label="Deduct" variant="red" />}
      </div>
    </div>
  );
}

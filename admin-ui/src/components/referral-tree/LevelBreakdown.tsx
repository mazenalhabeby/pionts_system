import { memo } from 'react';
import { LEVEL_COLORS } from './level-colors';

interface LevelBreakdownProps {
  levels: number[];
}

export default memo(function LevelBreakdown({ levels }: LevelBreakdownProps) {
  return (
    <div className="flex items-center gap-2">
      {levels.map((count, i) => {
        const color = LEVEL_COLORS[i % LEVEL_COLORS.length];
        return (
          <div key={i} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color.dot }} />
            <span className="text-xs font-bold text-white/90 leading-none">{count}</span>
            <span className="text-[10px] font-medium text-white/45 uppercase tracking-wide">L{i + 1}</span>
          </div>
        );
      })}
    </div>
  );
});

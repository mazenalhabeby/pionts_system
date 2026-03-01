import React, { memo } from 'react';

interface ProgressRingProps {
  size: number;
  radius: number;
  strokeWidth: number;
  progressPct: number;
  gradientId: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  trackColor?: string;
  gradientStops?: [string, string];
}

function ProgressRing({ size, radius, strokeWidth, progressPct, gradientId, children, className, style, trackColor, gradientStops }: ProgressRingProps) {
  const circumference = 2 * Math.PI * radius;
  const dashArray = `${(progressPct / 100) * circumference} ${circumference}`;
  const center = size / 2;

  return (
    <div className={`pw-ring ${className || ''}`} style={{ width: size, height: size, ...style }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="pw-ring__svg">
        <circle cx={center} cy={center} r={radius} fill="none" stroke={trackColor || '#f0f0f0'} strokeWidth={strokeWidth} />
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={dashArray}
          transform={`rotate(-90 ${center} ${center})`}
        />
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradientStops?.[0] || '#3b82f6'} />
            <stop offset="100%" stopColor={gradientStops?.[1] || '#60a5fa'} />
          </linearGradient>
        </defs>
      </svg>
      {children}
    </div>
  );
}

export default memo(ProgressRing);

import { useEffect, useState } from 'react';

interface Props {
  active: boolean;
}

const COLORS = ['#3b82f6', '#fbbf24', '#22c55e', '#6366f1', '#f43f5e', '#06b6d4', '#a855f7', '#f97316'];
const SHAPES = ['circle', 'rect', 'strip'] as const;

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  shape: typeof SHAPES[number];
  size: number;
  rotation: number;
  delay: number;
  drift: number;
  duration: number;
}

function createParticles(): Particle[] {
  return Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: 30 + Math.random() * 40,
    y: -5 - Math.random() * 10,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    size: 6 + Math.random() * 6,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.4,
    drift: (Math.random() - 0.5) * 120,
    duration: 1.8 + Math.random() * 1.2,
  }));
}

function getShapeStyle(p: Particle): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    left: `${p.x}%`,
    top: `${p.y}%`,
    backgroundColor: p.color,
    opacity: 0,
    animation: `confetti-burst ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s forwards`,
    '--confetti-drift': `${p.drift}px`,
    '--confetti-rotation': `${p.rotation + 720}deg`,
  } as React.CSSProperties;

  switch (p.shape) {
    case 'circle':
      return { ...base, width: p.size, height: p.size, borderRadius: '50%' };
    case 'rect':
      return { ...base, width: p.size, height: p.size * 0.7, borderRadius: 2 };
    case 'strip':
      return { ...base, width: p.size * 0.4, height: p.size * 1.4, borderRadius: 1 };
  }
}

export default function ConfettiEffect({ active }: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;
    setParticles(createParticles());
    const timeout = setTimeout(() => setParticles([]), 3500);
    return () => clearTimeout(timeout);
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div className="pw-confetti">
      {particles.map((p) => (
        <div key={p.id} style={getShapeStyle(p)} />
      ))}
    </div>
  );
}

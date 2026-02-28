import { useEffect, useState } from 'react';

interface Props {
  active: boolean;
}

const COLORS = ['#ff3c00', '#ffd700', '#22c55e', '#3b82f6', '#a855f7'];

export default function ConfettiEffect({ active }: Props) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const items = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.5,
    }));
    setParticles(items);

    const timeout = setTimeout(() => setParticles([]), 2000);
    return () => clearTimeout(timeout);
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            left: `${p.x}%`,
            top: '-8px',
            backgroundColor: p.color,
            animation: `confetti-fall 1.5s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

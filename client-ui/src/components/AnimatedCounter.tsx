import { useState, useEffect, useRef } from 'react';

interface Props {
  value: number;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({ value, duration = 800, className }: Props) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;

    if (from === to) {
      setDisplay(to);
      return;
    }

    const start = performance.now();
    let raf: number;

    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(from + (to - from) * eased));

      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{display.toLocaleString()}</span>;
}

import { useState, useEffect, useCallback } from 'react';

export default function ProjectFavicon({ domain, name, size = 18 }: { domain?: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  const resetErr = useCallback(() => setErr(false), []);

  useEffect(() => { resetErr(); }, [domain, resetErr]);

  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
    : null;

  if (faviconUrl && !err) {
    return (
      <img
        src={faviconUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-sm object-contain shrink-0"
        onError={() => setErr(true)}
      />
    );
  }

  const letter = (name || '?')[0].toUpperCase();
  return (
    <span
      className="inline-flex items-center justify-center rounded-sm bg-bg-surface-raised text-[10px] font-bold text-text-secondary shrink-0"
      style={{ width: size, height: size }}
    >
      {letter}
    </span>
  );
}

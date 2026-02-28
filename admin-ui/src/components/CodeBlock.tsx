import { useState, useEffect, useRef, memo } from 'react';

interface Props {
  code: string;
  language?: string;
}

export default memo(function CodeBlock({ code, language = 'html' }: Props) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="relative group">
      <pre className="bg-bg-surface-raised text-[#e2e2e2] rounded-lg p-4 overflow-x-auto text-sm leading-relaxed font-mono border border-border-default">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-1 text-xs bg-bg-surface-hover text-text-muted rounded border border-border-default cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      {language && (
        <span className="absolute top-2 left-3 text-[10px] text-text-faint uppercase tracking-wider">{language}</span>
      )}
    </div>
  );
});

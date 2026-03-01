import { memo } from 'react';
import { useClipboard } from '@pionts/shared';

interface CopyButtonProps {
  text: string;
  label?: string;
}

function CopyButton({ text, label = 'Copy' }: CopyButtonProps) {
  const { copied, copyToClipboard } = useClipboard();

  return (
    <button
      className={`pw-copy-btn ${copied ? 'pw-copy-btn--copied' : ''}`}
      onClick={() => copyToClipboard(text)}
      type="button"
    >
      {copied ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      )}
      {copied ? 'Copied!' : label}
    </button>
  );
}

export default memo(CopyButton);

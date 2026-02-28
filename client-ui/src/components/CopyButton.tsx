import { memo } from 'react';
import { useClipboard } from '@pionts/shared';

interface CopyButtonProps {
  text: string;
  label?: string;
}

function CopyButton({ text, label = 'COPY' }: CopyButtonProps) {
  const { copied, copyToClipboard } = useClipboard();

  return (
    <button
      className={`${copied ? 'bg-[#0a8a5a]' : 'bg-primary hover:bg-[#e03500]'} text-white border-none px-4 py-2.5 rounded cursor-pointer font-semibold text-[13px] whitespace-nowrap transition-colors duration-200 font-sans`}
      onClick={() => copyToClipboard(text)}
      type="button"
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}

export default memo(CopyButton);

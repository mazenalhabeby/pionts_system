import { memo, type ReactNode } from 'react';

interface Props {
  number: number;
  title: string;
  children: ReactNode;
}

export default memo(function GuideStep({ number, title, children }: Props) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-base font-semibold text-text-primary mb-2">{title}</h3>
        <div className="text-sm text-text-secondary space-y-3">{children}</div>
      </div>
    </div>
  );
});

import React, { useState, useEffect, useCallback } from 'react';

interface FloatingWrapperProps {
  children: React.ReactNode;
  brandName?: string;
}

export default function FloatingWrapper({ children, brandName }: FloatingWrapperProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);
  const handleDestroy = useCallback(() => setOpen(false), []);

  useEffect(() => {
    window.addEventListener('pionts:open', handleOpen);
    window.addEventListener('pionts:close', handleClose);
    window.addEventListener('pionts:destroy', handleDestroy);
    return () => {
      window.removeEventListener('pionts:open', handleOpen);
      window.removeEventListener('pionts:close', handleClose);
      window.removeEventListener('pionts:destroy', handleDestroy);
    };
  }, [handleOpen, handleClose, handleDestroy]);

  return (
    <>
      {/* Floating trigger button */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white border-none cursor-pointer flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.2)] z-[99999] transition-transform duration-200 hover:scale-[1.08] hover:shadow-[0_6px_24px_rgba(0,0,0,0.3)]"
        onClick={() => setOpen((v) => !v)}
        type="button"
        aria-label="Open rewards panel"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
          <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
        </svg>
      </button>

      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/30 z-[99999]" onClick={handleClose} />}

      {/* Slide-out panel */}
      <div className={`fixed top-0 w-[400px] max-w-screen h-screen bg-bg z-[100000] pionts-panel-slide flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.15)] ${open ? 'right-0' : 'right-[-420px]'} max-[440px]:w-screen ${open ? '' : 'max-[440px]:right-[-100vw]'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06] bg-white">
          <span className="font-bold text-base text-text">{brandName || 'Rewards'}</span>
          <button
            className="bg-transparent border-none cursor-pointer text-[#999] p-1 flex items-center rounded hover:text-[#333] hover:bg-[#f0f0f0]"
            onClick={handleClose}
            type="button"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </>
  );
}

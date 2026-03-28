import React, { useState, useEffect } from 'react';

interface FloatingWrapperProps {
  children: React.ReactNode;
}

export default function FloatingWrapper({ children }: FloatingWrapperProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const handleToggle = () => setOpen((prev) => !prev);

    window.addEventListener('pionts:open', handleOpen);
    window.addEventListener('pionts:close', handleClose);
    window.addEventListener('pionts:toggle', handleToggle);

    return () => {
      window.removeEventListener('pionts:open', handleOpen);
      window.removeEventListener('pionts:close', handleClose);
      window.removeEventListener('pionts:toggle', handleToggle);
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <>
      {/* Floating toggle button */}
      <button
        className="pw-float-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Close rewards panel' : 'Open rewards panel'}
        type="button"
      >
        <svg
          viewBox="0 0 24 24"
          width="26"
          height="26"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </>
          )}
        </svg>
      </button>

      {/* Backdrop overlay */}
      {open && (
        <div
          className="pw-float-backdrop"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out panel */}
      <div className={`pw-float-panel ${open ? 'pw-float-panel--open' : ''}`}>
        <div className="pw-float-panel__header">
          <span className="pw-float-panel__title">Rewards</span>
          <button
            className="pw-float-panel__close"
            onClick={() => setOpen(false)}
            aria-label="Close"
            type="button"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="pw-float-panel__body">
          {children}
        </div>
      </div>
    </>
  );
}

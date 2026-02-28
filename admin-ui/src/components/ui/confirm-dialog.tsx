import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  /** When set, user must type this exact text to enable the confirm button */
  safetyText?: string;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
}

function ConfirmDialog({ state, onClose }: { state: ConfirmOptions; onClose: (result: boolean) => void }) {
  const [typed, setTyped] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const hasSafety = !!state.safetyText;
  const safetyPassed = !hasSafety || typed === state.safetyText;

  useEffect(() => {
    setTyped('');
    if (hasSafety) {
      // Small delay so the animation finishes before focus
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [hasSafety]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose(false);
    if (e.key === 'Enter' && safetyPassed) onClose(true);
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={() => onClose(false)}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-[fadeIn_150ms_ease-out]" />

      {/* Dialog */}
      <div
        className="relative bg-bg-card border border-border-default rounded-2xl shadow-xl w-full max-w-[400px] overflow-hidden animate-[scaleIn_150ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="text-[15px] font-bold text-text-primary">
            {state.title || 'Confirm'}
          </div>
          <p className="text-[13px] text-text-muted mt-2 leading-relaxed">
            {state.message}
          </p>

          {hasSafety && (
            <div className="mt-4">
              <label className="text-[12px] text-text-muted font-medium block mb-1.5">
                Type <span className="font-bold text-text-primary font-mono bg-bg-surface-raised px-1.5 py-0.5 rounded">{state.safetyText}</span> to confirm
              </label>
              <input
                ref={inputRef}
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={state.safetyText}
                spellCheck={false}
                autoComplete="off"
                className="w-full bg-bg-surface border border-border-default text-text-primary px-3 py-2 rounded-lg text-[13px] font-mono outline-none transition-all duration-200 focus:border-border-focus placeholder:text-text-faint/40"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 pb-5">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="px-4 py-2 text-[13px] font-semibold text-text-muted bg-transparent rounded-lg cursor-pointer transition-all duration-150 hover:bg-bg-surface-hover hover:text-text-secondary border-none"
          >
            {state.cancelLabel || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => onClose(true)}
            disabled={!safetyPassed}
            autoFocus={!hasSafety}
            className={`px-4 py-2 text-[13px] font-semibold rounded-lg transition-all duration-150 border-none disabled:opacity-30 disabled:cursor-not-allowed ${
              safetyPassed ? 'cursor-pointer' : ''
            } ${
              state.variant === 'danger'
                ? 'bg-error text-white hover:opacity-90'
                : 'bg-text-primary text-bg-page hover:opacity-90'
            }`}
          >
            {state.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { visible: boolean }) | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ ...options, visible: true });
    });
  }, []);

  function handleClose(result: boolean) {
    setState(null);
    resolveRef.current?.(result);
    resolveRef.current = null;
  }

  return (
    <ConfirmContext value={{ confirm }}>
      {children}
      {state?.visible && <ConfirmDialog state={state} onClose={handleClose} />}
    </ConfirmContext>
  );
}

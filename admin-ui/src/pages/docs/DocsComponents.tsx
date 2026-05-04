import { memo, useState, type ReactNode } from 'react';

// ---- Page header ----
export const DocsTitle = memo(function DocsTitle({ children }: { children: ReactNode }) {
  return <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mb-2">{children}</h1>;
});

export const DocsSubtitle = memo(function DocsSubtitle({ children }: { children: ReactNode }) {
  return <p className="text-base text-text-secondary mb-8 leading-relaxed">{children}</p>;
});

// ---- Section headings ----
export const H2 = memo(function H2({ children, id }: { children: ReactNode; id?: string }) {
  return <h2 id={id} className="text-xl font-bold text-text-primary mt-12 mb-4 pt-8 border-t border-border-default first:border-0 first:mt-0 first:pt-0">{children}</h2>;
});

export const H3 = memo(function H3({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-semibold text-text-primary mt-6 mb-2">{children}</h3>;
});

// ---- Text ----
export const P = memo(function P({ children }: { children: ReactNode }) {
  return <p className="text-sm text-text-secondary leading-relaxed mb-3">{children}</p>;
});

// ---- Code block with copy ----
export const Code = memo(function Code({ children, lang = '' }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      {lang && <span className="absolute top-2 left-3 text-[10px] text-text-faint uppercase tracking-wider font-mono">{lang}</span>}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-0.5 text-[11px] font-semibold bg-bg-surface-hover text-text-muted rounded border border-border-default cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre className="bg-bg-surface-raised text-[#e2e2e2] rounded-lg p-4 pt-8 overflow-x-auto text-[13px] leading-relaxed font-mono border border-border-default">
        <code>{children}</code>
      </pre>
    </div>
  );
});

// ---- Inline code ----
export const InlineCode = memo(function InlineCode({ children }: { children: ReactNode }) {
  return <code className="text-[13px] font-mono bg-bg-surface-hover text-accent px-1.5 py-0.5 rounded border border-border-default">{children}</code>;
});

// ---- Step ----
export const Step = memo(function Step({ num, title, children }: { num: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 my-6">
      <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
        {num}
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
        <div className="text-sm text-text-secondary space-y-3">{children}</div>
      </div>
    </div>
  );
});

// ---- Table ----
export const Table = memo(function Table({ headers, rows }: { headers: string[]; rows: (string | ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="text-left px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-text-faint bg-bg-surface-hover border-b border-border-default">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border-default/50">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2.5 text-text-secondary">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

// ---- Alert ----
export const Alert = memo(function Alert({ type = 'info', children }: { type?: 'info' | 'warning' | 'success' | 'danger'; children: ReactNode }) {
  const styles = {
    info: 'bg-primary/5 border-primary/20 text-primary',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
    success: 'bg-green-500/10 border-green-500/20 text-green-500',
    danger: 'bg-red-500/10 border-red-500/20 text-red-500',
  };
  const icons = { info: '💡', warning: '⚠️', success: '✅', danger: '🔒' };

  return (
    <div className={`flex gap-3 rounded-lg px-4 py-3 my-4 border text-sm ${styles[type]}`}>
      <span className="shrink-0">{icons[type]}</span>
      <div>{children}</div>
    </div>
  );
});

// ---- Method badge ----
export const Method = memo(function Method({ type }: { type: 'GET' | 'POST' | 'DELETE' }) {
  const styles = {
    GET: 'bg-blue-500/15 text-blue-400',
    POST: 'bg-green-500/15 text-green-400',
    DELETE: 'bg-red-500/15 text-red-400',
  };
  return <span className={`inline-block text-[11px] font-bold font-mono px-2 py-0.5 rounded ${styles[type]}`}>{type}</span>;
});

// ---- Endpoint block ----
export const Endpoint = memo(function Endpoint({ method, path, desc, children }: { method: 'GET' | 'POST' | 'DELETE'; path: string; desc: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border-default rounded-lg my-3 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left bg-bg-surface-hover/50 hover:bg-bg-surface-hover transition-colors cursor-pointer"
      >
        <Method type={method} />
        <span className="font-mono text-[13px] font-medium text-text-primary">{path}</span>
        <span className="text-text-muted text-xs ml-auto hidden sm:inline">{desc}</span>
        <span className={`text-text-faint text-xs transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
      </button>
      {open && <div className="px-4 pb-4 border-t border-border-default">{children}</div>}
    </div>
  );
});

// ---- Card grid ----
export const CardGrid = memo(function CardGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">{children}</div>;
});

export const Card = memo(function Card({ icon, title, desc, onClick }: { icon: string; title: string; desc: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-bg-surface-hover/50 border border-border-default rounded-lg p-4 transition-all ${onClick ? 'cursor-pointer hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5' : ''}`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-muted">{desc}</p>
    </div>
  );
});

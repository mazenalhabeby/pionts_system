import { useState, memo, type ReactNode } from 'react';

export const Title = memo(({ children }: { children: ReactNode }) => (
  <h1 className="text-[2.2rem] font-extrabold tracking-tight text-slate-900 mb-2 leading-tight">{children}</h1>
));

export const Subtitle = memo(({ children }: { children: ReactNode }) => (
  <p className="text-[16px] text-slate-500 mb-10 leading-relaxed max-w-xl">{children}</p>
));

export const H2 = memo(({ children, id }: { children: ReactNode; id?: string }) => (
  <h2 id={id} className="text-[1.3rem] font-bold text-slate-900 mt-14 mb-4 pt-8 border-t border-slate-200/60 first:border-0 first:mt-0 first:pt-0 scroll-mt-20 flex items-center gap-2">
    {children}
  </h2>
));

export const H3 = memo(({ children }: { children: ReactNode }) => (
  <h3 className="text-[15px] font-semibold text-slate-800 mt-6 mb-2">{children}</h3>
));

export const P = memo(({ children }: { children: ReactNode }) => (
  <p className="text-[14px] text-slate-600 leading-[1.75] mb-3">{children}</p>
));

// ---- Code block ----
export const Code = memo(({ children, lang = '' }: { children: string; lang?: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group my-5 rounded-xl overflow-hidden ring-1 ring-slate-200 shadow-sm">
      {lang && (
        <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{lang}</span>
          <button
            onClick={() => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md cursor-pointer transition-all ${
              copied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400 border border-slate-600 hover:text-white hover:bg-slate-600'
            }`}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      )}
      {!lang && (
        <button
          onClick={() => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="absolute top-3 right-3 px-2.5 py-1 text-[11px] font-semibold rounded-md border cursor-pointer opacity-0 group-hover:opacity-100 transition-all bg-white text-slate-500 border-slate-200 hover:bg-slate-50 z-10"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      )}
      <pre className={`${lang ? 'bg-slate-900' : 'bg-slate-50'} ${lang ? 'text-slate-200' : 'text-slate-800'} px-4 py-4 overflow-x-auto text-[13px] leading-[1.7] font-mono`}>
        <code>{children}</code>
      </pre>
    </div>
  );
});

// ---- Step ----
export const Step = memo(({ num, title, children }: { num: number; title: string; children: ReactNode }) => (
  <div className="flex gap-4 my-8">
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-[13px] font-bold shrink-0 mt-0.5 shadow-md shadow-indigo-200/50">{num}</div>
    <div className="flex-1">
      <h3 className="text-[15px] font-bold text-slate-900 mb-2">{title}</h3>
      <div className="text-[14px] text-slate-600 space-y-3">{children}</div>
    </div>
  </div>
));

// ---- Table ----
export const Table = memo(({ headers, rows }: { headers: string[]; rows: (string | ReactNode)[][] }) => (
  <div className="overflow-x-auto my-5 rounded-xl ring-1 ring-slate-200 shadow-sm bg-white">
    <table className="w-full text-[13px]">
      <thead>
        <tr className="bg-slate-50/80 border-b border-slate-200">
          {headers.map((h, i) => <th key={i} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
            {row.map((cell, j) => <td key={j} className="px-4 py-3 text-slate-700">{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
));

// ---- Alert ----
const alertConfig = {
  info:    { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-800', icon: '💡' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: '⚠️' },
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: '✅' },
  danger:  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', icon: '🔒' },
};

export const Alert = memo(({ type = 'info', children }: { type?: 'info' | 'warning' | 'success' | 'danger'; children: ReactNode }) => {
  const c = alertConfig[type];
  return (
    <div className={`flex gap-3 rounded-xl px-5 py-4 my-6 border ${c.bg} ${c.border} ${c.text} text-[13px] leading-relaxed shadow-sm`}>
      <span className="shrink-0 text-lg">{c.icon}</span>
      <div className="font-medium">{children}</div>
    </div>
  );
});

// ---- Method badge ----
const methodConfig = {
  GET:    { bg: 'bg-sky-100', text: 'text-sky-700', ring: 'ring-sky-200' },
  POST:   { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  DELETE: { bg: 'bg-rose-100', text: 'text-rose-700', ring: 'ring-rose-200' },
};

export const Method = memo(({ type }: { type: 'GET' | 'POST' | 'DELETE' }) => {
  const c = methodConfig[type];
  return <span className={`inline-block text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-lg ring-1 ${c.bg} ${c.text} ${c.ring}`}>{type}</span>;
});

// ---- Endpoint ----
export const Endpoint = memo(({ method, path, desc, children }: { method: 'GET' | 'POST' | 'DELETE'; path: string; desc: string; children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="ring-1 ring-slate-200 rounded-xl my-4 overflow-hidden shadow-sm bg-white">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors cursor-pointer">
        <Method type={method} />
        <span className="font-mono text-[13px] font-semibold text-slate-900">{path}</span>
        <span className="text-slate-400 text-[12px] ml-auto hidden sm:inline">{desc}</span>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>
      {open && <div className="px-4 pb-5 border-t border-slate-100">{children}</div>}
    </div>
  );
});

// ---- Cards ----
export const CardGrid = memo(({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">{children}</div>
));

export const Card = memo(({ icon, title, desc, badge, onClick }: { icon: string; title: string; desc: string; badge?: string; onClick?: () => void }) => (
  <div onClick={onClick} className={`bg-white ring-1 ring-slate-200 rounded-2xl p-5 transition-all shadow-sm ${onClick ? 'cursor-pointer hover:ring-indigo-300 hover:shadow-lg hover:shadow-indigo-100/40 hover:-translate-y-0.5 active:translate-y-0' : ''}`}>
    <div className="flex items-start justify-between mb-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-slate-200 flex items-center justify-center text-xl">{icon}</div>
      {badge && <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">{badge}</span>}
    </div>
    <h3 className="text-[14px] font-bold text-slate-900 mb-1">{title}</h3>
    <p className="text-[12px] text-slate-500 leading-relaxed">{desc}</p>
  </div>
));

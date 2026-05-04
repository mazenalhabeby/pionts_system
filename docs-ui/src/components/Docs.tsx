import { useState, memo, type ReactNode } from 'react';

export const Title = memo(({ children }: { children: ReactNode }) => (
  <h1 className="text-[2rem] font-extrabold tracking-tight text-gray-900 mb-1">{children}</h1>
));

export const Subtitle = memo(({ children }: { children: ReactNode }) => (
  <p className="text-[15px] text-gray-500 mb-10 leading-relaxed">{children}</p>
));

export const H2 = memo(({ children, id }: { children: ReactNode; id?: string }) => (
  <h2 id={id} className="text-[1.25rem] font-bold text-gray-900 mt-14 mb-3 pt-8 border-t border-gray-100 first:border-0 first:mt-0 first:pt-0 scroll-mt-20">{children}</h2>
));

export const H3 = memo(({ children }: { children: ReactNode }) => (
  <h3 className="text-[15px] font-semibold text-gray-900 mt-6 mb-2">{children}</h3>
));

export const P = memo(({ children }: { children: ReactNode }) => (
  <p className="text-[14px] text-gray-600 leading-relaxed mb-3">{children}</p>
));

// ---- Code block ----
export const Code = memo(({ children, lang = '' }: { children: string; lang?: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-gray-200">
      {lang && <div className="bg-gray-50 border-b border-gray-200 px-4 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{lang}</div>}
      <button
        onClick={() => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="absolute top-2 right-2 px-2.5 py-1 text-[11px] font-semibold rounded-md border cursor-pointer opacity-0 group-hover:opacity-100 transition-all bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
        style={lang ? { top: '2.5rem' } : {}}
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
      <pre className="bg-[#fafbfc] text-gray-800 px-4 py-4 overflow-x-auto text-[13px] leading-[1.65] font-mono">
        <code>{children}</code>
      </pre>
    </div>
  );
});

// ---- Step ----
export const Step = memo(({ num, title, children }: { num: number; title: string; children: ReactNode }) => (
  <div className="flex gap-4 my-7">
    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5">{num}</div>
    <div className="flex-1">
      <h3 className="text-[14px] font-semibold text-gray-900 mb-1.5">{title}</h3>
      <div className="text-[14px] text-gray-600 space-y-3">{children}</div>
    </div>
  </div>
));

// ---- Table ----
export const Table = memo(({ headers, rows }: { headers: string[]; rows: (string | ReactNode)[][] }) => (
  <div className="overflow-x-auto my-5 rounded-xl border border-gray-200">
    <table className="w-full text-[13px]">
      <thead>
        <tr className="bg-gray-50">
          {headers.map((h, i) => <th key={i} className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-200">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-gray-100 last:border-0">
            {row.map((cell, j) => <td key={j} className="px-4 py-2.5 text-gray-700">{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
));

// ---- Alert ----
const alertStyles = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  danger: 'bg-red-50 border-red-200 text-red-800',
};
const alertIcons = { info: '💡', warning: '⚠️', success: '✅', danger: '🔒' };

export const Alert = memo(({ type = 'info', children }: { type?: 'info' | 'warning' | 'success' | 'danger'; children: ReactNode }) => (
  <div className={`flex gap-3 rounded-xl px-4 py-3.5 my-5 border text-[13px] leading-relaxed ${alertStyles[type]}`}>
    <span className="shrink-0 text-base">{alertIcons[type]}</span>
    <div>{children}</div>
  </div>
));

// ---- Method badge ----
const methodStyles = { GET: 'bg-blue-100 text-blue-700', POST: 'bg-emerald-100 text-emerald-700', DELETE: 'bg-red-100 text-red-700' };
export const Method = memo(({ type }: { type: 'GET' | 'POST' | 'DELETE' }) => (
  <span className={`inline-block text-[11px] font-bold font-mono px-2 py-0.5 rounded-md ${methodStyles[type]}`}>{type}</span>
));

// ---- Endpoint ----
export const Endpoint = memo(({ method, path, desc, children }: { method: 'GET' | 'POST' | 'DELETE'; path: string; desc: string; children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl my-3 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-4 py-3 text-left bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer">
        <Method type={method} />
        <span className="font-mono text-[13px] font-semibold text-gray-900">{path}</span>
        <span className="text-gray-400 text-[12px] ml-auto hidden sm:inline">{desc}</span>
        <span className={`text-gray-400 text-[12px] transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
      </button>
      {open && <div className="px-4 pb-4 border-t border-gray-200 bg-white">{children}</div>}
    </div>
  );
});

// ---- Cards ----
export const CardGrid = memo(({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-5">{children}</div>
));

export const Card = memo(({ icon, title, desc, onClick }: { icon: string; title: string; desc: string; onClick?: () => void }) => (
  <div onClick={onClick} className={`bg-white border border-gray-200 rounded-xl p-5 transition-all ${onClick ? 'cursor-pointer hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/50 hover:-translate-y-0.5' : ''}`}>
    <div className="text-2xl mb-2.5">{icon}</div>
    <h3 className="text-[14px] font-semibold text-gray-900 mb-1">{title}</h3>
    <p className="text-[12px] text-gray-500 leading-relaxed">{desc}</p>
  </div>
));

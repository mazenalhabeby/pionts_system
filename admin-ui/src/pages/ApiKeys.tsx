import { useState, useCallback } from 'react';
import { projectApi } from '../api';
import { useProject } from '../context/ProjectContext';
import { useFetch, formatDate } from '@pionts/shared';
import { Alert } from '../components/ui/alert';
import { useConfirm } from '../components/ui/confirm-dialog';
import { NoProject } from '../components/ui/empty-state';

interface GeneratedKeys {
  publicKey: string;
  secretKey: string;
}

interface ApiKey {
  id: number | string;
  type: string;
  keyPrefix: string;
  label: string;
  revoked: boolean;
  createdAt: string;
}

export default function ApiKeys() {
  const { currentProject, canAdmin } = useProject();
  const confirm = useConfirm();
  const pid = currentProject?.id;
  const { data: keys, loading, error, refresh } = useFetch(
    useCallback(() => projectApi.getKeys(pid!), [pid]),
    [pid],
  );
  const [generatedKeys, setGeneratedKeys] = useState<GeneratedKeys | null>(null);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const result = await projectApi.generateKeys(pid!);
      setGeneratedKeys(result);
      refresh();
    } catch {
      // error
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevoke(keyId: number | string) {
    const ok = await confirm({ title: 'Revoke API key', message: 'This key will stop working immediately. Any integrations using it will break.', confirmLabel: 'Revoke', variant: 'danger', safetyText: 'REVOKE' });
    if (!ok) return;
    await projectApi.revokeKey(pid!, keyId);
    refresh();
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
  }

  if (!pid) return <NoProject />;
  if (!canAdmin) return <div className="text-center p-10 text-text-muted">You need admin access to manage API keys.</div>;
  if (loading) return <div className="text-center p-10 text-text-muted">Loading API keys...</div>;
  if (error) return <Alert>{error}</Alert>;

  const keyList: ApiKey[] = keys || [];
  const activeKeys = keyList.filter((k) => !k.revoked).length;
  const revokedKeys = keyList.filter((k) => k.revoked).length;
  const lastCreated = keyList.length > 0
    ? keyList.reduce((latest, k) => new Date(k.createdAt) > new Date(latest.createdAt) ? k : latest).createdAt
    : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <div className="page-hero apikeys-hero bg-bg-card border border-border-default rounded-2xl">
        <div className="px-8 pt-8 pb-4 max-md:px-5 max-md:pt-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] uppercase tracking-[2px] font-bold text-accent">Authentication</div>
            <div className="text-[26px] font-extrabold text-text-primary leading-tight mt-1 max-md:text-[20px]">API Keys</div>
            <div className="text-[13px] text-text-muted mt-1">Manage keys for {currentProject!.name}</div>
          </div>
          <button
            className="bg-[#ededed] text-[#0a0a0a] border-none px-5 py-2.5 rounded-lg cursor-pointer text-sm font-semibold font-sans transition-all duration-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? 'Generating...' : '+ Generate Keys'}
          </button>
        </div>

        <div className="grid grid-cols-3 border-t border-border-default max-md:grid-cols-1">
          <div className="px-8 py-5 max-md:px-5 max-md:py-4">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-faint mb-1">Active Keys</div>
            <div className="text-[22px] font-bold leading-none text-success">{activeKeys}</div>
          </div>
          <div className="px-8 py-5 max-md:px-5 max-md:py-4 border-l border-border-default max-md:border-l-0 max-md:border-t max-md:border-border-default">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-faint mb-1">Revoked</div>
            <div className="text-[22px] font-bold leading-none text-text-primary">{revokedKeys}</div>
          </div>
          <div className="px-8 py-5 max-md:px-5 max-md:py-4 border-l border-border-default max-md:border-l-0 max-md:border-t max-md:border-border-default">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-faint mb-1">Last Generated</div>
            <div className="text-[16px] font-bold leading-none text-text-primary mt-0.5">{lastCreated ? formatDate(lastCreated) : '\u2014'}</div>
          </div>
        </div>
      </div>

      {/* Generated keys success card */}
      {generatedKeys && (
        <div className="bg-success-dim border border-success rounded-xl p-5.5 border-l-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-success text-[18px]">{'\u2713'}</span>
            <div className="text-base font-bold text-success">New Keys Generated</div>
          </div>
          <div className="text-[13px] text-text-muted mb-4">Save these now — the secret key won't be shown again.</div>
          <div className="text-left mb-4">
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wide mb-1.5">Public Key</label>
            <div className="flex gap-2 items-center">
              <code className="flex-1 bg-bg-surface border border-border-default px-3.5 py-2.5 rounded-lg text-xs font-mono text-text-primary break-all">{generatedKeys.publicKey}</code>
              <button type="button" className="bg-bg-surface border border-border-default text-text-muted px-3.5 py-2 rounded-lg text-[13px] font-semibold font-sans cursor-pointer whitespace-nowrap shrink-0 transition-all duration-150 hover:bg-bg-surface-hover hover:text-text-secondary hover:border-text-faint" onClick={() => handleCopy(generatedKeys.publicKey)}>Copy</button>
            </div>
          </div>
          <div className="text-left mb-4">
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wide mb-1.5">Secret Key</label>
            <div className="flex gap-2 items-center">
              <code className="flex-1 bg-bg-surface border border-border-default px-3.5 py-2.5 rounded-lg text-xs font-mono text-text-primary break-all">{generatedKeys.secretKey}</code>
              <button type="button" className="bg-bg-surface border border-border-default text-text-muted px-3.5 py-2 rounded-lg text-[13px] font-semibold font-sans cursor-pointer whitespace-nowrap shrink-0 transition-all duration-150 hover:bg-bg-surface-hover hover:text-text-secondary hover:border-text-faint" onClick={() => handleCopy(generatedKeys.secretKey)}>Copy</button>
            </div>
          </div>
          <button
            type="button"
            className="mt-1 bg-bg-surface text-text-secondary border border-border-default px-5 py-2.5 rounded-lg cursor-pointer text-sm font-semibold font-sans transition-all duration-200 hover:bg-bg-surface-hover hover:border-text-faint"
            onClick={() => setGeneratedKeys(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Keys table */}
      <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 border-b border-border-default">
          <div className="text-[14px] font-semibold text-text-primary">All Keys</div>
          <span className="text-[11px] font-medium text-text-faint bg-bg-surface px-2 py-0.5 rounded-md">{keyList.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border-default whitespace-nowrap select-none">Type</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border-default whitespace-nowrap select-none">Prefix</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border-default whitespace-nowrap select-none">Label</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border-default whitespace-nowrap select-none">Status</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border-default whitespace-nowrap select-none">Created</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border-default whitespace-nowrap select-none"></th>
              </tr>
            </thead>
            <tbody>
              {keyList.length === 0 ? (
                <tr><td colSpan={6} className="text-center px-4 py-8 text-text-muted">No API keys.</td></tr>
              ) : keyList.map((k) => (
                <tr key={k.id} className="hover:bg-bg-surface-hover/30 transition-colors">
                  <td className="px-4 py-3 border-b border-border-subtle text-sm align-middle">
                    <span className="inline-flex items-center gap-1.5">
                      {k.type === 'secret' ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6366f1]">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0ea5e9]">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      )}
                      <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${
                        k.type === 'secret' ? 'text-[#6366f1] bg-[#6366f1]/10' : 'text-[#0ea5e9] bg-[#0ea5e9]/10'
                      }`}>{k.type}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-border-subtle text-sm align-middle">
                    <code className="font-mono text-xs text-text-muted tracking-wide">{k.keyPrefix}...</code>
                  </td>
                  <td className="px-4 py-3 border-b border-border-subtle text-sm align-middle text-text-secondary">{k.label}</td>
                  <td className="px-4 py-3 border-b border-border-subtle text-sm align-middle">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${k.revoked ? 'bg-error' : 'bg-success'}`} />
                      <span className={`text-[11px] font-bold ${k.revoked ? 'text-error' : 'text-success'}`}>
                        {k.revoked ? 'Revoked' : 'Active'}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-border-subtle text-xs text-text-muted whitespace-nowrap align-middle">{formatDate(k.createdAt)}</td>
                  <td className="px-4 py-3 border-b border-border-subtle text-sm align-middle">
                    {!k.revoked && (
                      <button
                        type="button"
                        className="bg-transparent text-error border border-error/30 px-3 py-1 rounded-md cursor-pointer text-xs font-semibold font-sans transition-all duration-150 hover:bg-error-dim hover:border-error"
                        onClick={() => handleRevoke(k.id)}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi, getErrorMessage } from '../api';
import { useProject } from '../context/ProjectContext';
import {
  ShopifyIcon, WordPressIcon, CodeIcon, GlobeIcon,
  CheckIcon, CopyIcon, ShieldIcon, ArrowLeftIcon,
} from '@pionts/shared';
import { Alert } from '../components/ui/alert';

interface CreatedKeys {
  publicKey: string;
  secretKey: string;
}

type Platform = 'shopify' | 'wordpress' | 'custom' | 'other';

const PLATFORMS: { value: Platform; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'shopify', label: 'Shopify', desc: 'Connect your Shopify store', icon: <ShopifyIcon size={24} /> },
  { value: 'wordpress', label: 'WordPress', desc: 'Integrate with WooCommerce', icon: <WordPressIcon size={24} /> },
  { value: 'custom', label: 'Custom Code', desc: 'Any website with a script tag', icon: <CodeIcon size={24} /> },
  { value: 'other', label: 'Other', desc: 'API-only or manual setup', icon: <GlobeIcon size={24} /> },
];

export default function ProjectCreate() {
  const navigate = useNavigate();
  const { selectProject, refreshProjects } = useProject();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [platform, setPlatform] = useState<Platform>('custom');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdKeys, setCreatedKeys] = useState<CreatedKeys | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pointsEnabled, setPointsEnabled] = useState(true);
  const [referralsEnabled, setReferralsEnabled] = useState(true);
  const [partnersEnabled, setPartnersEnabled] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      const result = await projectApi.create({ name, domain: domain || undefined, platform, pointsEnabled, referralsEnabled, partnersEnabled });
      setCreatedKeys(result.apiKeys);
      await refreshProjects();
      selectProject(result.project);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  if (createdKeys) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-[520px]">
          {/* Success card */}
          <div className="bg-bg-card border border-border-default rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-5">
              <CheckIcon size={28} />
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-1">Project Created</h1>
            <p className="text-[13px] text-text-muted mb-8">
              Save your API keys now. The secret key won't be shown again.
            </p>

            <div className="text-left space-y-4">
              {/* Public Key */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Public Key</span>
                  <span className="text-[10px] text-text-faint px-1.5 py-0.5 rounded bg-bg-surface border border-border-default">Browser-safe</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-bg-surface border border-border-default px-3.5 py-2.5 rounded-lg text-[12px] font-mono text-text-primary break-all">{createdKeys.publicKey}</code>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 bg-bg-surface border border-border-default text-text-muted px-3 py-2.5 rounded-lg text-[12px] font-medium font-sans cursor-pointer shrink-0 transition-all duration-150 hover:bg-bg-surface-hover hover:text-text-secondary hover:border-text-faint"
                    onClick={() => handleCopy(createdKeys.publicKey, 'public')}
                  >
                    {copied === 'public' ? <CheckIcon size={13} /> : <CopyIcon />}
                    {copied === 'public' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Secret Key */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Secret Key</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-warning px-1.5 py-0.5 rounded bg-warning-dim border border-warning/20">
                    <ShieldIcon size={10} />
                    Keep private
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-bg-surface border border-border-default px-3.5 py-2.5 rounded-lg text-[12px] font-mono text-text-primary break-all">{createdKeys.secretKey}</code>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 bg-bg-surface border border-border-default text-text-muted px-3 py-2.5 rounded-lg text-[12px] font-medium font-sans cursor-pointer shrink-0 transition-all duration-150 hover:bg-bg-surface-hover hover:text-text-secondary hover:border-text-faint"
                    onClick={() => handleCopy(createdKeys.secretKey, 'secret')}
                  >
                    {copied === 'secret' ? <CheckIcon size={13} /> : <CopyIcon />}
                    {copied === 'secret' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <button
              className="mt-8 w-full bg-text-primary text-bg-page border-none py-2.5 rounded-lg cursor-pointer text-[13px] font-semibold font-sans transition-colors hover:bg-text-secondary"
              onClick={() => navigate('/')}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-[520px]">
        {/* Back link */}
        <button
          type="button"
          className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer font-sans mb-6 p-0"
          onClick={() => navigate(-1 as any)}
        >
          <ArrowLeftIcon />
          Back
        </button>

        {/* Form card */}
        <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-0">
            <h1 className="text-lg font-bold text-text-primary mb-1">Create a new project</h1>
            <p className="text-[13px] text-text-muted">Set up a loyalty program for your store or app.</p>
          </div>

          {error && <div className="px-8 pt-4"><Alert>{error}</Alert></div>}

          <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8">
            {/* Platform selection */}
            <div className="mb-6">
              <label className="block text-[13px] font-medium text-text-secondary mb-3">Platform</label>
              <div className="grid grid-cols-2 gap-2.5">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPlatform(p.value)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left cursor-pointer font-sans transition-all duration-150 bg-transparent ${
                      platform === p.value
                        ? 'border-text-primary bg-bg-surface'
                        : 'border-border-default hover:border-text-faint hover:bg-bg-surface'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      platform === p.value
                        ? 'bg-text-primary/10 text-text-primary'
                        : 'bg-bg-surface text-text-faint'
                    }`}>
                      {p.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-text-primary">{p.label}</div>
                      <div className="text-[11px] text-text-faint mt-0.5">{p.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border-default mb-6" />

            {/* Module Selection */}
            <div className="mb-6">
              <label className="block text-[13px] font-medium text-text-secondary mb-3">Modules</label>
              <div className="space-y-2.5">
                {([
                  { key: 'points', label: 'Points System', desc: 'Earn actions, redemptions, tiers', checked: pointsEnabled, onChange: setPointsEnabled },
                  { key: 'referrals', label: 'Referral Program', desc: 'Multi-level referral chain', checked: referralsEnabled, onChange: setReferralsEnabled },
                  { key: 'partners', label: 'Partner Program', desc: 'Commission-based partner earnings', checked: partnersEnabled, onChange: setPartnersEnabled },
                ] as const).map((m) => (
                  <label key={m.key} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-border-default cursor-pointer transition-all hover:bg-bg-surface">
                    <input
                      type="checkbox"
                      checked={m.checked}
                      onChange={(e) => m.onChange(e.target.checked)}
                      className="w-4 h-4 rounded accent-text-primary"
                    />
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-text-primary">{m.label}</div>
                      <div className="text-[11px] text-text-faint">{m.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border-default mb-6" />

            {/* Project name */}
            <div className="mb-5">
              <label className="block text-[13px] font-medium text-text-secondary mb-2">Project Name</label>
              <input
                type="text"
                placeholder="e.g. My Store Rewards"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full bg-bg-surface border border-border-default text-text-primary px-3.5 py-2.5 rounded-lg text-[13px] font-sans outline-none transition-all duration-200 box-border placeholder:text-text-faint focus:border-border-focus focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]"
              />
            </div>

            {/* Domain */}
            <div className="mb-6">
              <label className="block text-[13px] font-medium text-text-secondary mb-2">Domain</label>
              <input
                type="text"
                placeholder="e.g. mystore.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full bg-bg-surface border border-border-default text-text-primary px-3.5 py-2.5 rounded-lg text-[13px] font-sans outline-none transition-all duration-200 box-border placeholder:text-text-faint focus:border-border-focus focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 bg-transparent text-text-secondary border border-border-default py-2.5 rounded-lg cursor-pointer text-[13px] font-semibold font-sans transition-all duration-150 hover:bg-bg-surface hover:border-text-faint"
                onClick={() => navigate(-1 as any)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-text-primary text-bg-page border-none py-2.5 rounded-lg cursor-pointer text-[13px] font-semibold font-sans transition-colors hover:bg-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting || !name.trim() || !domain.trim()}
              >
                {submitting ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

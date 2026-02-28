import { useState } from 'react';
import { orgApi, getErrorMessage } from '../../api';
import { Alert } from '../../components/ui/alert';

interface OrgDetailsFormProps {
  initialName: string;
  onSaved: () => void;
}

export default function OrgDetailsForm({ initialName, onSaved }: OrgDetailsFormProps) {
  const [orgName, setOrgName] = useState(initialName);
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgMsg, setOrgMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleOrgSave(e: React.FormEvent) {
    e.preventDefault();
    setOrgSaving(true);
    setOrgMsg(null);
    try {
      await orgApi.updateOrg({ name: orgName });
      setOrgMsg({ type: 'success', text: 'Organization updated.' });
      onSaved();
    } catch (err: unknown) {
      setOrgMsg({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setOrgSaving(false);
    }
  }

  return (
    <div className="bg-bg-surface border border-border-default rounded-xl p-5.5">
      <div className="text-sm font-bold text-text-primary tracking-wide mb-4">Organization Details</div>
      {orgMsg && (
        <Alert variant={orgMsg.type === 'success' ? 'success' : 'error'} className="mb-4">
          {orgMsg.text}
        </Alert>
      )}
      <form onSubmit={handleOrgSave} className="flex items-end gap-3 max-md:flex-col max-md:items-stretch">
        <div className="flex-1 mb-0">
          <label className="block text-[13px] font-semibold text-text-secondary mb-1.5">Organization Name</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full bg-bg-surface border border-border-default text-text-primary px-3.5 py-2.5 rounded-lg text-sm font-sans outline-none transition-colors duration-200 box-border focus:border-border-focus"
          />
        </div>
        <button
          type="submit"
          className="bg-[#ededed] text-[#0a0a0a] border-none px-5 py-2.5 rounded-lg cursor-pointer text-sm font-semibold font-sans transition-colors duration-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={orgSaving}
        >
          {orgSaving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}

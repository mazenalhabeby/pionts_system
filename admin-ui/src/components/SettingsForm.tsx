import { useState, useEffect } from 'react';
import { getErrorMessage } from '../api';
import type { SettingGroup, SettingField } from '../constants';
import { Alert } from './ui/alert';

interface SettingsFormProps {
  groups: SettingGroup[];
  values: Record<string, string | number>;
  onSave?: (settings: Record<string, string>) => Promise<void>;
}

export default function SettingsForm({ groups, values, onSave }: SettingsFormProps) {
  const [form, setForm] = useState<Record<string, string | number>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (values) {
      setForm({ ...values });
    }
  }, [values]);

  function handleChange(key: string, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const stringForm: Record<string, string> = {};
      for (const [k, v] of Object.entries(form)) {
        stringForm[k] = String(v);
      }
      await onSave!(stringForm);
      setMessage({ type: 'success', text: 'Settings saved successfully.' });
    } catch (err: unknown) {
      setMessage({ type: 'error', text: getErrorMessage(err) || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  }

  function renderField(field: SettingField) {
    const val = form[field.key] != null ? String(form[field.key]) : '';

    if (field.type === 'select' && field.options) {
      return (
        <select
          value={val}
          onChange={(e) => handleChange(field.key, e.target.value)}
          className="w-36 bg-bg-surface border border-border-default text-text-primary p-1.5 rounded-md font-sans outline-none transition-colors duration-200 focus:border-border-focus text-sm"
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'toggle') {
      const checked = val === 'true';
      return (
        <button
          type="button"
          onClick={() => handleChange(field.key, checked ? 'false' : 'true')}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
            checked ? 'bg-primary' : 'bg-border-default'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      );
    }

    if (field.type === 'text') {
      return (
        <input
          type="text"
          value={val}
          onChange={(e) => handleChange(field.key, e.target.value)}
          className="w-36 bg-bg-surface border border-border-default text-text-primary p-1.5 rounded-md font-sans outline-none transition-colors duration-200 focus:border-border-focus text-sm"
        />
      );
    }

    // Default: number input
    return (
      <input
        type="number"
        value={val}
        onChange={(e) => handleChange(field.key, e.target.value)}
        className="w-20 text-center bg-bg-surface border border-border-default text-text-primary p-1.5 rounded-md font-sans outline-none transition-colors duration-200 focus:border-border-focus"
      />
    );
  }

  return (
    <form onSubmit={handleSave}>
      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'} className="mb-4">
          {message.text}
        </Alert>
      )}

      {groups.map((group) => (
        <div key={group.title} className="bg-bg-surface border border-border-default rounded-xl p-5.5 mb-4">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-text-primary tracking-wide m-0 mb-3.5">{group.title}</h2>
            <div className="grid grid-cols-2 gap-3 max-w-[600px]">
              {group.fields.map((field) => (
                <label key={field.key} className="flex justify-between items-center text-sm text-text-secondary">
                  <span>{field.label}</span>
                  {renderField(field)}
                </label>
              ))}
            </div>
          </div>
        </div>
      ))}

      {onSave && (
        <button
          type="submit"
          disabled={saving}
          className="mt-1 bg-[#ededed] text-[#0a0a0a] border-none px-4 py-2 rounded-md cursor-pointer text-sm font-semibold font-sans transition-all duration-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      )}
    </form>
  );
}

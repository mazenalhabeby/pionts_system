import React, { useState, useCallback } from 'react';
import { useWidgetConfig } from '../context/WidgetConfigContext';
import { useI18n } from '../i18n';

export default function CompleteProfilePage() {
  const { api, settings, refresh, customer } = useWidgetConfig();
  const { t } = useI18n();
  const [name, setName] = useState(customer?.name || '');
  const [bdayMonth, setBdayMonth] = useState('01');
  const [bdayDay, setBdayDay] = useState('01');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const needsName = !customer?.name;
  const needsBirthday = !customer?.birthday;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const data: { name?: string; birthday?: string } = {};
    if (needsName) {
      if (!name.trim() || name.trim().length < 2) {
        setError(t('profile.error_name'));
        return;
      }
      data.name = name.trim();
    }
    if (needsBirthday) {
      data.birthday = `${bdayMonth}-${bdayDay}`;
    }

    setLoading(true);
    try {
      await api.updateProfile(data);
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('profile.error_save'));
    } finally {
      setLoading(false);
    }
  }, [api, name, bdayMonth, bdayDay, needsName, needsBirthday, refresh, t]);

  return (
    <div className="pw-login">
      <div className="pw-login__card">
        <div className="pw-login__accent" />
        <div className="pw-login__body">
          <h1 className="pw-login__title">{String(settings?.widget_brand_name || 'Rewards')}</h1>
          <p className="pw-login__desc">{t('profile.title')}</p>

          {error && <div className="pw-error" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            {needsName && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                  {t('profile.label_name')}
                </label>
                <input
                  type="text"
                  placeholder={t('profile.placeholder_name')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="pw-input"
                />
              </div>
            )}

            {needsBirthday && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                  {t('profile.label_birthday')}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value={bdayMonth}
                    onChange={(e) => setBdayMonth(e.target.value)}
                    className="pw-input"
                    style={{ flex: 2 }}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{t(`months.${i + 1}`)}</option>
                    ))}
                  </select>
                  <select
                    value={bdayDay}
                    onChange={(e) => setBdayDay(e.target.value)}
                    className="pw-input"
                    style={{ flex: 1 }}
                  >
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="pw-btn pw-btn--primary pw-btn--full"
              style={{ padding: '12px 16px' }}
            >
              {loading ? t('profile.btn_saving') : t('profile.btn_continue')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

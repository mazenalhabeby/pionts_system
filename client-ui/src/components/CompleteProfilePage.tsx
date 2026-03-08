import React, { useState, useCallback } from 'react';
import { useWidgetConfig } from '../context/WidgetConfigContext';
import { useI18n } from '../i18n';

export default function CompleteProfilePage() {
  const { api, settings, refresh, customer } = useWidgetConfig();
  const { t } = useI18n();

  // Parse existing birthday if available (supports both MM-DD and YYYY-MM-DD formats)
  const existingBirthday = customer?.birthday;
  let initialYear = '';
  let initialMonth = '01';
  let initialDay = '01';

  if (existingBirthday) {
    const parts = existingBirthday.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD format
      [initialYear, initialMonth, initialDay] = parts;
    } else if (parts.length === 2) {
      // MM-DD format (old)
      [initialMonth, initialDay] = parts;
    }
  }

  const [name, setName] = useState(customer?.name || '');
  const [bdayYear, setBdayYear] = useState(initialYear);
  const [bdayMonth, setBdayMonth] = useState(initialMonth);
  const [bdayDay, setBdayDay] = useState(initialDay);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const needsName = !customer?.name;
  const needsBirthday = !customer?.birthday || customer.birthday.split('-').length === 2; // Also update old MM-DD format
  const brandName = String(settings?.widget_brand_name || 'Rewards');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const data: { name?: string; birthday?: string } = {};

    // Name is now ALWAYS required
    if (!name.trim() || name.trim().length < 2) {
      setError(t('profile.error_name'));
      return;
    }
    data.name = name.trim();

    // Birthday with year is now ALWAYS required
    if (!bdayYear || !bdayMonth || !bdayDay) {
      setError('Please enter your complete birth date including year');
      return;
    }

    // Validate age (must be reasonable - between 13 and 120 years old)
    const birthDate = new Date(parseInt(bdayYear), parseInt(bdayMonth) - 1, parseInt(bdayDay));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 13) {
      setError('You must be at least 13 years old to use this service');
      return;
    }
    if (age > 120) {
      setError('Please enter a valid birth date');
      return;
    }

    data.birthday = `${bdayYear}-${bdayMonth.padStart(2, '0')}-${bdayDay.padStart(2, '0')}`;

    setLoading(true);
    try {
      await api.updateProfile(data);
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('profile.error_save'));
    } finally {
      setLoading(false);
    }
  }, [api, name, bdayYear, bdayMonth, bdayDay, refresh, t]);

  return (
    <div className="pw-login">
      {/* Left side — Form */}
      <div className="pw-login__content">
        <div className="pw-login__content-inner">
          <h1 className="pw-login__heading">
            {brandName}
            <br />
            <span className="pw-login__heading-accent">{t('profile.heading')}</span>
          </h1>
          <p className="pw-login__subtitle">{t('profile.title')}</p>

          {error && <div className="pw-error pw-profile__error">{error}</div>}

          <form onSubmit={handleSubmit} className="pw-login__form">
            <div className="pw-profile__field">
              <label className="pw-profile__label">{t('profile.label_name')} *</label>
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

            <div className="pw-profile__field">
              <label className="pw-profile__label">{t('profile.label_birthday')} *</label>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                Required for age verification and birthday rewards
              </div>
              <div className="pw-profile__bday-row">
                <select
                  value={bdayDay}
                  onChange={(e) => setBdayDay(e.target.value)}
                  className="pw-input pw-profile__select pw-profile__select--day"
                  required
                >
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                  ))}
                </select>
                <select
                  value={bdayMonth}
                  onChange={(e) => setBdayMonth(e.target.value)}
                  className="pw-input pw-profile__select pw-profile__select--month"
                  required
                >
                  <option value="">Month</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>{t(`months.${i + 1}`)}</option>
                  ))}
                </select>
                <select
                  value={bdayYear}
                  onChange={(e) => setBdayYear(e.target.value)}
                  className="pw-input pw-profile__select"
                  style={{ flex: 1 }}
                  required
                >
                  <option value="">Year</option>
                  {Array.from({ length: 108 }, (_, i) => {
                    const year = new Date().getFullYear() - 13 - i; // 13 to 120 years old
                    return <option key={year} value={String(year)}>{year}</option>;
                  })}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="pw-btn pw-btn--primary pw-btn--full pw-profile__submit"
            >
              {loading ? t('profile.btn_saving') : t('profile.btn_continue')}
            </button>
          </form>
        </div>
      </div>

      {/* Right side — Visual showcase */}
      <div className="pw-login__visual">
        <div className="pw-login__scene">
          <div className="pw-login__float pw-login__float--gift1">{'\uD83D\uDC4B'}</div>
          <div className="pw-login__float pw-login__float--gift2">{'\uD83C\uDF89'}</div>
          <div className="pw-login__float pw-login__float--coin1">{'\uD83E\uDE99'}</div>
          <div className="pw-login__float pw-login__float--coin2">{'\u2B50'}</div>
          <div className="pw-login__float pw-login__float--star1">{'\uD83C\uDF82'}</div>
          <div className="pw-login__float pw-login__float--star2">{'\u2728'}</div>
          <div className="pw-login__float pw-login__float--confetti1">{'\uD83C\uDF81'}</div>
          <div className="pw-login__float pw-login__float--heart">{'\u2764\uFE0F'}</div>

          <div className="pw-login__reward-card">
            <div className="pw-login__reward-icon">{'\uD83D\uDE80'}</div>
            <div className="pw-login__reward-pts">{t('profile.almost_there')}</div>
            <div className="pw-login__reward-label">{t('profile.one_more_step')}</div>
          </div>

          <div className="pw-login__mini-card pw-login__mini-card--top">
            <span>{'\uD83C\uDF82'}</span> {t('profile.birthday_bonus')}
          </div>
          <div className="pw-login__mini-card pw-login__mini-card--bottom">
            <span>{'\uD83C\uDFC6'}</span> {t('profile.earn_rewards')}
          </div>
        </div>
      </div>

      <div className="pw-login__stripe" />
    </div>
  );
}

import React, { useState, useCallback, useMemo } from 'react';
import { useWidgetConfig } from '../context/WidgetConfigContext';
import { useI18n } from '../i18n';
import type { PartnerApplyData } from '@pionts/shared';
import * as IBAN from 'iban';

const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'website'] as const;

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  twitter: 'X / Twitter',
  facebook: 'Facebook',
  website: 'Blog / Website',
};

const PLATFORM_URL_PATTERNS: Record<string, RegExp> = {
  instagram: /^https?:\/\/(www\.)?instagram\.com\/[\w.]+\/?$/i,
  tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@[\w.]+\/?$/i,
  youtube: /^https?:\/\/(www\.)?(youtube\.com\/(c\/|channel\/|user\/|@)[\w-]+|youtu\.be\/[\w-]+)\/?$/i,
  twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[\w]+\/?$/i,
  facebook: /^https?:\/\/(www\.)?facebook\.com\/[\w.]+\/?$/i,
  website: /^https?:\/\/.+\..+$/i,
};

const PLATFORM_PLACEHOLDERS: Record<string, string> = {
  instagram: 'https://instagram.com/yourname',
  tiktok: 'https://tiktok.com/@yourname',
  youtube: 'https://youtube.com/@yourchannel',
  twitter: 'https://x.com/yourname',
  facebook: 'https://facebook.com/yourpage',
  website: 'https://yourblog.com',
};

const COUNTRIES = [
  'Germany', 'Austria', 'Switzerland', 'Netherlands', 'Belgium', 'France',
  'United Kingdom', 'United States', 'Canada', 'Spain', 'Italy', 'Portugal',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Czech Republic',
  'Ireland', 'Australia', 'Other',
];

interface Props {
  onClose: () => void;
}

export default function PartnerApplyForm({ onClose }: Props) {
  const { api, refresh, settings, customer } = useWidgetConfig();
  const { t } = useI18n();
  const brandName = String(settings?.widget_brand_name || 'Rewards');

  // Pre-fill DOB from customer profile if available (YYYY-MM-DD format)
  const existingBirthday = customer?.birthday;
  let initialYear = '';
  let initialMonth = '';
  let initialDay = '';

  if (existingBirthday) {
    const parts = existingBirthday.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD format
      [initialYear, initialMonth, initialDay] = parts;
    }
  }

  // DOB
  const [dobYear, setDobYear] = useState(initialYear);
  const [dobMonth, setDobMonth] = useState(initialMonth);
  const [dobDay, setDobDay] = useState(initialDay);

  // Social media
  const [activePlatforms, setActivePlatforms] = useState<Set<string>>(new Set());
  const [socialUrls, setSocialUrls] = useState<Record<string, string>>({});
  const [socialFollowers, setSocialFollowers] = useState<Record<string, string>>({});

  // Address
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  // IBAN
  const [iban, setIban] = useState('');
  const [ibanTouched, setIbanTouched] = useState(false);

  // Validation state
  const [urlErrors, setUrlErrors] = useState<Record<string, string>>({});

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ status: string; reason?: string } | null>(null);

  const togglePlatform = useCallback((p: string) => {
    setActivePlatforms(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  }, []);

  const updateSocialUrl = useCallback((platform: string, url: string) => {
    setSocialUrls(prev => ({ ...prev, [platform]: url }));
  }, []);

  const updateSocialFollowers = useCallback((platform: string, val: string) => {
    setSocialFollowers(prev => ({ ...prev, [platform]: val }));
  }, []);

  // Client-side age check
  const getAge = (): number | null => {
    if (!dobYear || !dobMonth || !dobDay) return null;
    const dob = new Date(parseInt(dobYear), parseInt(dobMonth) - 1, parseInt(dobDay));
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  };

  const age = getAge();
  const isUnder18 = age !== null && age < 18;

  // IBAN validation
  const ibanValid = useMemo(() => {
    if (!iban.trim()) return null;
    const normalized = iban.replace(/\s/g, '').toUpperCase();
    return IBAN.isValid(normalized);
  }, [iban]);

  // Validate social media URL
  const validateSocialUrl = useCallback((platform: string, url: string): string | null => {
    if (!url.trim()) return null;
    const pattern = PLATFORM_URL_PATTERNS[platform];
    if (!pattern) return null;
    if (!pattern.test(url.trim())) {
      return `Please enter a valid ${PLATFORM_LABELS[platform]} URL`;
    }
    return null;
  }, []);

  // Handle social URL change with validation
  const handleSocialUrlChange = useCallback((platform: string, url: string) => {
    updateSocialUrl(platform, url);
    // Validate on change
    if (url.trim()) {
      const error = validateSocialUrl(platform, url);
      setUrlErrors(prev => ({
        ...prev,
        [platform]: error || '',
      }));
    } else {
      setUrlErrors(prev => {
        const next = { ...prev };
        delete next[platform];
        return next;
      });
    }
  }, [updateSocialUrl, validateSocialUrl]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!dobYear || !dobMonth || !dobDay) {
      setError(t('apply.error_dob'));
      return;
    }
    if (activePlatforms.size === 0) {
      setError(t('apply.error_social'));
      return;
    }
    // Validate all social media URLs
    for (const p of activePlatforms) {
      if (!socialUrls[p]?.trim()) {
        setError(t('apply.error_social_url', { platform: PLATFORM_LABELS[p] }));
        return;
      }
      const urlError = validateSocialUrl(p, socialUrls[p]);
      if (urlError) {
        setError(urlError);
        return;
      }
    }
    if (!address.trim() || !city.trim() || !postalCode.trim() || !country) {
      setError(t('apply.error_address'));
      return;
    }
    if (!iban.trim()) {
      setError(t('apply.error_iban'));
      return;
    }
    // Validate IBAN format
    const normalized = iban.replace(/\s/g, '').toUpperCase();
    if (!IBAN.isValid(normalized)) {
      setError('Please enter a valid IBAN');
      return;
    }

    const dateOfBirth = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
    const socialMedia = Array.from(activePlatforms).map(p => ({
      platform: p,
      url: socialUrls[p]?.trim() || '',
      followers: socialFollowers[p]?.trim() || undefined,
    }));

    const data: PartnerApplyData = {
      dateOfBirth,
      socialMedia,
      address: address.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      country,
      iban: iban.trim().replace(/\s/g, ''),
    };

    setLoading(true);
    try {
      const res = await api.applyPartner(data);
      setResult({ status: res.status, reason: res.reason });
      if (res.success) {
        refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('apply.error_generic'));
    } finally {
      setLoading(false);
    }
  }, [api, dobYear, dobMonth, dobDay, activePlatforms, socialUrls, socialFollowers, address, city, postalCode, country, iban, refresh, t, validateSocialUrl]);

  // Build year options (18-80 years ago)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 63 }, (_, i) => currentYear - 18 - i);

  // Result screens
  if (result) {
    const approved = result.status === 'approved';
    return (
      <div className="pw-login">
        <div className="pw-login__card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>
            {approved ? '\u2705' : '\u274C'}
          </div>
          <h1 className="pw-login__heading">
            <span className="pw-login__heading-accent">
              {approved ? t('apply.result_approved_title') : t('apply.result_rejected_title')}
            </span>
          </h1>
          <p className="pw-login__subtitle">
            {approved ? t('apply.result_approved_desc') : t('apply.result_rejected_desc')}
          </p>
          <button
            type="button"
            className="pw-btn pw-btn--primary pw-btn--full pw-profile__submit"
            onClick={onClose}
          >
            {approved ? t('apply.btn_done') : t('apply.btn_close')}
          </button>
        </div>
        <div className="pw-login__accent-line" />
      </div>
    );
  }

  return (
    <div className="pw-login pw-apply-form">
      <div className="pw-login__card">
        <button type="button" className="pw-apply-form__back" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('apply.back')}
        </button>

        <h1 className="pw-login__heading">
          {brandName}
          <br />
          <span className="pw-login__heading-accent">{t('apply.heading')}</span>
        </h1>
        <p className="pw-login__subtitle">{t('apply.subtitle')}</p>

        {error && <div className="pw-error pw-profile__error">{error}</div>}

        <form onSubmit={handleSubmit} className="pw-login__form">
          {/* Section 1: Date of Birth */}
          <div className="pw-apply-form__section">
            <div className="pw-apply-form__section-title">{t('apply.section_dob')} *</div>
            <div className="pw-apply-form__field-hint" style={{ marginBottom: '12px' }}>
              You must be 18 or older to become a partner
            </div>
            <div className="pw-profile__bday-row">
              <select
                value={dobDay}
                onChange={(e) => setDobDay(e.target.value)}
                className="pw-input pw-profile__select pw-profile__select--day"
              >
                <option value="">{t('apply.day')}</option>
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                ))}
              </select>
              <select
                value={dobMonth}
                onChange={(e) => setDobMonth(e.target.value)}
                className="pw-input pw-profile__select pw-profile__select--month"
              >
                <option value="">{t('apply.month')}</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1)}>{t(`months.${i + 1}`)}</option>
                ))}
              </select>
              <select
                value={dobYear}
                onChange={(e) => setDobYear(e.target.value)}
                className="pw-input pw-profile__select"
                style={{ flex: 1 }}
              >
                <option value="">{t('apply.year')}</option>
                {years.map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
            {isUnder18 && (
              <div className="pw-apply-form__age-warn">{t('apply.age_warning')}</div>
            )}
          </div>

          {/* Section 2: Social Media */}
          <div className="pw-apply-form__section">
            <div className="pw-apply-form__section-title">{t('apply.section_social')} *</div>
            <p className="pw-apply-form__section-hint">
              {t('apply.social_hint')}. We'll review your account before approval.
            </p>
            <div className="pw-apply-form__chips">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  type="button"
                  className={`pw-apply-form__chip${activePlatforms.has(p) ? ' pw-apply-form__chip--active' : ''}`}
                  onClick={() => togglePlatform(p)}
                >
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
            {Array.from(activePlatforms).map(p => {
              const urlValue = socialUrls[p] || '';
              const urlError = urlErrors[p];
              const urlIsValid = urlValue.trim() && !urlError && validateSocialUrl(p, urlValue) === null;

              return (
                <div key={p} className="pw-apply-form__field-group">
                  <label className="pw-profile__label">{PLATFORM_LABELS[p]} *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="url"
                      placeholder={PLATFORM_PLACEHOLDERS[p]}
                      value={urlValue}
                      onChange={(e) => handleSocialUrlChange(p, e.target.value)}
                      className={`pw-input${urlError ? ' pw-input--error' : ''}${urlIsValid ? ' pw-input--valid' : ''}`}
                      style={{ paddingRight: urlIsValid ? '36px' : '12px' }}
                    />
                    {urlIsValid && (
                      <span className="pw-apply-form__url-valid">✓</span>
                    )}
                  </div>
                  {urlError && (
                    <div className="pw-apply-form__url-error">{urlError}</div>
                  )}
                  <input
                    type="text"
                    placeholder={t('apply.placeholder_followers')}
                    value={socialFollowers[p] || ''}
                    onChange={(e) => updateSocialFollowers(p, e.target.value)}
                    className="pw-input"
                    style={{ marginTop: '6px' }}
                  />
                  <div className="pw-apply-form__field-hint">
                    Optional: Approximate follower/subscriber count
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section 3: Address */}
          <div className="pw-apply-form__section">
            <div className="pw-apply-form__section-title">{t('apply.section_address')} *</div>
            <div className="pw-apply-form__field-hint" style={{ marginBottom: '12px' }}>
              Required for contract and tax purposes
            </div>
            <div className="pw-profile__field">
              <label className="pw-profile__label">{t('apply.label_address')} *</label>
              <input
                type="text"
                placeholder={t('apply.placeholder_address')}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pw-input"
              />
            </div>
            <div className="pw-profile__bday-row">
              <div className="pw-profile__field" style={{ flex: 2 }}>
                <label className="pw-profile__label">{t('apply.label_city')} *</label>
                <input
                  type="text"
                  placeholder={t('apply.placeholder_city')}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="pw-input"
                />
              </div>
              <div className="pw-profile__field" style={{ flex: 1 }}>
                <label className="pw-profile__label">{t('apply.label_postal')} *</label>
                <input
                  type="text"
                  placeholder={t('apply.placeholder_postal')}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="pw-input"
                />
              </div>
            </div>
            <div className="pw-profile__field">
              <label className="pw-profile__label">{t('apply.label_country')} *</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="pw-input pw-profile__select"
              >
                <option value="">{t('apply.placeholder_country')}</option>
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 4: IBAN */}
          <div className="pw-apply-form__section">
            <div className="pw-apply-form__section-title">{t('apply.section_iban')}</div>
            <div className="pw-apply-form__iban-notice">
              <strong>Important:</strong> This is where you'll receive your partner commission payouts. Make sure the IBAN is correct and belongs to you.
            </div>
            <div className="pw-profile__field">
              <label className="pw-profile__label">{t('apply.label_iban')} *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="DE89 3704 0044 0532 0130 00"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  onBlur={() => setIbanTouched(true)}
                  className={`pw-input${ibanTouched && ibanValid === false ? ' pw-input--error' : ''}${ibanValid === true ? ' pw-input--valid' : ''}`}
                  style={{
                    paddingRight: ibanValid === true ? '36px' : '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                  maxLength={34}
                />
                {ibanValid === true && (
                  <span className="pw-apply-form__url-valid">✓</span>
                )}
              </div>
              {ibanTouched && ibanValid === false && (
                <div className="pw-apply-form__url-error">
                  Invalid IBAN format. Please check and try again.
                </div>
              )}
              {ibanValid === true && (
                <div style={{ color: '#10b981', fontSize: '12px', marginTop: '4px' }}>
                  ✓ Valid IBAN format
                </div>
              )}
              <div className="pw-apply-form__field-hint">
                Your IBAN is securely encrypted and only used for commission payouts
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="pw-btn pw-btn--primary pw-btn--full pw-profile__submit"
          >
            {loading ? t('apply.btn_submitting') : t('apply.btn_submit')}
          </button>
        </form>
      </div>

      <div className="pw-login__accent-line" />
    </div>
  );
}

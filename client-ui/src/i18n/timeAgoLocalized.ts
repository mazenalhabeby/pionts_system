import { useCallback } from 'react';
import { useI18n } from './I18nContext';

export function useTimeAgo() {
  const { t, tPlural } = useI18n();

  return useCallback((dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return t('time.just_now');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return tPlural('time.minutes', minutes);
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return tPlural('time.hours', hours);
    const days = Math.floor(hours / 24);
    if (days < 7) return tPlural('time.days', days);
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return tPlural('time.weeks', weeks);
    const months = Math.floor(days / 30);
    if (months < 12) return tPlural('time.months', months);
    const years = Math.floor(days / 365);
    return tPlural('time.years', years);
  }, [t, tPlural]);
}

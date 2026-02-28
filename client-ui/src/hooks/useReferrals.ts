import { useCallback } from 'react';
import { useFetch } from '@pionts/shared';
import type { ReferralData, UseFetchResult } from '@pionts/shared';
import { useWidgetConfig } from '../context/WidgetConfigContext';

export default function useReferrals(): UseFetchResult<ReferralData> {
  const { api } = useWidgetConfig();
  const apiFn = useCallback(() => api.getMyReferrals(), [api]);
  return useFetch<ReferralData>(apiFn, [apiFn]);
}

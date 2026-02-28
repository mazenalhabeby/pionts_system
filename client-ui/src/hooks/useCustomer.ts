import { useCallback } from 'react';
import { useFetch } from '@pionts/shared';
import type { CustomerData, UseFetchResult } from '@pionts/shared';
import { useWidgetConfig } from '../context/WidgetConfigContext';

export default function useCustomer(): UseFetchResult<CustomerData> {
  const { api, mode, customer, refresh: sdkRefresh } = useWidgetConfig();

  // In SDK mode, customer data is already loaded by WidgetContext
  const apiFn = useCallback(() => {
    if (mode === 'sdk' && customer) return Promise.resolve(customer);
    return api.getCustomer();
  }, [api, mode, customer]);

  const result = useFetch<CustomerData>(apiFn, [apiFn]);

  // In SDK mode, use the global refresh from WidgetContext
  if (mode === 'sdk') {
    return { ...result, data: customer || result.data, refresh: sdkRefresh };
  }

  return result;
}

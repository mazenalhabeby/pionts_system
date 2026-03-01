import { useCallback } from 'react';
import { useFetch } from '@pionts/shared';
import type { CustomerData, UseFetchResult } from '@pionts/shared';
import { useWidgetConfig } from '../context/WidgetConfigContext';

export default function useCustomer(): UseFetchResult<CustomerData> {
  const { api, customer, refresh: widgetRefresh } = useWidgetConfig();

  // Customer data is already loaded by WidgetContext; fall back to API call
  const apiFn = useCallback(() => {
    if (customer) return Promise.resolve(customer);
    return api.getCustomer();
  }, [api, customer]);

  const result = useFetch<CustomerData>(apiFn, [apiFn]);

  return { ...result, data: customer || result.data, refresh: widgetRefresh };
}

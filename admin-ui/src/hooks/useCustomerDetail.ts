import { useCallback } from 'react';
import { dashboardApi } from '../api';
import { useProject } from '../context/ProjectContext';
import { useFetch } from '@pionts/shared';

export default function useCustomerDetail(id: string | number) {
  const { currentProject } = useProject();
  const pid = currentProject?.id;
  return useFetch(
    useCallback(() => pid ? dashboardApi.getCustomer(pid, id) : Promise.resolve(null), [pid, id]),
    [pid, id],
  );
}

import { getAccessToken } from '../../api';

interface Props {
  projectId: number | string;
  from?: string;
  to?: string;
}

function downloadWithAuth(url: string, filename: string) {
  const token = getAccessToken();
  fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  })
    .then((res) => {
      if (!res.ok) throw new Error('Export failed');
      return res.blob();
    })
    .then((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch((err) => alert(err.message));
}

export default function ExportButtons({ projectId, from, to }: Props) {
  const handleExportCustomers = () => {
    downloadWithAuth(
      `/api/v1/projects/${projectId}/analytics/export/customers`,
      'customers.csv',
    );
  };

  const handleExportPointsLog = () => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    downloadWithAuth(
      `/api/v1/projects/${projectId}/analytics/export/points-log${qs ? '?' + qs : ''}`,
      'points-log.csv',
    );
  };

  const btnClass = 'px-4 py-2 text-[12px] font-semibold border border-border-default rounded-lg text-text-secondary bg-transparent cursor-pointer font-sans transition-all duration-200 hover:bg-bg-surface-hover hover:border-border-focus/50 hover:text-text-primary active:scale-[0.97]';

  return (
    <div className="flex gap-2.5">
      <button onClick={handleExportCustomers} className={btnClass}>
        Export Customers
      </button>
      <button onClick={handleExportPointsLog} className={btnClass}>
        Export Points Log
      </button>
    </div>
  );
}

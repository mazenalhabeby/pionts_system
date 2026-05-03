import { useState, useEffect } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { useProjectId } from '../../hooks/useProjectId';
import { SectionCard, SectionTitle, Label, HelpText } from './shared';

interface WebhookEndpoint {
  id: number;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  _count?: { deliveries: number };
}

interface DeliveryLog {
  id: number;
  eventType: string;
  eventId: string;
  status: string;
  attempts: number;
  lastError: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

const AVAILABLE_EVENTS = [
  'redemption.created',
  'redemption.cancelled',
  'redemption.used',
  'order.points_awarded',
  'customer.created',
  'test',
];

export function WebhooksTab() {
  const projectId = useProjectId();
  const { data: endpoints, refetch } = useFetch<WebhookEndpoint[]>(`/api/v1/projects/${projectId}/webhooks`, []);
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['redemption.created', 'redemption.cancelled']);
  const [adding, setAdding] = useState(false);
  const [viewLogs, setViewLogs] = useState<number | null>(null);
  const [logs, setLogs] = useState<DeliveryLog[]>([]);

  const handleAdd = async () => {
    if (!url.trim()) return;
    setAdding(true);
    try {
      await fetch(`/api/v1/projects/${projectId}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: url.trim(), events: selectedEvents }),
      });
      setUrl('');
      refetch();
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/v1/projects/${projectId}/webhooks/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    refetch();
  };

  const handleTest = async (id: number) => {
    await fetch(`/api/v1/projects/${projectId}/webhooks/${id}/test`, {
      method: 'POST',
      credentials: 'include',
    });
    alert('Test event sent!');
  };

  const loadLogs = async (id: number) => {
    setViewLogs(id);
    const res = await fetch(`/api/v1/projects/${projectId}/webhooks/${id}/logs`, {
      credentials: 'include',
    });
    if (res.ok) setLogs(await res.json());
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  return (
    <div className="space-y-6">
      <SectionCard>
        <SectionTitle>Webhook Endpoints</SectionTitle>
        <HelpText>
          Register URLs to receive real-time event notifications. Each delivery includes
          an HMAC-SHA256 signature in the <code>X-Pionts-Signature</code> header.
        </HelpText>

        {/* Add new endpoint */}
        <div className="mt-4 space-y-3">
          <div>
            <Label>Endpoint URL</Label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourshop.com/webhooks/pionts"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <Label>Events</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_EVENTS.map((event) => (
                <label key={event} className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event)}
                    onChange={() => toggleEvent(event)}
                  />
                  {event}
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={adding || !url.trim() || selectedEvents.length === 0}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add Endpoint'}
          </button>
        </div>
      </SectionCard>

      {/* Registered endpoints */}
      {endpoints && endpoints.length > 0 && (
        <SectionCard>
          <SectionTitle>Registered Endpoints</SectionTitle>
          <div className="mt-3 space-y-3">
            {endpoints.map((ep) => (
              <div key={ep.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <code className="text-sm font-medium">{ep.url}</code>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {ep.events.map((e) => (
                        <span key={e} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium">
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTest(ep.id)}
                      className="rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => loadLogs(ep.id)}
                      className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium"
                    >
                      Logs
                    </button>
                    <button
                      onClick={() => handleDelete(ep.id)}
                      className="rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Delivery logs */}
      {viewLogs !== null && (
        <SectionCard>
          <div className="flex items-center justify-between">
            <SectionTitle>Delivery Logs</SectionTitle>
            <button onClick={() => setViewLogs(null)} className="text-xs text-gray-500">
              Close
            </button>
          </div>
          <div className="mt-3 max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-gray-400">No deliveries yet</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-1">Event</th>
                    <th>Status</th>
                    <th>Attempts</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50">
                      <td className="py-1.5">{log.eventType}</td>
                      <td>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            log.status === 'delivered'
                              ? 'bg-green-50 text-green-600'
                              : log.status === 'failed'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-yellow-50 text-yellow-600'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td>{log.attempts}</td>
                      <td className="text-gray-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

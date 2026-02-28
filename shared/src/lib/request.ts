export interface RequestOptions extends RequestInit {
  _retried?: boolean;
}

export async function baseRequest(url: string, options: RequestOptions = {}): Promise<unknown> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message || `Request failed (${res.status})`,
    );
  }

  return res.json();
}

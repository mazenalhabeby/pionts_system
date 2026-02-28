/**
 * Resolves projectId from session or falls back to default project (ID=1).
 * Used by controllers until full JWT + API key auth is implemented.
 */
export function resolveProjectId(session: any): number {
  return session?.projectId || 1;
}

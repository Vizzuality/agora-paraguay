/** Imported by vite.config.ts, so no `@/` imports here. */

/**
 * The backend origin the `/api` relay forwards to. It doubles as the relayed Origin header,
 * which the backend's CSRF check compares exactly, so a trailing slash (`…:8082/`) fails every
 * POST with 403.
 */
export function proxyTarget(raw: string | undefined): string {
  return (raw?.trim() || 'http://localhost:8000').replace(/\/+$/, '');
}

import { env } from '@/env';

/**
 * The transport every domain client shares: base URL, the Django session/CSRF
 * conventions, and one error type. Domain modules (`auth/`, `parcels/`, ...) own their
 * endpoints and schemas; this file only knows how to reach the API.
 */

/** Same origin unless a deployed build points elsewhere (`VITE_API_URL`). */
export const API_URL = env.VITE_API_URL ?? '';

/** The value of `name` in a `document.cookie` string, or `null`. */
export function cookieValue(cookies: string, name: string): string | null {
  for (const entry of cookies.split(';')) {
    const separator = entry.indexOf('=');

    if (separator > 0 && entry.slice(0, separator).trim() === name) {
      return decodeURIComponent(entry.slice(separator + 1).trim()) || null;
    }
  }

  return null;
}

/**
 * Django's CSRF token, left in the `csrftoken` cookie by the login flow. Readable only
 * while the API is same-origin (the dev proxy, or served under `/api`).
 */
export function csrfToken(): string | null {
  return cookieValue(globalThis.document?.cookie ?? '', 'csrftoken');
}

/** A failed request: a non-2xx status, or no response at all (`status: null`). */
export class ApiError extends Error {
  readonly path: string;
  readonly status: number | null;

  constructor(path: string, status: number | null) {
    super(
      status === null
        ? `Request to ${path} failed`
        : `Request to ${path} failed with HTTP ${status}`,
    );
    this.name = 'ApiError';
    this.path = path;
    this.status = status;
  }
}

/**
 * Sends the request with the session cookie and returns the JSON body (`null` when
 * empty). Callers parse the result through their Zod schema — this layer returns
 * `unknown` on purpose so no contract check can be skipped.
 */
async function send(path: string, init: RequestInit): Promise<unknown> {
  let response: Response;

  try {
    // `credentials: 'include'` keeps the session cookie flowing when `API_URL` is
    // another origin.
    response = await fetch(`${API_URL}${path}`, { credentials: 'include', ...init });
  } catch {
    // `fetch` rejects only when no response arrived at all (offline, DNS, CORS).
    throw new ApiError(path, null);
  }

  if (!response.ok) throw new ApiError(path, response.status);

  const text = await response.text();

  return text ? JSON.parse(text) : null;
}

/** GET with optional query parameters; `undefined` values are left out. */
export function getJson(
  path: string,
  params: Record<string, string | undefined> = {},
): Promise<unknown> {
  const query = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => entry[1] !== undefined),
  ).toString();

  return send(query ? `${path}?${query}` : path, { method: 'GET' });
}

/** POST a JSON body. Django rejects a session-authenticated POST without the CSRF header. */
export function postJson(path: string, body: unknown): Promise<unknown> {
  const token = csrfToken();

  return send(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token === null ? {} : { 'X-CSRFToken': token }),
    },
    body: JSON.stringify(body),
  });
}

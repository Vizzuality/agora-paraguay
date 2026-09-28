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
 * Django's CSRF token, left in the `csrftoken` cookie by the login flow or by
 * `ensureCsrfToken`. Readable only while the API is same-origin (the dev proxy, or
 * served under `/api`).
 */
export function csrfToken(): string | null {
  return cookieValue(globalThis.document?.cookie ?? '', 'csrftoken');
}

/** Where Django hands out a CSRF token (the view also sets the `csrftoken` cookie). */
export const CSRF_PATH = '/api/auth/csrf/';

/** The token fetch in flight, so parallel POSTs from a cold start share one round trip. */
let pendingCsrfToken: Promise<string | null> | null = null;

/**
 * The token a POST needs: the cookie when the login flow or an earlier POST already set
 * it, else fetched — Django protects the public analysis endpoints too, and an anonymous
 * visitor has no cookie until something asks for one. Best effort: when the token
 * endpoint is unreachable the POST goes out without the header and Django's 403 surfaces
 * as the `ApiError` it is.
 */
export async function ensureCsrfToken(): Promise<string | null> {
  const fromCookie = csrfToken();

  if (fromCookie !== null) return fromCookie;

  pendingCsrfToken ??= fetchCsrfToken().finally(() => {
    pendingCsrfToken = null;
  });

  return pendingCsrfToken;
}

/** Token from the body when the view echoes it (`{ csrfToken }`), else from the cookie it set. */
async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}${CSRF_PATH}`, { credentials: 'include' });

    if (!response.ok) return null;

    const text = await response.text();
    const body: unknown = text ? JSON.parse(text) : null;
    const echoed =
      typeof body === 'object' && body !== null && 'csrfToken' in body ? body.csrfToken : null;

    return (typeof echoed === 'string' && echoed !== '' ? echoed : null) ?? csrfToken();
  } catch {
    return null;
  }
}

/**
 * A failed request: a non-2xx status, or no response at all (`status: null`). `detail` is
 * the reason Django wrote in the body (`message` or `detail`), when it wrote one — what
 * a user can act on, where the status alone says nothing.
 */
export class ApiError extends Error {
  readonly path: string;
  readonly status: number | null;
  readonly detail: string | null;

  constructor(path: string, status: number | null, detail: string | null = null) {
    super(
      status === null
        ? `Request to ${path} failed`
        : `Request to ${path} failed with HTTP ${status}`,
    );
    this.name = 'ApiError';
    this.path = path;
    this.status = status;
    this.detail = detail;
  }
}

/** What to tell the user about a failed query: the API's own reason when it gave one, else the error message. */
export function errorReason(error: unknown): string {
  if (error instanceof ApiError && error.detail !== null) return error.detail;

  return error instanceof Error ? error.message : String(error);
}

/** The human-readable reason in an error body, if the JSON carries one under `message` or `detail`. */
function detailOf(text: string): string | null {
  try {
    const body: unknown = JSON.parse(text);

    if (typeof body !== 'object' || body === null) return null;

    for (const key of ['message', 'detail'] as const) {
      const value = (body as Record<string, unknown>)[key];

      if (typeof value === 'string' && value.trim() !== '') return value;
    }
  } catch {
    // Not JSON: nothing to quote.
  }

  return null;
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

  const text = await response.text();

  if (!response.ok) throw new ApiError(path, response.status, detailOf(text));

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

/** POST a JSON body. Django rejects any POST without the CSRF header, anonymous ones included. */
export async function postJson(path: string, body: unknown): Promise<unknown> {
  const token = await ensureCsrfToken();

  return send(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token === null ? {} : { 'X-CSRFToken': token }),
    },
    body: JSON.stringify(body),
  });
}

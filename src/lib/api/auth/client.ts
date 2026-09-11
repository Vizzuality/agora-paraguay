import { API_URL, ApiError, csrfToken, getJson, postJson } from '@/lib/api/http';

import {
  credentialsSchema,
  csrfResponseSchema,
  loginResponseSchema,
  meResponseSchema,
  sessionSchema,
  setPasswordSchema,
  type Credentials,
  type Session,
  type SetPasswordRequest,
} from './schemas';

/* Auth is real: Django session endpoints. */

/** Why a login failed, at the granularity the login card's copy distinguishes. */
export type LoginFailure = 'credentials' | 'unavailable';

export class LoginError extends Error {
  readonly reason: LoginFailure;
  readonly status: number | null;

  constructor(reason: LoginFailure, status: number | null) {
    super(status === null ? 'Login request failed' : `Login failed with HTTP ${status}`);
    this.name = 'LoginError';
    this.reason = reason;
    this.status = status;
  }
}

/** Statuses Django login views use for a rejected user/password (DRF 400, LoginView 401). */
const CREDENTIAL_STATUSES = new Set([400, 401]);

/**
 * Maps the login endpoint's HTTP status to what the user should be told. Network
 * failures (no status) are handled before this is called. Anything not a known
 * credentials rejection — 403 (CSRF), 429, 5xx — blames the server: retyping the
 * password would not help.
 */
function loginFailureReason(status: number): LoginFailure {
  return CREDENTIAL_STATUSES.has(status) ? 'credentials' : 'unavailable';
}

/**
 * Django session login: fetch a CSRF token (the endpoint also sets the `csrftoken`
 * cookie), then POST the credentials with the token echoed in `X-CSRFToken`. The
 * session itself is the cookie Django sets on success; `credentials: 'include'` keeps
 * both cookies flowing when `API_URL` is another origin.
 *
 * Hand-rolled rather than on `postJson` because the failure taxonomy (`LoginError`)
 * is richer than the shared `ApiError`.
 */
export async function login(credentials: Credentials): Promise<Session> {
  const parsed = credentialsSchema.parse(credentials);

  let response: Response;

  try {
    const csrfResponse = await fetch(`${API_URL}/api/auth/csrf/`, { credentials: 'include' });

    if (!csrfResponse.ok) throw new LoginError('unavailable', csrfResponse.status);

    // Token from the body when the view echoes it, else from the cookie Django set.
    const token = csrfResponseSchema.parse(await csrfResponse.json()).csrfToken ?? csrfToken();

    if (token === null) throw new LoginError('unavailable', csrfResponse.status);

    response = await fetch(`${API_URL}/api/auth/login/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': token },
      body: JSON.stringify(parsed),
    });
  } catch (error) {
    if (error instanceof LoginError) throw error;

    // `fetch` rejects only when no response arrived at all (offline, DNS, CORS).
    throw new LoginError('unavailable', null);
  }

  if (!response.ok) throw new LoginError(loginFailureReason(response.status), response.status);

  // Some login views answer with an empty body; the identity then comes from the form.
  const body: unknown = await response.text().then((text) => (text ? JSON.parse(text) : {}));
  const { username } = loginResponseSchema.parse(body);

  return sessionSchema.parse({ username: username ?? parsed.username });
}

/**
 * Sets the password — from a one-time link (`uid` + `token`) or for the logged-in user.
 * The client-side validators run in the parse, so a weak password fails as a `ZodError`
 * before the network; the server's own (including the common-password list) come back
 * as an `ApiError` 400.
 */
export async function setPassword(request: SetPasswordRequest): Promise<void> {
  await postJson('/api/auth/password/reset/', setPasswordSchema.parse(request));
}

/** Statuses that mean "no session", not "the API is down". */
const ANONYMOUS_STATUSES = new Set([401, 403]);

/**
 * `GET /api/auth/me/`: the session behind the cookie, or `null` when there is none.
 * Anything else (5xx, offline) propagates as an `ApiError` so the caller can tell
 * "anonymous" from "unknown".
 */
export async function fetchMe(): Promise<Session | null> {
  let body: unknown;

  try {
    body = await getJson('/api/auth/me/');
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status !== null &&
      ANONYMOUS_STATUSES.has(error.status)
    ) {
      return null;
    }

    throw error;
  }

  const { authenticated, username } = meResponseSchema.parse(body ?? {});

  if (authenticated === false || username === undefined) return null;

  return sessionSchema.parse({ username });
}

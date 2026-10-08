import { API_URL, ApiError, csrfToken, deleteJson, getJson, postJson } from '@/lib/api/http';

import {
  adminUsersSchema,
  createdUserSchema,
  createUserRequestSchema,
  credentialsSchema,
  csrfResponseSchema,
  loginResponseSchema,
  sessionSchema,
  meResponseSchema,
  setPasswordSchema,
  toSession,
  type AdminUser,
  type CreatedUser,
  type CreateUserRequest,
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
  const { email } = loginResponseSchema.parse(body);

  return sessionSchema.parse({ email: email ?? parsed.identifier });
}

/**
 * `GET /api/auth/admin/users/`: every account, ordered by email. Needs an admin
 * session; anyone else gets the API's 403 as an `ApiError`, and the caller decides
 * whether that means "log in" or "not for you".
 */
export async function getUsers(): Promise<AdminUser[]> {
  return adminUsersSchema.parse(await getJson('/api/auth/admin/users/'));
}

/**
 * `POST /api/auth/admin/users/create/`: an administrator creates an account and gets its
 * one-time password setup link back. Needs an admin session; anyone else gets the API's
 * refusal as an `ApiError`. CSRF is `postJson`'s business.
 */
export async function createUser(request: CreateUserRequest): Promise<CreatedUser> {
  const body = await postJson(
    '/api/auth/admin/users/create/',
    createUserRequestSchema.parse(request),
  );

  return createdUserSchema.parse(body);
}

/**
 * `DELETE /api/auth/admin/users/{id}/delete/`: an administrator removes an account. 204
 * on success. The API refuses the administrator's own account with a 400 and an unknown
 * id with a 404 — both reach the caller as an `ApiError` carrying the API's `detail`.
 */
export async function deleteUser(id: number): Promise<void> {
  await deleteJson(`/api/auth/admin/users/${id}/delete/`);
}

/**
 * `POST /api/auth/logout/`: Django ends the session behind the cookie. Not in the API
 * spec yet — the path and the empty body follow the Django convention until the backend
 * confirms (AGP-42). A refusal (anonymous, 401/403) or an outage is an `ApiError`; the
 * caller decides what a failed logout means for the client session.
 */
export async function logout(): Promise<void> {
  await postJson('/api/auth/logout/', {});
}

/**
 * TODO(auth-password): parked — no route or form calls this yet, and its tests went with
 * the dead-code sweep. Kept on purpose for the reset flow.
 *
 * Sets the password — from a one-time link (`uid` + `token`) or for the logged-in user.
 * The client-side validators run in the parse, so a weak password fails as a `ZodError`
 * before the network; the server's own (including the common-password list) come back
 * as an `ApiError` 400.
 */
export async function setPassword(request: SetPasswordRequest): Promise<void> {
  await postJson('/api/auth/password/reset/', setPasswordSchema.parse(request));
}

/** Statuses that mean "no session": the spec's 400, and the 401/403 Django would also use. */
const ANONYMOUS_STATUSES = new Set([400, 401, 403]);

/**
 * `GET /api/auth/me/`: the user behind the session cookie, or `null` when there is none.
 * The spec asks for `X-CSRFToken` on this GET too, so the cookie's value goes along when
 * there is one — never a round trip for it. Anything else (5xx, offline) propagates as an
 * `ApiError` so the caller can tell "anonymous" from "unknown".
 */
export async function fetchMe(): Promise<Session | null> {
  const token = csrfToken();
  let body: unknown;

  try {
    body = await getJson(
      '/api/auth/me/',
      {},
      token === null ? undefined : { 'X-CSRFToken': token },
    );
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

  return toSession(meResponseSchema.parse(body ?? {}));
}

import { env } from '@/env';

import {
  analysisOptionsSchema,
  analysisRequestSchema,
  analysisResponseSchema,
  credentialsSchema,
  csrfResponseSchema,
  loginResponseSchema,
  parcelCollectionSchema,
  sessionSchema,
  type AnalysisOptions,
  type AnalysisRequest,
  type AnalysisResponse,
  type Credentials,
  type ParcelCollection,
  type Session,
} from './schemas';

/*
 * The only module in the app that knows which data is fake. Auth is real (Django
 * session endpoints); parcels and analysis still run on the mock branch.
 *
 * Everything else imports from `queries.ts`, so replacing a mock branch with a real
 * `fetch` implementation is a change confined to this file.
 *
 * Responses are parsed through the Zod schemas in both branches on purpose: it keeps
 * the fixtures honest, and it makes contract drift surface as a parse error at the
 * boundary instead of an `undefined` deep in a component.
 */

/**
 * TODO(mock-parcels): the mock branch serves generated fixtures. Replace with the
 * real endpoint fetch when the real layer is available and delete
 * `fixtures/parcels.ts` (grep `mock-parcels`).
 *
 * The fixture module is lazy-imported so generation cost stays off the critical
 * path — the same rule the upload parsers follow with their libraries.
 */
export async function fetchParcels(): Promise<ParcelCollection> {
  if (env.VITE_USE_MOCK_API) {
    const { parcelFixtures } = await import('./fixtures/parcels');

    return parcelCollectionSchema.parse(parcelFixtures);
  }

  throw new Error(
    'The real API client is not implemented. Set VITE_USE_MOCK_API=true to serve fixtures.',
  );
}

/**
 * TODO(mock-analysis-options): serves the option lists for the analysis hero dropdowns
 * from a fixture. Replace with the real endpoint and delete
 * `fixtures/analysis-options.ts` (grep `mock-analysis-options`).
 */
export async function fetchAnalysisOptions(): Promise<AnalysisOptions> {
  if (env.VITE_USE_MOCK_API) {
    const { analysisOptionsFixture } = await import('./fixtures/analysis-options');

    return analysisOptionsSchema.parse(analysisOptionsFixture);
  }

  throw new Error(
    'The real API client is not implemented. Set VITE_USE_MOCK_API=true to serve fixtures.',
  );
}

/** Keeps the pending state visible; goes when the real endpoint replaces the mock. */
const MOCK_ANALYSIS_LATENCY_MS = 400;

/** Same origin unless a deployed build points elsewhere (`VITE_API_URL`). */
const API_URL = env.VITE_API_URL ?? '';

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
 */
export async function login(credentials: Credentials): Promise<Session> {
  const parsed = credentialsSchema.parse(credentials);

  let response: Response;

  try {
    const csrfResponse = await fetch(`${API_URL}/api/auth/csrf/`, { credentials: 'include' });

    if (!csrfResponse.ok) throw new LoginError('unavailable', csrfResponse.status);

    // Token from the body when the view echoes it, else from the cookie Django set —
    // readable only while the API is same-origin (the dev proxy, or served under /api).
    const csrfToken =
      csrfResponseSchema.parse(await csrfResponse.json()).csrfToken ??
      cookieValue(globalThis.document?.cookie ?? '', 'csrftoken');

    if (csrfToken === null) throw new LoginError('unavailable', csrfResponse.status);

    response = await fetch(`${API_URL}/api/auth/login/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
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

/** POSTs the areas of interest for analysis. Fake: the mock branch mints the 200. */
export async function submitAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
  // The request is parsed at the boundary too, so contract drift fails here instead of
  // as a 4xx against the future real API.
  const parsed = analysisRequestSchema.parse(request);

  if (env.VITE_USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_ANALYSIS_LATENCY_MS));

    // Stand-in for the network call: shows what the real endpoint would receive.
    console.info('submitAnalysis payload', parsed);

    return analysisResponseSchema.parse({
      id: crypto.randomUUID(),
      status: 'accepted',
      receivedFeatures: parsed.features.length,
    });
  }

  throw new Error(
    'The real API client is not implemented. Set VITE_USE_MOCK_API=true to serve fixtures.',
  );
}

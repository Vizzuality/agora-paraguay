import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { cookieValue, login, submitAnalysis } from '@/lib/api/client';
import { analysisResponseSchema, type AnalysisRequest } from '@/lib/api/schemas';

const SQUARE: [number, number][] = [
  [0, 0],
  [0, 1],
  [1, 1],
  [1, 0],
  [0, 0],
];

function request(featureCount = 1): AnalysisRequest {
  return {
    type: 'FeatureCollection',
    features: Array.from({ length: featureCount }, (_, index) => ({
      type: 'Feature' as const,
      properties: { name: `Área ${index + 1}` },
      geometry: { type: 'Polygon' as const, coordinates: [SQUARE] },
    })),
  };
}

describe('submitAnalysis', () => {
  // The mock branch simulates latency and logs the payload; fake timers keep the suite
  // fast and the console quiet.
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function submit(input: AnalysisRequest) {
    const pending = submitAnalysis(input);

    await vi.runAllTimersAsync();

    return pending;
  }

  it('accepts the request, echoing how many features it received', async () => {
    const response = await submit(request(3));

    expect(() => analysisResponseSchema.parse(response)).not.toThrow();
    expect(response.status).toBe('accepted');
    expect(response.receivedFeatures).toBe(3);
  });

  it('mints a distinct id per submission', async () => {
    const first = await submit(request());
    const second = await submit(request());

    expect(first.id).not.toBe(second.id);
  });

  it('rejects a malformed request at the boundary', async () => {
    const empty = { type: 'FeatureCollection', features: [] } as unknown as AnalysisRequest;

    await expect(submitAnalysis(empty)).rejects.toThrow(ZodError);
  });
});

describe('login', () => {
  const fetchMock = vi.fn<typeof fetch>();

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches a CSRF token, then posts the credentials with it', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ csrfToken: 'abc' }))
      .mockResolvedValueOnce(json({ username: 'analista' }));

    const session = await login({ username: 'analista', password: 'secreta' });

    expect(session).toEqual({ username: 'analista' });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [csrfUrl, csrfInit] = fetchMock.mock.calls[0];
    expect(String(csrfUrl)).toBe('/api/auth/csrf/');
    expect(csrfInit).toMatchObject({ credentials: 'include' });

    const [loginUrl, loginInit] = fetchMock.mock.calls[1];
    expect(String(loginUrl)).toBe('/api/auth/login/');
    expect(loginInit).toMatchObject({
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': 'abc' },
      body: JSON.stringify({ username: 'analista', password: 'secreta' }),
    });
  });

  it('falls back to the csrftoken cookie when the CSRF body only says "cookie set"', async () => {
    vi.stubGlobal('document', { cookie: 'other=1; csrftoken=from-cookie' });
    fetchMock
      .mockResolvedValueOnce(json({ detail: 'CSRF cookie set.' }))
      .mockResolvedValueOnce(json({}));

    await login({ username: 'analista', password: 'x' });

    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      headers: expect.objectContaining({ 'X-CSRFToken': 'from-cookie' }),
    });
  });

  it('reports the backend as unavailable when no CSRF token is obtainable', async () => {
    vi.stubGlobal('document', { cookie: '' });
    fetchMock.mockResolvedValueOnce(json({ detail: 'CSRF cookie set.' }));

    await expect(login({ username: 'a', password: 'b' })).rejects.toMatchObject({
      reason: 'unavailable',
      status: 200,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('names the session after the form when the login body carries no username', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ csrfToken: 'abc' }))
      .mockResolvedValueOnce(new Response('', { status: 200 }));

    await expect(login({ username: 'analista', password: 'x' })).resolves.toEqual({
      username: 'analista',
    });
  });

  it('reports wrong credentials on a 401', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ csrfToken: 'abc' }))
      .mockResolvedValueOnce(json({ detail: 'Invalid credentials' }, 401));

    await expect(login({ username: 'a', password: 'b' })).rejects.toMatchObject({
      name: 'LoginError',
      reason: 'credentials',
      status: 401,
    });
  });

  it('reports wrong credentials on a 400 too, the other status Django login views use', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ csrfToken: 'abc' }))
      .mockResolvedValueOnce(json({ non_field_errors: ['Unable to log in'] }, 400));

    await expect(login({ username: 'a', password: 'b' })).rejects.toMatchObject({
      reason: 'credentials',
    });
  });

  it('reports the backend as unavailable on a server error', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ csrfToken: 'abc' }))
      .mockResolvedValueOnce(new Response('boom', { status: 503 }));

    await expect(login({ username: 'a', password: 'b' })).rejects.toMatchObject({
      reason: 'unavailable',
      status: 503,
    });
  });

  it('reports the backend as unavailable when the CSRF step fails', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 502 }));

    await expect(login({ username: 'a', password: 'b' })).rejects.toMatchObject({
      reason: 'unavailable',
      status: 502,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports the backend as unavailable when fetch itself rejects', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(login({ username: 'a', password: 'b' })).rejects.toMatchObject({
      reason: 'unavailable',
      status: null,
    });
  });

  it('rejects malformed credentials before touching the network', async () => {
    await expect(login({ username: '', password: 'b' })).rejects.toThrow(ZodError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('cookieValue', () => {
  it('reads one cookie out of a document.cookie string', () => {
    expect(cookieValue('a=1; csrftoken=abc%3D; b=2', 'csrftoken')).toBe('abc=');
    expect(cookieValue('csrftoken=abc', 'csrftoken')).toBe('abc');
  });

  it('returns null when the cookie is missing or empty', () => {
    expect(cookieValue('a=1; b=2', 'csrftoken')).toBeNull();
    expect(cookieValue('csrftoken=', 'csrftoken')).toBeNull();
    expect(cookieValue('', 'csrftoken')).toBeNull();
  });
});

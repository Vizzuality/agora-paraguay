import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, cookieValue, CSRF_PATH, csrfToken, getJson, postJson } from '@/lib/api/http';

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

describe('csrfToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the csrftoken cookie, and is null without a document (SSR)', () => {
    vi.stubGlobal('document', { cookie: 'csrftoken=abc' });
    expect(csrfToken()).toBe('abc');

    vi.stubGlobal('document', undefined);
    expect(csrfToken()).toBeNull();
  });
});

describe('getJson / postJson', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('document', { cookie: 'csrftoken=abc' });
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GETs with the session cookie and appends defined query parameters only', async () => {
    fetchMock.mockResolvedValueOnce(Response.json([1]));

    const body = await getJson('/api/indicators/', { riesgo: 'sanitario', cultivo: undefined });

    expect(body).toEqual([1]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/indicators/?riesgo=sanitario');
    expect(init).toMatchObject({ method: 'GET', credentials: 'include' });
  });

  it('leaves the path untouched when there are no parameters', async () => {
    fetchMock.mockResolvedValueOnce(Response.json([]));

    await getJson('/api/filters/');

    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/filters/');
  });

  it('POSTs JSON with the CSRF header taken from the cookie', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ ok: true }));

    const body = await postJson('/api/x', { a: 1 });

    expect(body).toEqual({ ok: true });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': 'abc' },
      body: JSON.stringify({ a: 1 }),
    });
  });

  it('fetches a CSRF token first when no cookie is set, and echoes the one the body carries', async () => {
    vi.stubGlobal('document', { cookie: '' });
    fetchMock.mockResolvedValueOnce(Response.json({ csrfToken: 'fresh' }));
    fetchMock.mockResolvedValueOnce(Response.json({ ok: true }));

    await postJson('/api/x', { a: 1 });

    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0];
    expect(String(tokenUrl)).toBe(CSRF_PATH);
    expect(tokenInit).toMatchObject({ credentials: 'include' });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'POST',
      headers: { 'X-CSRFToken': 'fresh' },
    });
  });

  it('falls back to the cookie the token endpoint set when its body carries none', async () => {
    const document = { cookie: '' };
    vi.stubGlobal('document', document);
    fetchMock.mockImplementationOnce(() => {
      document.cookie = 'csrftoken=from-cookie';

      return Promise.resolve(Response.json({}));
    });
    fetchMock.mockResolvedValueOnce(Response.json({}));

    await postJson('/api/x', {});

    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({ 'X-CSRFToken': 'from-cookie' });
  });

  it('POSTs without the header when the token endpoint is unreachable, so the 403 surfaces', async () => {
    vi.stubGlobal('document', { cookie: '' });
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    fetchMock.mockResolvedValueOnce(new Response('forbidden', { status: 403 }));

    await expect(postJson('/api/x', {})).rejects.toMatchObject({ status: 403 });
    expect(fetchMock.mock.calls[1][1]?.headers).not.toHaveProperty('X-CSRFToken');
  });

  it('does not fetch a token when the cookie is already there', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({}));

    await postJson('/api/x', {});

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns null for an empty body', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(postJson('/api/x', {})).resolves.toBeNull();
  });

  it('throws an ApiError carrying the status on a non-2xx response', async () => {
    fetchMock.mockResolvedValueOnce(new Response('forbidden', { status: 403 }));

    await expect(getJson('/api/x')).rejects.toMatchObject({
      name: 'ApiError',
      path: '/api/x',
      status: 403,
    });
  });

  it('throws an ApiError with a null status when fetch itself rejects', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const error = await getJson('/api/x').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBeNull();
  });
});

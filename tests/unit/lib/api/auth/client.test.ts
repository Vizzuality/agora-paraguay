import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { fetchMe, login, setPassword } from '@/lib/api/auth/client';

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

describe('login', () => {
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

describe('fetchMe', () => {
  it('GETs /api/auth/me/ and returns the session', async () => {
    fetchMock.mockResolvedValueOnce(json({ username: 'analista' }));

    await expect(fetchMe()).resolves.toEqual({ username: 'analista' });
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/auth/me/');
  });

  it('is anonymous on a 401 or 403, without throwing', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 401 }));
    await expect(fetchMe()).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce(new Response('', { status: 403 }));
    await expect(fetchMe()).resolves.toBeNull();
  });

  it('is anonymous when the body says so, or names nobody', async () => {
    fetchMock.mockResolvedValueOnce(json({ authenticated: false, username: 'analista' }));
    await expect(fetchMe()).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce(json({ authenticated: true }));
    await expect(fetchMe()).resolves.toBeNull();
  });

  it('propagates a server error so the caller can tell "anonymous" from "unknown"', async () => {
    fetchMock.mockResolvedValueOnce(new Response('boom', { status: 503 }));

    await expect(fetchMe()).rejects.toMatchObject({ name: 'ApiError', status: 503 });
  });
});

describe('setPassword', () => {
  beforeEach(() => {
    vi.stubGlobal('document', { cookie: 'csrftoken=abc' });
  });

  it('posts the one-time link parameters with the new password', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(
      setPassword({ uid: 'MQ', token: 't0k3n', password: 'Chaco-2026!' }),
    ).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/auth/password/reset/');
    expect(init).toMatchObject({
      method: 'POST',
      headers: { 'X-CSRFToken': 'abc' },
      body: JSON.stringify({ uid: 'MQ', token: 't0k3n', password: 'Chaco-2026!' }),
    });
  });

  it('posts the password alone for a logged-in change', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await setPassword({ password: 'Chaco-2026!' });

    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify({ password: 'Chaco-2026!' }));
  });

  it('rejects a weak password client-side, before touching the network', async () => {
    await expect(setPassword({ password: '1234' })).rejects.toThrow(ZodError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a uid without its token', async () => {
    await expect(setPassword({ uid: 'MQ', password: 'Chaco-2026!' })).rejects.toThrow(ZodError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces the server's own validators (the common-password list) as an ApiError 400", async () => {
    fetchMock.mockResolvedValueOnce(json({ password: ['This password is too common.'] }, 400));

    await expect(setPassword({ password: 'password123' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
    });
  });
});

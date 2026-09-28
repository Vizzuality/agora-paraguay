import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { createUser, login } from '@/lib/api/auth/client';

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

    const session = await login({ identifier: 'analista', password: 'secreta' });

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
      body: JSON.stringify({ identifier: 'analista', password: 'secreta' }),
    });
  });

  it('falls back to the csrftoken cookie when the CSRF body only says "cookie set"', async () => {
    vi.stubGlobal('document', { cookie: 'other=1; csrftoken=from-cookie' });
    fetchMock
      .mockResolvedValueOnce(json({ detail: 'CSRF cookie set.' }))
      .mockResolvedValueOnce(json({}));

    await login({ identifier: 'analista', password: 'x' });

    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      headers: expect.objectContaining({ 'X-CSRFToken': 'from-cookie' }),
    });
  });

  it('reports the backend as unavailable when no CSRF token is obtainable', async () => {
    vi.stubGlobal('document', { cookie: '' });
    fetchMock.mockResolvedValueOnce(json({ detail: 'CSRF cookie set.' }));

    await expect(login({ identifier: 'a', password: 'b' })).rejects.toMatchObject({
      reason: 'unavailable',
      status: 200,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('names the session after the form when the login body carries no username', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ csrfToken: 'abc' }))
      .mockResolvedValueOnce(new Response('', { status: 200 }));

    await expect(login({ identifier: 'analista', password: 'x' })).resolves.toEqual({
      username: 'analista',
    });
  });

  it('reports wrong credentials on a 401', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ csrfToken: 'abc' }))
      .mockResolvedValueOnce(json({ detail: 'Invalid credentials' }, 401));

    await expect(login({ identifier: 'a', password: 'b' })).rejects.toMatchObject({
      name: 'LoginError',
      reason: 'credentials',
      status: 401,
    });
  });

  it('reports wrong credentials on a 400 too, the other status Django login views use', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ csrfToken: 'abc' }))
      .mockResolvedValueOnce(json({ non_field_errors: ['Unable to log in'] }, 400));

    await expect(login({ identifier: 'a', password: 'b' })).rejects.toMatchObject({
      reason: 'credentials',
    });
  });

  it('reports the backend as unavailable on a server error', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ csrfToken: 'abc' }))
      .mockResolvedValueOnce(new Response('boom', { status: 503 }));

    await expect(login({ identifier: 'a', password: 'b' })).rejects.toMatchObject({
      reason: 'unavailable',
      status: 503,
    });
  });

  it('reports the backend as unavailable when the CSRF step fails', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 502 }));

    await expect(login({ identifier: 'a', password: 'b' })).rejects.toMatchObject({
      reason: 'unavailable',
      status: 502,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports the backend as unavailable when fetch itself rejects', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(login({ identifier: 'a', password: 'b' })).rejects.toMatchObject({
      reason: 'unavailable',
      status: null,
    });
  });

  it('rejects malformed credentials before touching the network', async () => {
    await expect(login({ identifier: '', password: 'b' })).rejects.toThrow(ZodError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('createUser', () => {
  const created = {
    user: {
      id: 7,
      username: 'newuser',
      email: 'newuser@example.com',
      first_name: 'New',
      last_name: 'User',
      is_active: false,
      is_staff: false,
    },
    reset_link: 'https://frontend/reset-password/550e8400-e29b-41d4-a716-446655440000',
    token: '550e8400-e29b-41d4-a716-446655440000',
    expires_at: '2026-09-22T10:30:00Z',
  };

  it('POSTs the new user with the CSRF token and returns the setup link', async () => {
    vi.stubGlobal('document', { cookie: 'csrftoken=from-cookie' });
    fetchMock.mockResolvedValueOnce(json(created, 201));

    const request = {
      username: 'newuser',
      email: 'newuser@example.com',
      first_name: 'New',
      last_name: 'User',
    };

    await expect(createUser(request)).resolves.toEqual(created);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/auth/admin/users/create/');
    expect(init).toMatchObject({
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': 'from-cookie' },
      body: JSON.stringify(request),
    });
  });

  it('keeps fields the answer adds beyond the contract', async () => {
    vi.stubGlobal('document', { cookie: 'csrftoken=t' });
    fetchMock.mockResolvedValueOnce(json({ ...created, user: { ...created.user, role: 'x' } }));

    await expect(
      createUser({ username: 'newuser', email: 'newuser@example.com' }),
    ).resolves.toMatchObject({
      user: { role: 'x' },
    });
  });

  it('surfaces the refusal a non-admin session gets, with the API reason', async () => {
    vi.stubGlobal('document', { cookie: 'csrftoken=t' });
    fetchMock.mockResolvedValueOnce(json({ detail: 'Administrator only.' }, 403));

    await expect(
      createUser({ username: 'newuser', email: 'newuser@example.com' }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
      detail: 'Administrator only.',
    });
  });

  it('rejects an answer without the setup link', async () => {
    vi.stubGlobal('document', { cookie: 'csrftoken=t' });
    fetchMock.mockResolvedValueOnce(json({ user: created.user }));

    await expect(createUser({ username: 'newuser', email: 'newuser@example.com' })).rejects.toThrow(
      ZodError,
    );
  });

  it('rejects a malformed email before touching the network', async () => {
    await expect(createUser({ username: 'newuser', email: 'not-an-email' })).rejects.toThrow(
      ZodError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// TODO(auth-me): parked with `fetchMe` (see `src/lib/api/auth/queries.ts`).
// describe('fetchMe', () => {
//   it('GETs /api/auth/me/ and returns the session', async () => {
//     fetchMock.mockResolvedValueOnce(json({ username: 'analista' }));
//
//     await expect(fetchMe()).resolves.toEqual({ username: 'analista' });
//     expect(String(fetchMock.mock.calls[0][0])).toBe('/api/auth/me/');
//   });
//
//   it('is anonymous on a 401 or 403, without throwing', async () => {
//     fetchMock.mockResolvedValueOnce(new Response('', { status: 401 }));
//     await expect(fetchMe()).resolves.toBeNull();
//
//     fetchMock.mockResolvedValueOnce(new Response('', { status: 403 }));
//     await expect(fetchMe()).resolves.toBeNull();
//   });
//
//   it('is anonymous when the body says so, or names nobody', async () => {
//     fetchMock.mockResolvedValueOnce(json({ authenticated: false, username: 'analista' }));
//     await expect(fetchMe()).resolves.toBeNull();
//
//     fetchMock.mockResolvedValueOnce(json({ authenticated: true }));
//     await expect(fetchMe()).resolves.toBeNull();
//   });
//
//   it('propagates a server error so the caller can tell "anonymous" from "unknown"', async () => {
//     fetchMock.mockResolvedValueOnce(new Response('boom', { status: 503 }));
//
//     await expect(fetchMe()).rejects.toMatchObject({ name: 'ApiError', status: 503 });
//   });
// });

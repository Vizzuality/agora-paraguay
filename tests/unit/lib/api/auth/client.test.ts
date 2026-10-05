import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { createUser, deleteUser, fetchMe, listUsers, login, logout } from '@/lib/api/auth/client';

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

    expect(session).toEqual({ username: 'analista', isStaff: false });
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
      isStaff: false,
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

describe('listUsers', () => {
  const users = [
    {
      id: 1,
      username: 'test',
      email: 'test@gmv.com',
      first_name: '',
      last_name: '',
      is_active: true,
      is_staff: true,
    },
    {
      id: 7,
      username: 'zoe',
      email: 'zoe@example.com',
      first_name: 'Zoe',
      last_name: 'Pérez',
      is_active: false,
      is_staff: false,
    },
  ];

  it('GETs the admin list with the session cookie and returns the users as answered', async () => {
    fetchMock.mockResolvedValueOnce(json(users));

    await expect(listUsers()).resolves.toEqual(users);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/auth/admin/users/');
    expect(init).toMatchObject({ method: 'GET', credentials: 'include' });
  });

  it('keeps fields the answer adds beyond the contract, and accepts an empty list', async () => {
    fetchMock.mockResolvedValueOnce(json([{ ...users[0], last_login: '2026-09-30T08:00:00Z' }]));

    const [first] = await listUsers();
    expect(first).toMatchObject({ username: 'test', last_login: '2026-09-30T08:00:00Z' });

    fetchMock.mockResolvedValueOnce(json([]));
    await expect(listUsers()).resolves.toEqual([]);
  });

  it("surfaces the 403 a non-administrator gets as an ApiError with the API's reason", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ detail: 'You do not have permission to perform this action.' }, 403),
    );

    await expect(listUsers()).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
      detail: 'You do not have permission to perform this action.',
    });
  });

  it('rejects an answer that is not a list of users', async () => {
    fetchMock.mockResolvedValueOnce(json({ results: users }));

    await expect(listUsers()).rejects.toThrow(ZodError);
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

  it('accepts the live answer, whose user carries names only — no id or flags', async () => {
    vi.stubGlobal('document', { cookie: 'csrftoken=from-cookie' });
    const live = {
      ...created,
      user: { username: 'Paule', email: 'paule@example.org', first_name: '', last_name: '' },
      reset_link: 'http://46.60.18.203:8082/api/auth/reset-password/ecb687e7/',
    };
    fetchMock.mockResolvedValueOnce(json(live, 201));

    await expect(createUser({ username: 'Paule', email: 'paule@example.org' })).resolves.toEqual(
      live,
    );
  });

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

describe('deleteUser', () => {
  it('DELETEs the account by id with the session cookie and the CSRF token', async () => {
    vi.stubGlobal('document', { cookie: 'csrftoken=from-cookie' });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(deleteUser(7)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/auth/admin/users/7/delete/');
    expect(init).toMatchObject({
      method: 'DELETE',
      credentials: 'include',
      headers: { 'X-CSRFToken': 'from-cookie' },
    });
  });

  it("surfaces the refusal to delete one's own account with the API reason", async () => {
    vi.stubGlobal('document', { cookie: 'csrftoken=t' });
    fetchMock.mockResolvedValueOnce(json({ detail: 'No puedes eliminar tu propia cuenta.' }, 400));

    await expect(deleteUser(1)).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      detail: 'No puedes eliminar tu propia cuenta.',
    });
  });

  it('surfaces an unknown account as an ApiError 404', async () => {
    vi.stubGlobal('document', { cookie: 'csrftoken=t' });
    fetchMock.mockResolvedValueOnce(json({ detail: 'Not found.' }, 404));

    await expect(deleteUser(99)).rejects.toMatchObject({ name: 'ApiError', status: 404 });
  });
});

describe('logout', () => {
  it('POSTs to the logout endpoint with the session cookie and the CSRF token', async () => {
    vi.stubGlobal('document', { cookie: 'csrftoken=from-cookie' });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(logout()).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/auth/logout/');
    expect(init).toMatchObject({
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': 'from-cookie' },
    });
  });

  it('surfaces a refusal as an ApiError with the status', async () => {
    vi.stubGlobal('document', { cookie: 'csrftoken=t' });
    fetchMock.mockResolvedValueOnce(json({ detail: 'Not authenticated.' }, 403));

    await expect(logout()).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
      detail: 'Not authenticated.',
    });
  });

  it('surfaces an outage as an ApiError without a status', async () => {
    vi.stubGlobal('document', { cookie: 'csrftoken=t' });
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(logout()).rejects.toMatchObject({ name: 'ApiError', status: null });
  });
});

describe('fetchMe', () => {
  const me = {
    id: 7,
    username: 'analista',
    email: 'analista@example.com',
    first_name: 'Ana',
    last_name: 'Lista',
    is_active: true,
    is_staff: true,
    isAuthenticated: true,
  };

  it('GETs /api/auth/me/ with the CSRF cookie as header and maps the user to a session', async () => {
    vi.stubGlobal('document', { cookie: 'csrftoken=from-cookie' });
    fetchMock.mockResolvedValueOnce(json(me));

    await expect(fetchMe()).resolves.toEqual({
      username: 'analista',
      email: 'analista@example.com',
      firstName: 'Ana',
      lastName: 'Lista',
      isStaff: true,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/auth/me/');
    expect(init).toMatchObject({
      method: 'GET',
      credentials: 'include',
      headers: { 'X-CSRFToken': 'from-cookie' },
    });
  });

  it('sends no CSRF header, and fetches no token, when there is no cookie yet', async () => {
    vi.stubGlobal('document', { cookie: '' });
    fetchMock.mockResolvedValueOnce(json({ ...me, is_staff: false }));

    await expect(fetchMe()).resolves.toMatchObject({ isStaff: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ headers: undefined });
  });

  it('is anonymous on the 400 the spec answers with, without throwing', async () => {
    fetchMock.mockResolvedValueOnce(json({ isAuthenticated: false }, 400));

    await expect(fetchMe()).resolves.toBeNull();
  });

  it('is anonymous on a 401 or 403 too', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 401 }));
    await expect(fetchMe()).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce(new Response('', { status: 403 }));
    await expect(fetchMe()).resolves.toBeNull();
  });

  it('is anonymous when a 200 says so, or names nobody', async () => {
    fetchMock.mockResolvedValueOnce(json({ ...me, isAuthenticated: false }));
    await expect(fetchMe()).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce(json({ isAuthenticated: true }));
    await expect(fetchMe()).resolves.toBeNull();
  });

  it('propagates a server error so the caller can tell "anonymous" from "unknown"', async () => {
    fetchMock.mockResolvedValueOnce(new Response('boom', { status: 503 }));

    await expect(fetchMe()).rejects.toMatchObject({ name: 'ApiError', status: 503 });
  });
});

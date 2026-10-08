import type { Page } from '@playwright/test';

/**
 * Stubs the Django auth endpoints so the specs never depend on the real backend: the
 * CSRF token is a constant, any credentials log in, logout always succeeds and `/me`
 * answers for whoever logged in last (anonymous until then, `staff` decides the role).
 * Signing in for real is a manual check: no test account lives in the repo or its
 * environment.
 */
/** Two accounts as `GET /api/auth/admin/users/` lists them, by email. */
export const ADMIN_USERS = [
  {
    id: 1,
    email: 'admin@example.com',
    first_name: 'Ana',
    last_name: 'Lista',
    is_active: true,
    is_staff: true,
  },
  {
    id: 2,
    email: 'analista@example.com',
    first_name: '',
    last_name: '',
    is_active: true,
    is_staff: false,
  },
];

type AdminUserRow = (typeof ADMIN_USERS)[number];

/**
 * Stubs the admin endpoints: the list answers the accounts (the two above to start, or
 * a 403 for a session without staff rights) and create appends to them and returns the
 * one-time link, as the API does — so a created user shows up on the next list, and
 * delete removes one from them. Pass `createFailure` / `deleteFailure` to have those
 * endpoints answer that instead.
 */
export async function stubAdminUsers(
  page: Page,
  {
    forbidden = false,
    createFailure,
    deleteFailure,
  }: {
    forbidden?: boolean;
    createFailure?: { status: number; body: unknown };
    deleteFailure?: { status: number; body: unknown };
  } = {},
) {
  const users: AdminUserRow[] = [...ADMIN_USERS];

  await page.route('**/api/auth/admin/users/', (route) =>
    forbidden
      ? route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'You do not have permission to perform this action.' }),
        })
      : route.fulfill({ contentType: 'application/json', body: JSON.stringify(users) }),
  );
  await page.route('**/api/auth/admin/users/create/', async (route) => {
    if (createFailure) {
      await route.fulfill({
        status: createFailure.status,
        contentType: 'application/json',
        body: JSON.stringify(createFailure.body),
      });

      return;
    }

    const request = route.request().postDataJSON() as { email: string };
    const user: AdminUserRow = {
      id: users.length + 1,
      email: request.email,
      first_name: '',
      last_name: '',
      is_active: false,
      is_staff: false,
    };

    users.push(user);
    users.sort((a, b) => a.email.localeCompare(b.email));

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        user,
        reset_link: `http://localhost:3000/restablecer-contrasena/${RESET_TOKEN}`,
        token: RESET_TOKEN,
        expires_at: '2026-10-07T10:30:00Z',
      }),
    });
  });

  await page.route('**/api/auth/admin/users/*/delete/', async (route) => {
    if (deleteFailure) {
      await route.fulfill({
        status: deleteFailure.status,
        contentType: 'application/json',
        body: JSON.stringify(deleteFailure.body),
      });

      return;
    }

    const id = Number(/users\/(\d+)\/delete\/$/.exec(route.request().url())?.[1]);
    const index = users.findIndex((user) => user.id === id);

    if (index === -1) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Not found.' }),
      });

      return;
    }

    users.splice(index, 1);

    await route.fulfill({ status: 204 });
  });

  return users;
}

/** The token the stubbed create answers with; the link points at our own reset page. */
export const RESET_TOKEN = '550e8400-e29b-41d4-a716-446655440000';

export async function stubAuth(page: Page, { staff = false }: { staff?: boolean } = {}) {
  let email: string | null = null;

  await page.route('**/api/auth/csrf/', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify({ csrfToken: 'e2e' }) }),
  );
  await page.route('**/api/auth/login/', async (route) => {
    ({ identifier: email } = route.request().postDataJSON() as { identifier: string });

    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ email }) });
  });
  await page.route('**/api/auth/logout/', async (route) => {
    email = null;

    await route.fulfill({ status: 204 });
  });
  await page.route('**/api/auth/me/', (route) =>
    email === null
      ? route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ isAuthenticated: false }),
        })
      : route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            email,
            first_name: 'Ana',
            last_name: 'Lista',
            is_active: true,
            is_staff: staff,
            isAuthenticated: true,
          }),
        }),
  );
}

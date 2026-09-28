import type { Page } from '@playwright/test';

/**
 * Stubs the Django auth endpoints so the specs never depend on the real backend: the
 * CSRF token is a constant, any credentials log in, logout always succeeds and `/me`
 * answers for whoever logged in last (anonymous until then, `staff` decides the role).
 * Signing in for real is a manual check: no test account lives in the repo or its
 * environment.
 */
export async function stubAuth(page: Page, { staff = false }: { staff?: boolean } = {}) {
  let username: string | null = null;

  await page.route('**/api/auth/csrf/', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify({ csrfToken: 'e2e' }) }),
  );
  await page.route('**/api/auth/login/', async (route) => {
    ({ identifier: username } = route.request().postDataJSON() as { identifier: string });

    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ username }) });
  });
  await page.route('**/api/auth/logout/', async (route) => {
    username = null;

    await route.fulfill({ status: 204 });
  });
  await page.route('**/api/auth/me/', (route) =>
    username === null
      ? route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ isAuthenticated: false }),
        })
      : route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            username,
            email: `${username}@example.com`,
            first_name: 'Ana',
            last_name: 'Lista',
            is_active: true,
            is_staff: staff,
            isAuthenticated: true,
          }),
        }),
  );
}

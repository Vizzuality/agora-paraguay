import type { Page } from '@playwright/test';

/**
 * Stubs the Django auth endpoints so the specs never depend on the real backend: the
 * CSRF token is a constant and any credentials log in. Signing in for real is a manual
 * check: no test account lives in the repo or its environment.
 */
export async function stubAuth(page: Page) {
  await page.route('**/api/auth/csrf/', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify({ csrfToken: 'e2e' }) }),
  );
  await page.route('**/api/auth/login/', async (route) => {
    const { username } = route.request().postDataJSON() as { username: string };

    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ username }) });
  });
}

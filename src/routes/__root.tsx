import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router';

import { THEME_INIT_SCRIPT } from '@/lib/theme';
import { QueryProvider } from '@/providers/react-query';

import appCss from '@/styles/globals.css?url';

export const Route = createRootRoute({
  // No `retainSearchParams` middleware here on purpose: the nuqs TanStack Router
  // adapter smuggles the camera's query string inside `navigate({ to })`, which the
  // router treats as an opaque pathname — any retained search params get re-appended
  // after it, doubling the query string on every camera move (`/?lat=X?lat=Y`).
  // Guarded by tests/e2e/camera-url.spec.ts.
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Ágora Paraguay' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'stylesheet', href: appCss },
    ],
    // Applies the stored theme before first paint (see `src/lib/theme.ts`).
    scripts: [{ children: THEME_INIT_SCRIPT }],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <NuqsAdapter>
        <QueryProvider>
          <Outlet />
        </QueryProvider>
      </NuqsAdapter>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // The inline theme script may add `.dark` before React hydrates <html>.
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

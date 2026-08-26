import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";

import { QueryProvider } from "@/providers/react-query";

import appCss from "@/styles/globals.css?url";

export const Route = createRootRoute({
  // No `retainSearchParams` middleware here on purpose: the nuqs TanStack Router
  // adapter smuggles the camera's query string inside `navigate({ to })`, which the
  // router treats as an opaque pathname — any retained search params get re-appended
  // after it, doubling the query string on every camera move (`/?lat=X?lat=Y`).
  // Guarded by tests/e2e/camera-url.spec.ts.
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ágora Paraguay" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico" },
      { rel: "stylesheet", href: appCss },
    ],
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
    <html lang="es">
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

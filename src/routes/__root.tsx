import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  retainSearchParams,
} from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";

import { QueryProvider } from "@/providers/react-query";

import appCss from "@/styles/globals.css?url";

export const Route = createRootRoute({
  search: {
    middlewares: [retainSearchParams(true)],
  },
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

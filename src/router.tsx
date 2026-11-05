import { createRouter } from '@tanstack/react-router';
import { getGlobalStartContext } from '@tanstack/react-start';

import { NotFoundPage } from '@/components/not-found-page';

import { routeTree } from './routeTree.gen';

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultNotFoundComponent: NotFoundPage,
    // The CSP nonce from `src/start.ts`; undefined in the browser.
    ssr: { nonce: getGlobalStartContext()?.nonce },
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

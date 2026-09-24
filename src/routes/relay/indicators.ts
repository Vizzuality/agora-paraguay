import { createFileRoute } from '@tanstack/react-router';

/**
 * Server route, no page. The browser asks `/relay/indicators?riesgo=`; the server asks
 * the API the way its spec wants (`GET` with a JSON body, impossible from a page) and
 * relays the answer. The relay module is imported inside the handler so `node:http`
 * never enters the client graph.
 */
export const Route = createFileRoute('/relay/indicators')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { relayIndicators } = await import('@/lib/api/relay/indicators');

        return relayIndicators(request, __API_PROXY_TARGET__);
      },
    },
  },
});

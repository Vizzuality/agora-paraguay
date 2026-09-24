import type { Riesgo } from '@/lib/api/metadata/schemas';

/*
 * Server-only. The indicator list is `GET /api/parcels/indicators/` with a JSON body
 * (`{ riesgo }`). The Fetch standard forbids a body on GET, so no browser can send that
 * request — Node's `http` can. The server route `/relay/indicators?riesgo=` calls
 * `relayIndicators`, which reopens the request against the API and hands the answer back.
 */

/** Where Django lists the indicators. Trailing slash as it routes it. */
export const INDICATORS_ENDPOINT = '/api/parcels/indicators/';

/** The riesgo asked for in the relay URL, or `null` when missing or unknown. */
export function riesgoOf(url: URL): Riesgo | null {
  const value = url.searchParams.get('riesgo');

  return value === 'sanitario' || value === 'productivo' ? value : null;
}

/**
 * A GET carrying a JSON body, which `fetch` refuses: `node:http` writes whatever body it
 * is given regardless of the method. Answers as a `Response` so the route can return it
 * as is.
 */
export async function getWithJsonBody(
  url: URL,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<Response> {
  const { request } =
    url.protocol === 'https:' ? await import('node:https') : await import('node:http');
  const payload = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const outgoing = request(
      url,
      {
        method: 'GET',
        headers: {
          ...headers,
          'content-type': 'application/json',
          'content-length': String(Buffer.byteLength(payload)),
        },
      },
      (incoming) => {
        const chunks: Buffer[] = [];

        incoming.on('data', (chunk: Buffer) => chunks.push(chunk));
        incoming.on('error', reject);
        incoming.on('end', () => {
          const status = incoming.statusCode ?? 502;
          const contentType = incoming.headers['content-type'] ?? 'application/json';

          resolve(
            new Response(status === 204 || status === 304 ? null : Buffer.concat(chunks), {
              status,
              headers: { 'content-type': contentType },
            }),
          );
        });
      },
    );

    outgoing.on('error', reject);
    outgoing.end(payload);
  });
}

/**
 * Answers `/relay/indicators?riesgo=` with what the API says for that riesgo. The session
 * cookie travels along: riesgo productivo is private. A missing or unknown riesgo is a
 * 400 here, before the API is bothered; an unreachable API is a 502.
 */
export async function relayIndicators(request: Request, apiOrigin: string): Promise<Response> {
  const riesgo = riesgoOf(new URL(request.url));

  if (riesgo === null) {
    return Response.json(
      { detail: 'riesgo must be "sanitario" or "productivo".' },
      { status: 400 },
    );
  }

  const cookie = request.headers.get('cookie');

  try {
    return await getWithJsonBody(
      new URL(INDICATORS_ENDPOINT, apiOrigin),
      { riesgo },
      cookie === null ? {} : { cookie },
    );
  } catch {
    return Response.json({ detail: 'The API could not be reached.' }, { status: 502 });
  }
}

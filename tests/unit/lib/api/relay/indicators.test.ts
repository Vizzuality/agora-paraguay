import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { afterEach, describe, expect, it } from 'vitest';

import { relayIndicators, riesgoOf } from '@/lib/api/relay/indicators';

type Seen = { method?: string; url?: string; body: string; cookie?: string; contentType?: string };

let server: Server | undefined;

/** A stand-in API that records the one request it gets and answers with `reply`. */
async function fakeApi(reply: { status: number; body: unknown }) {
  const seen: Seen = { body: '' };

  server = createServer((incoming: IncomingMessage, outgoing) => {
    seen.method = incoming.method;
    seen.url = incoming.url;
    seen.cookie = incoming.headers.cookie;
    seen.contentType = incoming.headers['content-type'];
    incoming.on('data', (chunk: Buffer) => {
      seen.body += chunk.toString();
    });
    incoming.on('end', () => {
      outgoing.writeHead(reply.status, { 'content-type': 'application/json' });
      outgoing.end(JSON.stringify(reply.body));
    });
  });

  await new Promise<void>((resolve) => server?.listen(0, '127.0.0.1', resolve));

  const { port } = server.address() as AddressInfo;

  return { origin: `http://127.0.0.1:${port}`, seen };
}

afterEach(async () => {
  await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
  server = undefined;
});

describe('riesgoOf', () => {
  it('reads the two riesgos and nothing else', () => {
    expect(riesgoOf(new URL('http://app/relay/indicators?riesgo=sanitario'))).toBe('sanitario');
    expect(riesgoOf(new URL('http://app/relay/indicators?riesgo=productivo'))).toBe('productivo');
    expect(riesgoOf(new URL('http://app/relay/indicators?riesgo=otro'))).toBeNull();
    expect(riesgoOf(new URL('http://app/relay/indicators'))).toBeNull();
  });
});

describe('relayIndicators', () => {
  const indicators = [{ id: 'area', name: 'Area', indicator_type: { type: 'number' } }];

  it('GETs /api/parcels/indicators/ with the riesgo as a JSON body and the session cookie', async () => {
    const { origin, seen } = await fakeApi({ status: 200, body: indicators });

    const response = await relayIndicators(
      new Request('http://app/relay/indicators?riesgo=sanitario', {
        headers: { cookie: 'sessionid=abc' },
      }),
      origin,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');
    await expect(response.json()).resolves.toEqual(indicators);

    expect(seen.method).toBe('GET');
    expect(seen.url).toBe('/api/parcels/indicators/');
    expect(seen.contentType).toBe('application/json');
    expect(seen.cookie).toBe('sessionid=abc');
    expect(JSON.parse(seen.body)).toEqual({ riesgo: 'sanitario' });
  });

  it('passes the API status through, so a 403 on productivo stays a 403', async () => {
    const { origin } = await fakeApi({ status: 403, body: { detail: 'forbidden' } });

    const response = await relayIndicators(
      new Request('http://app/relay/indicators?riesgo=productivo'),
      origin,
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ detail: 'forbidden' });
  });

  it('answers 400 to a missing or unknown riesgo without calling the API', async () => {
    const { origin, seen } = await fakeApi({ status: 200, body: [] });

    const response = await relayIndicators(new Request('http://app/relay/indicators'), origin);

    expect(response.status).toBe(400);
    expect(seen.method).toBeUndefined();
  });

  it('answers 502 when the API is unreachable', async () => {
    const { origin } = await fakeApi({ status: 200, body: [] });
    await new Promise<void>((resolve) => server?.close(() => resolve()));
    server = undefined;

    const response = await relayIndicators(
      new Request('http://app/relay/indicators?riesgo=sanitario'),
      origin,
    );

    expect(response.status).toBe(502);
  });
});

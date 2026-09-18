import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { runAnalysis } from '@/lib/api/analysis/client';
import {
  analysisPath,
  analysisRequestSchema,
  analysisResponseSchema,
} from '@/lib/api/analysis/schemas';

const request = {
  parcels: ['D07D21P00000002', 'D07D23P00000008'],
  indicators: ['iep'],
  crop_type: 'soy',
  sowing_date: '2026-06-18',
  date: '2026-09-17',
};

/** The envelope the backend answered on 2026-09-18, plus a string-encoded reading. */
const response = {
  status: 'success',
  message: '',
  input: {
    parcels: ['D07D21P00000002', 'D07D23P00000008'],
    indicators: ['iep'],
    crop_type: 'soy',
    date: '2026-09-17',
  },
  indicators: [
    { parcel_id: 'D07D21P00000002', properties: { Asian_rust: 2 } },
    { parcel_id: 'D07D23P00000008', properties: { Asian_rust: '1', brown_spot: null } },
  ],
};

describe('analysisRequestSchema', () => {
  it('accepts the flat body: parcels, indicators and any string-valued filter keys', () => {
    expect(analysisRequestSchema.safeParse(request).success).toBe(true);
    expect(
      analysisRequestSchema.safeParse({ parcels: ['D07D21P00000002'], indicators: ['iep'] })
        .success,
    ).toBe(true);
  });

  it('rejects an empty parcel or indicator list, and a non-string filter value', () => {
    expect(analysisRequestSchema.safeParse({ ...request, parcels: [] }).success).toBe(false);
    expect(analysisRequestSchema.safeParse({ ...request, indicators: [] }).success).toBe(false);
    expect(analysisRequestSchema.safeParse({ ...request, crop_type: 3 }).success).toBe(false);
    expect(analysisRequestSchema.safeParse({ ...request, sowing_date: [1] }).success).toBe(false);
  });
});

describe('analysisResponseSchema', () => {
  it("accepts the backend's envelope, numbers-as-strings and nulls included", () => {
    expect(analysisResponseSchema.safeParse(response).success).toBe(true);
  });

  it('accepts a numeric parcel_id too, as older samples echoed', () => {
    expect(
      analysisResponseSchema.safeParse({
        ...response,
        indicators: [{ parcel_id: 8668, properties: { Asian_rust: 2 } }],
      }).success,
    ).toBe(true);
  });

  it('keeps every property column as delivered — they are the indicators, in the backend casing', () => {
    const parsed = analysisResponseSchema.parse(response);

    expect(parsed.indicators[0].properties.Asian_rust).toBe(2);
    expect(parsed.indicators[1].properties.Asian_rust).toBe('1');
  });

  it('rejects a parcel without parcel_id, and the old FeatureCollection shape', () => {
    expect(
      analysisResponseSchema.safeParse({
        ...response,
        indicators: [{ properties: { Asian_rust: 2 } }],
      }).success,
    ).toBe(false);
    expect(
      analysisResponseSchema.safeParse({ type: 'FeatureCollection', features: [] }).success,
    ).toBe(false);
  });
});

describe('runAnalysis', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('document', { cookie: 'csrftoken=abc' });
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs to the visibility path and parses the analysed parcels', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(response));

    await expect(runAnalysis('private', request)).resolves.toEqual(response);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(analysisPath('private'));
    expect(String(url)).toBe('/api/parcels/analysis/production/');
    expect(init).toMatchObject({
      method: 'POST',
      headers: { 'X-CSRFToken': 'abc' },
      body: JSON.stringify(request),
    });
  });

  it('rejects a malformed request before touching the network', async () => {
    await expect(runAnalysis('public', { ...request, parcels: [] })).rejects.toThrow(ZodError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

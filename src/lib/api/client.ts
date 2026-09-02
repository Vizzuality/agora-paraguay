import { env } from '@/env';

import {
  analysisOptionsSchema,
  analysisRequestSchema,
  analysisResponseSchema,
  credentialsSchema,
  parcelCollectionSchema,
  sessionSchema,
  type AnalysisOptions,
  type AnalysisRequest,
  type AnalysisResponse,
  type Credentials,
  type ParcelCollection,
  type Session,
} from './schemas';

/*
 * The only module in the app that knows the data is fake.
 *
 * Everything else imports from `queries.ts`, so replacing the mock branch with a real
 * `fetch` implementation is a change confined to this file.
 *
 * Responses are parsed through the Zod schemas in both branches on purpose: it keeps
 * the fixtures honest, and it makes contract drift surface as a parse error at the
 * boundary instead of an `undefined` deep in a component.
 */

/**
 * TODO(mock-parcels): the mock branch serves generated fixtures. Replace with the
 * real endpoint fetch when the real layer is available and delete
 * `fixtures/parcels.ts` (grep `mock-parcels`).
 *
 * The fixture module is lazy-imported so generation cost stays off the critical
 * path — the same rule the upload parsers follow with their libraries.
 */
export async function fetchParcels(): Promise<ParcelCollection> {
  if (env.VITE_USE_MOCK_API) {
    const { parcelFixtures } = await import('./fixtures/parcels');

    return parcelCollectionSchema.parse(parcelFixtures);
  }

  throw new Error(
    'The real API client is not implemented. Set VITE_USE_MOCK_API=true to serve fixtures.',
  );
}

/**
 * TODO(mock-analysis-options): serves the option lists for the analysis hero dropdowns
 * from a fixture. Replace with the real endpoint and delete
 * `fixtures/analysis-options.ts` (grep `mock-analysis-options`).
 */
export async function fetchAnalysisOptions(): Promise<AnalysisOptions> {
  if (env.VITE_USE_MOCK_API) {
    const { analysisOptionsFixture } = await import('./fixtures/analysis-options');

    return analysisOptionsSchema.parse(analysisOptionsFixture);
  }

  throw new Error(
    'The real API client is not implemented. Set VITE_USE_MOCK_API=true to serve fixtures.',
  );
}

/** Keeps the pending state visible; goes when the real endpoint replaces the mock. */
const MOCK_ANALYSIS_LATENCY_MS = 400;

/**
 * Authenticates against the GMV backend. Fake: the mock branch accepts any well-formed
 * credentials — there is no user database to check against, and inventing one would
 * only have to be deleted when the real auth contract lands (AGP-22).
 */
export async function login(credentials: Credentials): Promise<Session> {
  const parsed = credentialsSchema.parse(credentials);

  if (env.VITE_USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_ANALYSIS_LATENCY_MS));

    return sessionSchema.parse({ email: parsed.email });
  }

  throw new Error(
    'The real API client is not implemented. Set VITE_USE_MOCK_API=true to serve fixtures.',
  );
}

/** POSTs the areas of interest for analysis. Fake: the mock branch mints the 200. */
export async function submitAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
  // The request is parsed at the boundary too, so contract drift fails here instead of
  // as a 4xx against the future real API.
  const parsed = analysisRequestSchema.parse(request);

  if (env.VITE_USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_ANALYSIS_LATENCY_MS));

    // Stand-in for the network call: shows what the real endpoint would receive.
    console.info('submitAnalysis payload', parsed);

    return analysisResponseSchema.parse({
      id: crypto.randomUUID(),
      status: 'accepted',
      receivedFeatures: parsed.features.length,
    });
  }

  throw new Error(
    'The real API client is not implemented. Set VITE_USE_MOCK_API=true to serve fixtures.',
  );
}

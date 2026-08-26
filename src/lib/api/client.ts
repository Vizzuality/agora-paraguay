import { env } from "@/env";

import { placeholderFixtures } from "./fixtures/placeholders";
import {
  analysisRequestSchema,
  analysisResponseSchema,
  placeholderListSchema,
  type AnalysisRequest,
  type AnalysisResponse,
  type Placeholder,
} from "./schemas";

/**
 * The only module in the app that knows the data is fake.
 *
 * Everything else imports from `queries.ts`, so replacing the mock branch with a real
 * `fetch` implementation is a change confined to this file.
 *
 * Responses are parsed through the Zod schemas in both branches on purpose: it keeps
 * the fixtures honest, and it makes contract drift surface as a parse error at the
 * boundary instead of an `undefined` deep in a component.
 */
export async function fetchPlaceholders(): Promise<Placeholder[]> {
  if (env.VITE_USE_MOCK_API) {
    return placeholderListSchema.parse(placeholderFixtures);
  }

  throw new Error(
    "The real API client is not implemented. Set VITE_USE_MOCK_API=true to serve fixtures.",
  );
}

/** Keeps the pending state visible; goes when the real endpoint replaces the mock. */
const MOCK_ANALYSIS_LATENCY_MS = 400;

/** POSTs the areas of interest for analysis. Fake: the mock branch mints the 200. */
export async function submitAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
  // The request is parsed at the boundary too, so contract drift fails here instead of
  // as a 4xx against the future real API.
  const parsed = analysisRequestSchema.parse(request);

  if (env.VITE_USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_ANALYSIS_LATENCY_MS));

    // Stand-in for the network call: shows what the real endpoint would receive.
    console.info("submitAnalysis payload", parsed);

    return analysisResponseSchema.parse({
      id: crypto.randomUUID(),
      status: "accepted",
      receivedFeatures: parsed.features.length,
    });
  }

  throw new Error(
    "The real API client is not implemented. Set VITE_USE_MOCK_API=true to serve fixtures.",
  );
}

import { env } from "@/env";

import { placeholderFixtures } from "./fixtures/placeholders";
import { placeholderListSchema, type Placeholder } from "./schemas";

/**
 * The only module in the app that knows the data is fake.
 *
 * Everything else imports from `queries.ts`. When the external API exists, the real
 * `fetch` implementation replaces the mock branch here and nothing else moves.
 *
 * Responses are parsed through the Zod schemas in both branches on purpose: it keeps
 * the fixtures honest now, and it means contract drift later surfaces as a parse
 * error at the boundary instead of an `undefined` deep in a component.
 */
export async function fetchPlaceholders(): Promise<Placeholder[]> {
  if (env.VITE_USE_MOCK_API) {
    return placeholderListSchema.parse(placeholderFixtures);
  }

  throw new Error(
    "The real API client is not implemented yet. Unset VITE_USE_MOCK_API=false until the contract exists.",
  );
}

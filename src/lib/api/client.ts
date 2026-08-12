import { env } from "@/env";

import { placeholderFixtures } from "./fixtures/placeholders";
import { placeholderListSchema, type Placeholder } from "./schemas";

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

import { queryOptions } from "@tanstack/react-query";

import { fetchPlaceholders } from "./client";

/**
 * Query definitions. Components import from here and nowhere else in `lib/api`.
 *
 * Uses TanStack Query's native `queryOptions` — `query-key-factory` is Hold tier on
 * the Vizzuality Tech Radar and unmaintained.
 */
export const placeholderQueries = {
  all: () =>
    queryOptions({
      queryKey: ["placeholders"] as const,
      queryFn: fetchPlaceholders,
    }),
};

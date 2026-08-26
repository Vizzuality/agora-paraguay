import { mutationOptions, queryOptions } from "@tanstack/react-query";

import type { DrawnPolygon } from "@/lib/map/draw-features";

import { fetchPlaceholders, submitAnalysis } from "./client";
import { toAnalysisRequest } from "./schemas";

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

/**
 * Mutation definitions, the `mutationOptions` mirror of the above. Variables are the
 * drawn polygons themselves: the FeatureCollection payload is a data-layer concern
 * (`toAnalysisRequest`), invisible to components.
 */
export const analysisMutations = {
  submit: () =>
    mutationOptions({
      mutationKey: ["analysis", "submit"] as const,
      mutationFn: (polygons: DrawnPolygon[]) => submitAnalysis(toAnalysisRequest(polygons)),
    }),
};

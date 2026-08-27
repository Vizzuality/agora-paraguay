import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { fetchParcels, fetchPlaceholders, submitAnalysis } from "./client";
import { toAnalysisRequest, type AnalysisArea } from "./schemas";

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

export const parcelQueries = {
  all: () =>
    queryOptions({
      queryKey: ["parcels"] as const,
      queryFn: fetchParcels,
      // TODO(mock-parcels): staleTime pinned to Infinity only because the fixture is
      // static — revisit when the real parcel layer replaces the mock.
      staleTime: Infinity,
    }),
};

/**
 * Mutation definitions, the `mutationOptions` mirror of the above. Variables are the
 * areas themselves — drawn polygons and selected cadastral parcels alike: the
 * FeatureCollection payload is a data-layer concern (`toAnalysisRequest`), invisible
 * to components.
 */
export const analysisMutations = {
  submit: () =>
    mutationOptions({
      mutationKey: ["analysis", "submit"] as const,
      mutationFn: (areas: AnalysisArea[]) => submitAnalysis(toAnalysisRequest(areas)),
    }),
};

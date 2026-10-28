import { queryOptions } from '@tanstack/react-query';

import { fetchGlobalLayers } from './client';

export const layerQueries = {
  /** The country-wide layers: the same for every visitor, asked once per session. */
  global: () =>
    queryOptions({
      queryKey: ['layers', 'global'] as const,
      queryFn: fetchGlobalLayers,
      staleTime: Infinity,
    }),
};

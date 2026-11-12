import { useQuery } from '@tanstack/react-query';
import type { StyleSpecification } from 'maplibre-gl';
import { useMemo } from 'react';

import { BASEMAP_STYLE, CAPAS_BASEMAP_STYLE } from '@/lib/map/basemap';
import { composeBasemaps, type CompositeBasemap } from '@/lib/map/composite-basemap';

/** The satellite with the Capas basemap folded in; `undefined` while it loads, satellite alone on failure. */
export function useExposureBasemap(): CompositeBasemap | undefined {
  const base = BASEMAP_STYLE;
  const capas = useQuery({
    queryKey: ['basemap-style', CAPAS_BASEMAP_STYLE],
    queryFn: async () => {
      const response = await fetch(CAPAS_BASEMAP_STYLE);
      if (!response.ok) throw new Error(`Capas basemap style: HTTP ${response.status}`);
      return (await response.json()) as StyleSpecification;
    },
    enabled: typeof base !== 'string',
    staleTime: Infinity,
    retry: 1,
  });

  // A stable object: a new one would make the map swap its style and reload every layer.
  return useMemo(() => {
    const alone: CompositeBasemap = { style: base, baseLayerIds: [], overlayLayerIds: [] };

    if (typeof base === 'string' || capas.isError) return alone;
    if (!capas.data) return undefined;

    return composeBasemaps(base, capas.data);
  }, [base, capas.data, capas.isError]);
}

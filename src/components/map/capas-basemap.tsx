import { useQuery } from '@tanstack/react-query';
import type { Map as MapLibreMap, StyleSpecification } from 'maplibre-gl';
import { useEffect, useMemo } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import { BASEMAP_STYLE, CAPAS_BASEMAP_STYLE } from '@/lib/map/basemap';
import {
  basemapVisibility,
  firstLayerAbove,
  prefixedOverlay,
  type BasemapOverlay,
} from '@/lib/map/basemap-overlay';

const BASE_LAYER_IDS =
  typeof BASEMAP_STYLE === 'string' ? [] : BASEMAP_STYLE.layers.map((layer) => layer.id);

/** Adds the Capas basemap to the live map once fetched, hidden until `showOverlay`. */
export function CapasBasemap({ showOverlay }: Readonly<{ showOverlay: boolean }>) {
  const { current: mapRef } = useMap();
  const { data } = useQuery({
    queryKey: ['basemap-style', CAPAS_BASEMAP_STYLE],
    queryFn: async () => {
      const response = await fetch(CAPAS_BASEMAP_STYLE);
      if (!response.ok) throw new Error(`Capas basemap style: HTTP ${response.status}`);
      return (await response.json()) as StyleSpecification;
    },
    // A hosted base may bring its own glyphs and sprite, which the overlay would replace.
    enabled: typeof BASEMAP_STYLE !== 'string',
    staleTime: Infinity,
    retry: 1,
  });
  const overlay = useMemo(() => (data ? prefixedOverlay(data) : undefined), [data]);

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map || !overlay) return;

    const apply = () => {
      addOverlay(map, overlay);
      for (const [id, visibility] of basemapVisibility(
        BASE_LAYER_IDS,
        overlay.layers.map((layer) => layer.id),
        showOverlay,
      )) {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibility);
      }
    };

    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);

    return () => {
      map.off('load', apply);
    };
  }, [mapRef, overlay, showOverlay]);

  return null;
}

function addOverlay(map: MapLibreMap, overlay: BasemapOverlay) {
  if (overlay.layers.every((layer) => map.getLayer(layer.id))) return;

  if (overlay.glyphs) map.setGlyphs(overlay.glyphs);
  if (typeof overlay.sprite === 'string') map.setSprite(overlay.sprite);
  else for (const { id, url } of overlay.sprite ?? []) map.addSprite(id, url);
  for (const [id, source] of overlay.sources) {
    if (!map.getSource(id)) map.addSource(id, source);
  }

  const beforeId = firstLayerAbove(
    map.getStyle().layers.map((layer) => layer.id),
    new Set(BASE_LAYER_IDS),
  );
  for (const layer of overlay.layers) {
    if (!map.getLayer(layer.id)) map.addLayer(layer, beforeId);
  }
}

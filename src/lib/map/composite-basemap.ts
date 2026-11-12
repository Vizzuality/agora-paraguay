import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';

/** What the Capas basemap's sources and layers are prefixed with inside the composite style. */
export const CAPAS_BASEMAP_PREFIX = 'capas-basemap';

/** One style holding two basemaps, and which layers belong to each, so a tab only toggles them. */
export type CompositeBasemap = {
  style: string | StyleSpecification;
  baseLayerIds: string[];
  overlayLayerIds: string[];
};

/** `overlay` folded into `base`, prefixed and hidden; glyphs and sprite from whichever has them. */
export function composeBasemaps(
  base: StyleSpecification,
  overlay: StyleSpecification,
  prefix: string = CAPAS_BASEMAP_PREFIX,
): CompositeBasemap {
  const prefixed = (id: string) => `${prefix}-${id}`;
  const overlayLayers = overlay.layers.map(
    (layer) =>
      ({
        ...layer,
        id: prefixed(layer.id),
        ...('source' in layer && typeof layer.source === 'string'
          ? { source: prefixed(layer.source) }
          : {}),
        layout: { ...layer.layout, visibility: 'none' },
      }) as LayerSpecification,
  );

  return {
    style: {
      ...base,
      glyphs: base.glyphs ?? overlay.glyphs,
      sprite: base.sprite ?? overlay.sprite,
      sources: {
        ...base.sources,
        ...Object.fromEntries(
          Object.entries(overlay.sources).map(([id, source]) => [prefixed(id), source]),
        ),
      },
      layers: [...base.layers, ...overlayLayers],
    },
    baseLayerIds: base.layers.map((layer) => layer.id),
    overlayLayerIds: overlayLayers.map((layer) => layer.id),
  };
}

/** Each basemap layer's visibility with the overlay shown or the base. */
export function basemapVisibility(
  { baseLayerIds, overlayLayerIds }: CompositeBasemap,
  showOverlay: boolean,
): [id: string, visibility: 'visible' | 'none'][] {
  return [
    ...baseLayerIds.map((id): [string, 'visible' | 'none'] => [
      id,
      showOverlay ? 'none' : 'visible',
    ]),
    ...overlayLayerIds.map((id): [string, 'visible' | 'none'] => [
      id,
      showOverlay ? 'visible' : 'none',
    ]),
  ];
}

import type {
  LayerSpecification,
  SourceSpecification,
  SpriteSpecification,
  StyleSpecification,
} from 'maplibre-gl';

/** What the Capas basemap's sources and layers are prefixed with on the map. */
export const CAPAS_BASEMAP_PREFIX = 'capas-basemap';

/** A second basemap ready to add to a live map: ids prefixed, layers hidden. */
export type BasemapOverlay = {
  sources: [id: string, source: SourceSpecification][];
  layers: LayerSpecification[];
  glyphs?: string;
  sprite?: SpriteSpecification;
};

export function prefixedOverlay(
  style: StyleSpecification,
  prefix: string = CAPAS_BASEMAP_PREFIX,
): BasemapOverlay {
  const prefixed = (id: string) => `${prefix}-${id}`;

  return {
    sources: Object.entries(style.sources).map(([id, source]) => [prefixed(id), source]),
    layers: style.layers.map(
      (layer) =>
        ({
          ...layer,
          id: prefixed(layer.id),
          ...('source' in layer && typeof layer.source === 'string'
            ? { source: prefixed(layer.source) }
            : {}),
          layout: { ...layer.layout, visibility: 'none' },
        }) as LayerSpecification,
    ),
    glyphs: style.glyphs,
    sprite: style.sprite,
  };
}

/** The first layer above the basemap, which the overlay's layers go under; none if nothing is. */
export function firstLayerAbove(layerIds: string[], basemapIds: Set<string>): string | undefined {
  return layerIds.find((id) => !basemapIds.has(id));
}

/** Each basemap layer's visibility with the overlay shown or the base. */
export function basemapVisibility(
  baseLayerIds: string[],
  overlayLayerIds: string[],
  showOverlay: boolean,
): [id: string, visibility: 'visible' | 'none'][] {
  const shown = (visible: boolean): 'visible' | 'none' => (visible ? 'visible' : 'none');

  return [
    ...baseLayerIds.map((id): [string, 'visible' | 'none'] => [id, shown(!showOverlay)]),
    ...overlayLayerIds.map((id): [string, 'visible' | 'none'] => [id, shown(showOverlay)]),
  ];
}

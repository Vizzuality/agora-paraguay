import type { GeoJSONStoreFeatures, HexColor } from 'terra-draw';

/**
 * Per-feature Terra Draw styling for the parcel polygons, per the design's parcel styles.
 *
 * The analysis selection cannot be a separate highlight layer: stacking a translucent
 * fill over Terra Draw's own fill muddies both, so the selected color is applied to
 * the feature itself.
 */

type ParcelVariant = {
  fill: HexColor;
  fillOpacity: number;
  outline: HexColor;
  outlineWidth: number;
};

/** The design's highlight yellow — the same one `parcels-layer.tsx` paints selected parcels. */
const HIGHLIGHT: HexColor = '#F1FF28';

/**
 * Hand-drawn parcels and the analysis selection: highlight yellow at 50%. Drawn
 * polygons get it from the first vertex on, so nothing on the map is ever Terra
 * Draw's default blue.
 */
const YELLOW: ParcelVariant = {
  fill: HIGHLIGHT,
  fillOpacity: 0.5,
  outline: HIGHLIGHT,
  outlineWidth: 2,
};

/** Uploaded parcels: white at 10% with a white outline, until selected for analysis. */
const UPLOAD: ParcelVariant = {
  fill: '#FFFFFF',
  fillOpacity: 0.1,
  outline: '#FFFFFF',
  outlineWidth: 2,
};

/**
 * Once `filter-parcels` has answered, the parcels replace the drawing on the map: the
 * drawn or uploaded polygon is painted fully transparent (`hidden`, set by
 * `setPolygonsHiddenAtom`) rather than removed, since its geometry still drives the
 * parcels query and the analysis.
 */
const HIDDEN: ParcelVariant = {
  fill: '#000000',
  fillOpacity: 0,
  outline: '#000000',
  outlineWidth: 0,
};

function variant(feature: GeoJSONStoreFeatures): ParcelVariant {
  if (feature.properties.hidden === true) return HIDDEN;
  if (feature.properties.analysis === true) return YELLOW;
  if (feature.properties.origin === 'upload') return UPLOAD;

  return YELLOW;
}

/**
 * Style functions for `TerraDrawPolygonMode`. They style off feature properties alone
 * (`analysis`, set by `selectAnalysisPolygonAtom`; `origin`, set by the upload
 * pipeline): a property change is a feature change, which busts Terra Draw's style
 * cache and repaints on its own — no imperative repaint call anywhere.
 *
 * The point styles cover the closing point, the vertices and the snapping/edit
 * handles shown while drawing — all blue by default.
 */
export const PARCEL_STYLES = {
  fillColor: (feature: GeoJSONStoreFeatures) => variant(feature).fill,
  fillOpacity: (feature: GeoJSONStoreFeatures) => variant(feature).fillOpacity,
  outlineColor: (feature: GeoJSONStoreFeatures) => variant(feature).outline,
  outlineWidth: (feature: GeoJSONStoreFeatures) => variant(feature).outlineWidth,
  closingPointColor: HIGHLIGHT,
  closingPointOutlineColor: '#FFFFFF' as HexColor,
  snappingPointColor: HIGHLIGHT,
  snappingPointOutlineColor: '#FFFFFF' as HexColor,
  editedPointColor: HIGHLIGHT,
  editedPointOutlineColor: '#FFFFFF' as HexColor,
  coordinatePointColor: HIGHLIGHT,
  coordinatePointOutlineColor: '#FFFFFF' as HexColor,
};

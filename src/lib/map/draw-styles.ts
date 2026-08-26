import type { GeoJSONStoreFeatures, HexColor } from "terra-draw";

/**
 * Per-feature Terra Draw styling for the parcel polygons (Figma parcel styles).
 *
 * Terra Draw's adapter paints hex + opacity only, so the design's dot texture cannot
 * live here — `<ParcelPattern>` overlays it as a MapLibre `fill-pattern` layer. The
 * analysis selection also cannot be a separate highlight layer: stacking a translucent
 * fill over Terra Draw's own fill muddies both, so the selected color is applied to
 * the feature itself.
 */

type ParcelVariant = {
  fill: HexColor;
  fillOpacity: number;
  outline: HexColor;
  outlineWidth: number;
};

/** Selected for analysis: the design's highlight yellow at 50%. */
const ANALYSIS: ParcelVariant = {
  fill: "#F1FF28",
  fillOpacity: 0.5,
  outline: "#F1FF28",
  outlineWidth: 2,
};

/** Uploaded parcels: white at 10% with a white outline. */
const UPLOAD: ParcelVariant = {
  fill: "#FFFFFF",
  fillOpacity: 0.1,
  outline: "#FFFFFF",
  outlineWidth: 2,
};

function variant(feature: GeoJSONStoreFeatures): ParcelVariant | undefined {
  if (feature.properties.analysis === true) return ANALYSIS;
  if (feature.properties.origin === "upload") return UPLOAD;

  return undefined;
}

/**
 * Style functions for `TerraDrawPolygonMode`. They style off feature properties alone
 * (`analysis`, set by `selectAnalysisPolygonAtom`; `origin`, set by the upload
 * pipeline): a property change is a feature change, which busts Terra Draw's style
 * cache and repaints on its own — no imperative repaint call anywhere.
 *
 * Returning `undefined` keeps Terra Draw's default (blue) for hand-drawn parcels.
 */
export const PARCEL_STYLES = {
  fillColor: (feature: GeoJSONStoreFeatures) => variant(feature)?.fill,
  fillOpacity: (feature: GeoJSONStoreFeatures) => variant(feature)?.fillOpacity,
  outlineColor: (feature: GeoJSONStoreFeatures) => variant(feature)?.outline,
  outlineWidth: (feature: GeoJSONStoreFeatures) => variant(feature)?.outlineWidth,
};

/**
 * The dot texture the Figma parcel fill repeats every 50px, generated as raw RGBA
 * pixels so no image asset or DOM canvas is needed — MapLibre's `addImage` accepts
 * `{ width, height, data }` directly.
 *
 * One dot at the tile center, so the repeat is an axis-aligned square grid — center
 * placement keeps the dot whole inside the tile, so tiles join seamlessly.
 *
 * The dot is a square (Chebyshev distance, not Euclidean): at this size a rasterised
 * disc reads as a diamond, and the design's marks are squares.
 */
export function dotPatternImage(size = 50, radius = 2, alpha = 178) {
  const data = new Uint8ClampedArray(size * size * 4);
  // Pixel centers sit at x + 0.5, so measure from center - 0.5 to keep the square
  // symmetric inside an even-sized tile.
  const center = size / 2 - 0.5;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (Math.max(Math.abs(x - center), Math.abs(y - center)) > radius) continue;

      const offset = (y * size + x) * 4;

      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
      data[offset + 3] = alpha;
    }
  }

  return { width: size, height: size, data };
}

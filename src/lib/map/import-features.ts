import type { TerraDraw } from 'terra-draw';

import { drawnPolygons, type DrawnPolygon } from '@/lib/map/draw-features';
import type { UploadFeature, UploadWarning } from '@/lib/upload/types';

export type ImportOutcome = {
  /** Features Terra Draw accepted. Empty means the map was left untouched. */
  accepted: UploadFeature[];
  /** One user-facing warning per feature Terra Draw rejected. */
  rejectionWarnings: UploadWarning[];
  /** The finished polygons in the store after the import. */
  polygons: DrawnPolygon[];
};

/**
 * Adds uploaded features to Terra Draw with replace semantics: an upload starts the
 * selection over, so everything that was on the map — hand-drawn and previously
 * uploaded alike — is removed even when every new feature is rejected. The Terra Draw
 * mechanics live here so the store atom (`uploadFeaturesAtom`) only coordinates state,
 * and so this logic is testable in node against a real Terra Draw instance.
 */
export function importReplacingFeatures(draw: TerraDraw, features: UploadFeature[]): ImportOutcome {
  const previousIds = drawnPolygons(draw.getSnapshot()).map((polygon) => polygon.id);

  // The store validates each feature on its own: valid ones land, invalid ones come
  // back with a reason and become warnings rather than failing the upload.
  const validations = draw.addFeatures(features);
  const rejectedIds = new Set(
    validations.filter((validation) => !validation.valid).map((validation) => validation.id),
  );

  const rejectionWarnings = features
    .filter((feature) => rejectedIds.has(feature.id))
    .map((feature) => {
      const reason = validations.find((validation) => validation.id === feature.id)?.reason;

      return {
        featureName: feature.properties.name,
        // Terra Draw's `reason` is library text and stays in English.
        message: `"${feature.properties.name}" fue rechazado: ${reason ?? 'geometría inválida'}.`,
      };
    });

  const accepted = features.filter((feature) => !rejectedIds.has(feature.id));

  if (previousIds.length > 0) {
    draw.removeFeatures(previousIds);
  }

  return {
    accepted,
    rejectionWarnings,
    polygons: drawnPolygons(draw.getSnapshot()),
  };
}

/**
 * Re-adds surviving polygons to a freshly-bound Terra Draw instance, after the map that
 * owned the previous instance unmounted (navigating to /analisis and back). The features
 * came out of the previous instance's snapshot, so they keep their ids — which is what
 * keeps `analysisId` valid — and their `analysis` property, which is what repaints the
 * highlight. Converges on the store: returns what Terra Draw actually accepted.
 */
export function restoreFeatures(draw: TerraDraw, polygons: DrawnPolygon[]): DrawnPolygon[] {
  draw.addFeatures(polygons);

  return drawnPolygons(draw.getSnapshot());
}

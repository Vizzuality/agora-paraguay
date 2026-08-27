import type { TerraDraw } from 'terra-draw';

import { drawnPolygons, type DrawnPolygon, type FeatureId } from '@/lib/map/draw-features';
import type { UploadFeature, UploadWarning } from '@/lib/upload/types';

export type ImportOutcome = {
  /** Features Terra Draw accepted. Empty means the map was left untouched. */
  accepted: UploadFeature[];
  /** One user-facing warning per feature Terra Draw rejected. */
  rejectionWarnings: UploadWarning[];
  /** The selected id, when the import removed the feature it pointed at. */
  deselectedId: FeatureId | null;
  /** The finished polygons in the store after the import. */
  polygons: DrawnPolygon[];
};

/**
 * Adds uploaded features to Terra Draw with replace semantics: once at least one new
 * feature is accepted, everything that was on the map — hand-drawn and previously
 * uploaded alike — is removed. The Terra Draw mechanics live here so the store atom
 * (`uploadFeaturesAtom`) only coordinates state, and so this logic is testable in node
 * against a real Terra Draw instance.
 */
export function importReplacingFeatures(
  draw: TerraDraw,
  features: UploadFeature[],
  selectedId: FeatureId | null,
): ImportOutcome {
  const previousIds = drawnPolygons(draw.getSnapshot()).map((polygon) => polygon.id);

  // The store validates each feature on its own: valid ones land, invalid ones come
  // back with a reason and become warnings rather than failing the upload. Adding
  // happens BEFORE removing, so a fully-rejected upload never costs the polygons
  // already on the map.
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

  // Nothing landed: the map is untouched and the previous polygons stay.
  if (accepted.length === 0) {
    return {
      accepted,
      rejectionWarnings,
      deselectedId: null,
      polygons: drawnPolygons(draw.getSnapshot()),
    };
  }

  // Deselect before removing, mirroring `deleteSelectedAtom`: selection points must
  // not outlive the geometry they annotate.
  const deselectedId = selectedId !== null && previousIds.includes(selectedId) ? selectedId : null;

  if (deselectedId !== null) {
    draw.deselectFeature(deselectedId);
  }

  if (previousIds.length > 0) {
    draw.removeFeatures(previousIds);
  }

  return {
    accepted,
    rejectionWarnings,
    deselectedId,
    polygons: drawnPolygons(draw.getSnapshot()),
  };
}

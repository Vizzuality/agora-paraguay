import { TerraDrawPolygonMode } from 'terra-draw';

type Validation = ReturnType<TerraDrawPolygonMode['validateFeature']>;

/**
 * Terra Draw's polygon mode hard-rejects interior rings ("Feature has holes") and the
 * check is not configurable. Uploaded farms legitimately carry holes (lagoons,
 * easements), so this mode lets multi-ring polygons straight through — `normalize.ts`
 * has already closed and rounded every ring by the time they reach the store.
 */
export class HoleTolerantPolygonMode extends TerraDrawPolygonMode {
  override validateFeature(feature: unknown): Validation {
    if (hasInteriorRings(feature)) return { valid: true };

    return super.validateFeature(feature);
  }
}

function hasInteriorRings(feature: unknown): boolean {
  if (typeof feature !== 'object' || feature === null) return false;

  const { geometry } = feature as { geometry?: { type?: unknown; coordinates?: unknown } };

  return (
    geometry?.type === 'Polygon' &&
    Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length > 1
  );
}

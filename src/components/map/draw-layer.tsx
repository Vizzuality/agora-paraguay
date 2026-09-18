import { useFitToAreas } from '@/lib/map/use-fit-to-areas';
import { useParcelClick } from '@/lib/map/use-parcel-click';
import { useTerraDraw } from '@/lib/map/use-terra-draw';

/**
 * Binds Terra Draw to the enclosing `<Map>`, plus the idle-mode click that flips the
 * parcels `filter-parcels` answered, plus the camera fit when new areas land. Renders
 * nothing: the controls live outside the map, next to everything else that reads the
 * drawn polygon.
 */
export function DrawLayer() {
  useTerraDraw();
  useParcelClick();
  useFitToAreas();

  return null;
}

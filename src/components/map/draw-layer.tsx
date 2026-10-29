import { useFitToAreas } from '@/lib/map/use-fit-to-areas';
import { useHideDrawingBehindParcels } from '@/lib/map/use-hide-drawing-behind-parcels';
import { useParcelClick } from '@/lib/map/use-parcel-click';
import { useRejectOversizedAreas } from '@/lib/map/use-reject-oversized-areas';
import { useRejectUncoveredAreas } from '@/lib/map/use-reject-uncovered-areas';
import { useTerraDraw } from '@/lib/map/use-terra-draw';

/**
 * Binds Terra Draw to the enclosing `<Map>` and gathers its side effects: the idle-mode
 * click that flips the parcels `filter-parcels` answered, the camera fly when new areas
 * land, hiding the drawing once its parcels are on the map, and clearing it when the
 * areas are over the size limit or the answer says they are outside coverage. Renders nothing: the controls live outside
 * the map, next to everything else that reads the drawn polygon.
 */
export function DrawLayer() {
  useTerraDraw();
  useParcelClick();
  useFitToAreas();
  useHideDrawingBehindParcels();
  useRejectOversizedAreas();
  useRejectUncoveredAreas();

  return null;
}

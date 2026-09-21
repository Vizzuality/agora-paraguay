import { useFitToAreas } from '@/lib/map/use-fit-to-areas';
import { useHideDrawingBehindParcels } from '@/lib/map/use-hide-drawing-behind-parcels';
import { useParcelClick } from '@/lib/map/use-parcel-click';
import { useTerraDraw } from '@/lib/map/use-terra-draw';

/**
 * Binds Terra Draw to the enclosing `<Map>` and gathers its side effects: the idle-mode
 * click that flips the parcels `filter-parcels` answered, the camera fly when new areas
 * land, and hiding the drawing once its parcels are on the map. Renders nothing: the
 * controls live outside the map, next to everything else that reads the drawn polygon.
 */
export function DrawLayer() {
  useTerraDraw();
  useParcelClick();
  useFitToAreas();
  useHideDrawingBehindParcels();

  return null;
}

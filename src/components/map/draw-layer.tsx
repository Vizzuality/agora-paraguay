import { useParcelClick } from '@/lib/map/use-parcel-click';
import { useTerraDraw } from '@/lib/map/use-terra-draw';

/**
 * Binds Terra Draw to the enclosing `<Map>`, plus the idle-mode click-to-select on the
 * drawn parcels. Renders nothing: the controls live outside the map, next to everything
 * else that reads the drawn polygon.
 */
export function DrawLayer() {
  useTerraDraw();
  useParcelClick();

  return null;
}

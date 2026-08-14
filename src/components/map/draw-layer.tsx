import { useTerraDraw } from "@/lib/map/use-terra-draw";

/**
 * Binds Terra Draw to the enclosing `<Map>`. Renders nothing: the controls live outside
 * the map, next to everything else that reads the drawn polygon.
 */
export function DrawLayer() {
  useTerraDraw();

  return null;
}

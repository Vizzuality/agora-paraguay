import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import { areasBounds, FIT_PADDING, newlyAdded } from '@/lib/map/area-bounds';
import { drawPolygonsAtom } from '@/store/draw';

/** Close enough to see one farm's parcels; a single small polygon must not zoom to the rooftops. */
const FIT_MAX_ZOOM = 16;

/**
 * Flies the camera to the areas the moment new ones land — a finished drawing or an
 * upload — so the user sees where their selection is. One animation per addition; the
 * parcels `filter-parcels` answers sit within a 50 m buffer of the areas, so they are in
 * frame too. Only additions move the camera: editing a vertex, deleting an area or coming
 * back from /analisis (the store restores the same ids) leave it where the user put it.
 * The move reaches the URL through the map's `moveend` like any other.
 *
 * Runs inside `<Map>` (needs react-map-gl's context), mounted from `DrawLayer`.
 */
export function useFitToAreas() {
  const { current: mapRef } = useMap();
  const polygons = useAtomValue(drawPolygonsAtom);
  // The ids already framed. `null` until the first render, which only records them.
  const known = useRef<string[] | null>(null);

  useEffect(() => {
    const ids = polygons.map((polygon) => String(polygon.id));
    const previous = known.current;
    known.current = ids;

    if (previous === null || newlyAdded(previous, ids).length === 0) return;

    const map = mapRef?.getMap();
    const bounds = areasBounds(polygons);

    if (!map || bounds === null) return;

    // `fitBounds` flies (zoom out, glide, zoom in) unless asked to be linear.
    map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, duration: 900 });
  }, [mapRef, polygons]);
}

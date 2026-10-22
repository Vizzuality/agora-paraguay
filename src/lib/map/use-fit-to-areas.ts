import { useAtomValue } from 'jotai';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { parseAsFloat, useQueryStates } from 'nuqs';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import { featuresBounds, FIT_PADDING, newlyAdded } from '@/lib/map/area-bounds';
import { INITIAL_VIEW_STATE } from '@/lib/map/view-state';
import { drawPolygonsAtom } from '@/store/draw';

/** Close enough to see one farm's parcels; a single small polygon must not zoom to the rooftops. */
const FIT_MAX_ZOOM = 16;

/** One ease for both directions: pan and zoom together, no two-stage fly. */
const EASE = { duration: 900, linear: true } as const;

/**
 * Eases the camera to the areas the moment new ones land — a finished drawing or an
 * upload — so the user sees where their selection is. One move per addition; the
 * parcels `filter-parcels` answers sit within a few metres of the areas, so they fall
 * inside the frame too. The mirror move: when the last area goes (Reiniciar, a failed
 * upload, an area outside coverage), the camera eases back to the opening view of the
 * country, so the next selection starts where the first did. Editing a vertex or coming
 * back from /analisis with Back (the store restores the same ids, the URL still has the
 * camera) leave the camera where the user put it; back through a plain link, with no
 * camera in the URL, the map opens on the areas instead of the opening view. All moves
 * reach the URL through the map's `moveend` like any other.
 *
 * Runs inside `<Map>` (needs react-map-gl's context), mounted from `DrawLayer`.
 */
export function useFitToAreas() {
  const { current: mapRef } = useMap();
  const polygons = useAtomValue(drawPolygonsAtom);
  // The ids already framed. `null` until the first render, which only records them.
  const known = useRef<string[] | null>(null);
  // Without defaults: `null` means the URL carries no camera.
  const [camera] = useQueryStates({ lng: parseAsFloat, lat: parseAsFloat, zoom: parseAsFloat });
  const cameraInUrl = camera.lng !== null && camera.lat !== null && camera.zoom !== null;

  useEffect(() => {
    const map = mapRef?.getMap();

    if (!map) return;

    const ids = polygons.map((polygon) => String(polygon.id));
    const previous = known.current;
    known.current = ids;

    if (previous === null) {
      // A resumed selection reached without a camera opens on its areas, no ease.
      if (ids.length > 0 && !cameraInUrl) fitAreas(map, polygons, { duration: 0 });
      return;
    }

    if (previous.length > 0 && ids.length === 0) {
      map.easeTo({
        center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
        zoom: INITIAL_VIEW_STATE.zoom,
        ...EASE,
      });
      return;
    }

    if (newlyAdded(previous, ids).length === 0) return;

    fitAreas(map, polygons, EASE);
  }, [mapRef, polygons, cameraInUrl]);
}

function fitAreas(
  map: MaplibreMap,
  polygons: Parameters<typeof featuresBounds>[0],
  animation: { duration: number; linear?: boolean },
) {
  const bounds = featuresBounds(polygons);

  if (bounds === null) return;

  // `linear`: one ease that pans and zooms in together. The default fly curve zooms
  // out first, glides, then zooms in — reads as two moves from country scale.
  map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, ...animation });
}

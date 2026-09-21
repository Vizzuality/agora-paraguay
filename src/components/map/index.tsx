import { useNavigate } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { parseAsFloat, useQueryStates } from 'nuqs';
import { useCallback, useLayoutEffect, useRef, type ReactNode } from 'react';
import Map, {
  AttributionControl,
  ScaleControl,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre';

import { DrawLayer } from '@/components/map/draw-layer';
import { FilteredParcelsLayer } from '@/components/map/filtered-parcels-layer';
import { ParcelPattern } from '@/components/map/parcel-pattern';
import { ZoomControl } from '@/components/map/zoom-control';
import { collapseAttribution } from '@/lib/map/attribution';
import { BASEMAP_STYLE, INITIAL_VIEW_STATE, MAX_BOUNDS } from '@/lib/map/basemap';
import { normalizeViewState } from '@/lib/map/view-state';
import { drawAtom } from '@/store/draw';
// Worker setup (see worker.ts) — without it the style never loads and the map is blank.
import '@/components/map/worker';

import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * The camera lives in the URL, so a view is shareable and survives a reload.
 * Geometry never goes here — only the three numbers describing where we are looking.
 * Read through nuqs (parsing, defaults); written through the router in `handleMoveEnd`.
 */
function useMapViewState() {
  const [viewState] = useQueryStates({
    lng: parseAsFloat.withDefault(INITIAL_VIEW_STATE.longitude),
    lat: parseAsFloat.withDefault(INITIAL_VIEW_STATE.latitude),
    zoom: parseAsFloat.withDefault(INITIAL_VIEW_STATE.zoom),
  });

  return viewState;
}

export function MapView({ children }: { children?: ReactNode }) {
  const viewState = useMapViewState();
  const navigate = useNavigate();
  const { bound } = useAtomValue(drawAtom);

  // Leaving the page while the camera animates (a fit to new areas) makes MapLibre's
  // teardown stop the animation, which fires one last `moveend`. Writing it to the URL
  // then would navigate back to `/`: the nuqs adapter targets the pathname it was
  // mounted under. A layout-effect cleanup runs before the child map's own teardown,
  // so this flag is already down when that `moveend` arrives.
  const alive = useRef(true);

  useLayoutEffect(() => {
    alive.current = true;

    return () => {
      alive.current = false;
    };
  }, []);

  // Written through the router, synchronously, not through nuqs's setter: nuqs queues
  // writes (50 ms at least) and targets the pathname captured when they were queued, so
  // a camera write queued just before Analizar navigates would land on /analisis as a
  // jump back to `/`. `replace`, so the back button never replays pans and zooms.
  const handleMoveEnd = useCallback(
    (event: ViewStateChangeEvent) => {
      if (!alive.current) return;

      const next = normalizeViewState({
        longitude: event.viewState.longitude,
        latitude: event.viewState.latitude,
        zoom: event.viewState.zoom,
      });

      void navigate({
        to: '.',
        search: (previous) => ({
          ...previous,
          lng: next.longitude,
          lat: next.latitude,
          zoom: next.zoom,
        }),
        replace: true,
      });
    },
    [navigate],
  );

  return (
    <Map
      initialViewState={{
        longitude: viewState.lng,
        latitude: viewState.lat,
        zoom: viewState.zoom,
      }}
      mapStyle={BASEMAP_STYLE}
      maxBounds={MAX_BOUNDS}
      onLoad={(event) => collapseAttribution(event.target)}
      onMoveEnd={handleMoveEnd}
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
    >
      {/* Same corner, JSX order = add order: the scale sits before the attribution. */}
      <ScaleControl position="bottom-left" />
      <AttributionControl compact position="bottom-left" />
      <ZoomControl />
      {/*
       * The parcels filter-parcels answers for the drawn areas. Mounted only once Terra
       * Draw is bound: MapLibre paints layers in add order, and on a remount (back from
       * /analisis) the cached answer would otherwise add these layers before Terra Draw's,
       * leaving the drawing on top of the parcels it is meant to hide behind.
       */}
      {bound && <FilteredParcelsLayer />}
      <DrawLayer />
      <ParcelPattern />
      {children}
    </Map>
  );
}

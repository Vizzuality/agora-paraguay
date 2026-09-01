import { parseAsFloat, useQueryStates } from 'nuqs';
import { useCallback, type ReactNode } from 'react';
import Map, {
  AttributionControl,
  ScaleControl,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre';

import { DrawLayer } from '@/components/map/draw-layer';
import { ParcelPattern } from '@/components/map/parcel-pattern';
import { ParcelsLayer } from '@/components/map/parcels-layer';
import { ZoomControl } from '@/components/map/zoom-control';
import { collapseAttribution } from '@/lib/map/attribution';
import { BASEMAP_STYLE, INITIAL_VIEW_STATE, MAX_BOUNDS } from '@/lib/map/basemap';
import { normalizeViewState } from '@/lib/map/view-state';
// Worker setup (see worker.ts) — without it the style never loads and the map is blank.
import '@/components/map/worker';

import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * The camera lives in the URL, so a view is shareable and survives a reload.
 * Geometry never goes here — only the three numbers describing where we are looking.
 */
function useMapViewState() {
  return useQueryStates(
    {
      lng: parseAsFloat.withDefault(INITIAL_VIEW_STATE.longitude),
      lat: parseAsFloat.withDefault(INITIAL_VIEW_STATE.latitude),
      zoom: parseAsFloat.withDefault(INITIAL_VIEW_STATE.zoom),
    },
    // The URL is rewritten on every camera move, so keep it out of session history:
    // otherwise the back button replays each pan and zoom one frame at a time.
    { history: 'replace', throttleMs: 200 },
  );
}

export function MapView({ children }: { children?: ReactNode }) {
  const [viewState, setViewState] = useMapViewState();

  const handleMoveEnd = useCallback(
    (event: ViewStateChangeEvent) => {
      const next = normalizeViewState({
        longitude: event.viewState.longitude,
        latitude: event.viewState.latitude,
        zoom: event.viewState.zoom,
      });

      void setViewState({
        lng: next.longitude,
        lat: next.latitude,
        zoom: next.zoom,
      });
    },
    [setViewState],
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
      {/* TODO(mock-parcels): mock layer — swap for the real parcels source when available. */}
      <ParcelsLayer />
      <DrawLayer />
      <ParcelPattern />
      {children}
    </Map>
  );
}

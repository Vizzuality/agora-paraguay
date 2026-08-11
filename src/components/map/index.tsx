import { parseAsFloat, useQueryStates } from "nuqs";
import { useCallback, type ReactNode } from "react";
import Map, {
  NavigationControl,
  ScaleControl,
  type ViewStateChangeEvent,
} from "react-map-gl/maplibre";

import { BASEMAP_STYLE_URL, INITIAL_VIEW_STATE, MAX_BOUNDS } from "@/lib/map/basemap";
import { normalizeViewState } from "@/lib/map/view-state";

import "maplibre-gl/dist/maplibre-gl.css";

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
    { history: "replace", throttleMs: 200 },
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

      void setViewState({ lng: next.longitude, lat: next.latitude, zoom: next.zoom });
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
      mapStyle={BASEMAP_STYLE_URL}
      maxBounds={MAX_BOUNDS}
      onMoveEnd={handleMoveEnd}
      style={{ width: "100%", height: "100%" }}
      attributionControl={{ compact: true }}
    >
      <NavigationControl position="top-right" showCompass={false} />
      <ScaleControl position="bottom-right" />
      {children}
    </Map>
  );
}

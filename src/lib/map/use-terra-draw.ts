import { useEffect, useRef } from "react";
import { useMap } from "react-map-gl/maplibre";
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode } from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";

export type DrawMode = "polygon" | "select";

/**
 * Binds Terra Draw to the MapLibre instance rendered by react-map-gl.
 *
 * Terra Draw is imperative and framework-agnostic, so the lifecycle is ours to own:
 * it must start after the style has loaded, because the adapter installs its own
 * sources and layers, and it must stop on unmount or the listeners outlive the map.
 */
export function useTerraDraw(mode: DrawMode | null) {
  const { current: mapRef } = useMap();
  const drawRef = useRef<TerraDraw | null>(null);

  useEffect(() => {
    const map = mapRef?.getMap();

    if (!map) return;

    const start = () => {
      const draw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map }),
        modes: [new TerraDrawPolygonMode(), new TerraDrawSelectMode()],
      });

      draw.start();
      drawRef.current = draw;
    };

    // isStyleLoaded() is false on first mount but true whenever the hook re-runs
    // against an already-live map, so both paths have to be handled.
    if (map.isStyleLoaded()) {
      start();
    } else {
      map.once("load", start);
    }

    return () => {
      map.off("load", start);
      drawRef.current?.stop();
      drawRef.current = null;
    };
  }, [mapRef]);

  useEffect(() => {
    const draw = drawRef.current;

    if (!draw?.enabled) return;

    draw.setMode(mode ?? "static");
  }, [mode]);

  return drawRef;
}

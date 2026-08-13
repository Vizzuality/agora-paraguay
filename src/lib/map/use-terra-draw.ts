import { useEffect, useState } from "react";
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
 *
 * The instance is state rather than a ref on purpose. A ref does not re-render, so
 * the mode effect below would run once against a null instance and never again —
 * leaving the map in `static` mode with the control showing as on.
 */
export function useTerraDraw(mode: DrawMode | null) {
  const { current: mapRef } = useMap();
  const [draw, setDraw] = useState<TerraDraw | null>(null);

  useEffect(() => {
    const map = mapRef?.getMap();

    if (!map) return;

    let started: TerraDraw | undefined;

    const start = () => {
      started = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map }),
        modes: [new TerraDrawPolygonMode(), new TerraDrawSelectMode()],
      });

      started.start();
      setDraw(started);
    };

    // The style is not loaded on first mount — `getStyle()` returns undefined until
    // it is — but it will be if this ever re-runs against a live map, in which case
    // `load` has already fired and would never fire again.
    if (map.isStyleLoaded()) {
      start();
    } else {
      map.once("load", start);
    }

    return () => {
      map.off("load", start);
      started?.stop();
      setDraw(null);
    };
  }, [mapRef]);

  // `draw` is a dependency so the mode is applied when the instance appears, not
  // only when the mode changes: without it, a toggle pressed during style load is
  // swallowed and never reaches Terra Draw.
  useEffect(() => {
    if (!draw?.enabled) return;

    draw.setMode(mode ?? "static");
  }, [draw, mode]);

  return draw;
}

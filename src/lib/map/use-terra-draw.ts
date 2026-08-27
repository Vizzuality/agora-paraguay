import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import {
  TerraDraw,
  TerraDrawPolygonMode,
  TerraDrawSelectMode,
  type TerraDrawEventListeners,
} from 'terra-draw';
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter';

import { PARCEL_STYLES } from '@/lib/map/draw-styles';
import {
  bindDrawAtom,
  drawModeAtom,
  reportDeselectedAtom,
  reportGeometryAtom,
  reportSelectedAtom,
} from '@/store/draw';

/**
 * Binds Terra Draw to the MapLibre instance rendered by react-map-gl.
 *
 * Terra Draw, its MapLibre adapter and react-map-gl all touch the DOM at import time,
 * so nothing here may be pulled into a server render — the map renders inside
 * `<ClientOnly>` (see `src/routes/index.tsx`).
 *
 * Terra Draw is imperative and framework-agnostic, so the lifecycle is ours to own:
 * it must start after the style has loaded, because the adapter installs its own
 * sources and layers, and it must stop on unmount or the listeners outlive the map.
 *
 * The instance is state rather than a ref on purpose. A ref does not re-render, so
 * the mode effect below would run once against a null instance and never again —
 * leaving the map in `static` mode with the control showing as on.
 *
 * The drawn geometry itself lives in the atoms in `src/store/draw.ts`, because the
 * controls and the panel that read it are outside this subtree.
 */
export function useTerraDraw() {
  const { current: mapRef } = useMap();
  const [draw, setDraw] = useState<TerraDraw | null>(null);
  const mode = useAtomValue(drawModeAtom);
  const bind = useSetAtom(bindDrawAtom);
  const reportGeometry = useSetAtom(reportGeometryAtom);
  const reportSelected = useSetAtom(reportSelectedAtom);
  const reportDeselected = useSetAtom(reportDeselectedAtom);

  // Every dependency here is a stable setter, so this effect only re-runs when the map
  // itself changes. Anything geometry-shaped in this list would tear down and rebuild
  // Terra Draw on every vertex drag.
  useEffect(() => {
    const map = mapRef?.getMap();

    if (!map) return;

    let started: TerraDraw | undefined;
    let detach: (() => void) | undefined;

    const start = () => {
      started = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map }),
        modes: [
          new TerraDrawPolygonMode({ styles: PARCEL_STYLES }),
          new TerraDrawSelectMode({
            // Without a flags entry for `polygon`, select mode refuses to select
            // anything: no select or deselect event ever fires and editing is a silent
            // no-op.
            flags: {
              polygon: {
                feature: {
                  draggable: true,
                  coordinates: { draggable: true, midpoints: true, deletable: true },
                },
              },
            },
          }),
        ],
      });

      const instance = started;

      // Drawing stays armed after a polygon is finished, so several can be drawn in a
      // row without going back to the toolbar.
      const onFinish: TerraDrawEventListeners['finish'] = () => {
        reportGeometry(instance.getSnapshot());
      };

      const onChange: TerraDrawEventListeners['change'] = (_ids, type) => {
        if (type === 'styling') return;

        reportGeometry(instance.getSnapshot());
      };

      // Both handlers recompute from `getSnapshot()` rather than from the event's ids,
      // so a change that arrives while another is being handled still converges on the
      // same answer.
      instance.on('finish', onFinish);
      instance.on('change', onChange);
      instance.on('select', reportSelected);
      instance.on('deselect', reportDeselected);

      detach = () => {
        instance.off('finish', onFinish);
        instance.off('change', onChange);
        instance.off('select', reportSelected);
        instance.off('deselect', reportDeselected);
      };

      // Listeners are attached before `start()` because `ready` fires inside it.
      instance.start();
      setDraw(instance);
      bind(instance);
    };

    // The style is not loaded on first mount — `getStyle()` returns undefined until
    // it is — but it will be if this ever re-runs against a live map, in which case
    // `load` has already fired and would never fire again.
    if (map.isStyleLoaded() || map.loaded()) {
      start();
    } else {
      map.once('load', start);
    }

    return () => {
      map.off('load', start);
      bind(null);
      started?.stop();
      detach?.();
      setDraw(null);
    };
  }, [mapRef, bind, reportGeometry, reportSelected, reportDeselected]);

  // `draw` is a dependency so the mode is applied when the instance appears, not
  // only when the mode changes: without it, a toggle pressed during style load is
  // swallowed and never reaches Terra Draw.
  useEffect(() => {
    if (!draw?.enabled) return;

    draw.setMode(mode);
  }, [draw, mode]);
}

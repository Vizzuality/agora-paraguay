import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useEffectEvent } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import type { Bounds } from '@/lib/map/area-bounds';
import { paperLayoutAtom, reportMapAtom } from '@/store/report';

/** Long enough for the área's slide (`SettingsSection`, 200ms) to end. */
const LAYOUT_SETTLE_MS = 250;

/** The snapshot's pixel density: print resolution, whatever the screen's. */
const REPORT_PIXEL_RATIO = 2;

/** Room round the frame for what prints over the map: scale top left, legend and credits below. */
const REPORT_PADDING = { top: 48, right: 40, bottom: 96, left: 40 };

/**
 * The map for the report: a WebGL canvas prints blank, so while the page is laid out for
 * paper (`printReport`) the map is rendered to an image `ReportMapImage` prints in its place.
 * The paper layout widens the map (and opens its section, a slide), so the snapshot waits
 * for the layout to settle, resizes the map to it, fits `frame` (`null` keeps the camera)
 * and is taken at the next `idle` — only once the tiles the framed view needs are in, or its
 * edges would print empty. Rendered at twice the pixel density, so it stays sharp on
 * paper. Taken from inside a render, the only moment the canvas can be read without
 * preserving its buffer. The screen's camera and density come back when the dialog closes.
 * Mount under the `<Map>` whose image the report prints, one per page.
 */
export function ReportSnapshot({ frame }: Readonly<{ frame: Bounds | null }>) {
  const { current: map } = useMap();
  const paperLayout = useAtomValue(paperLayoutAtom);
  const setSnapshot = useSetAtom(reportMapAtom);
  // Read when the snapshot starts, not a reason to take another.
  const framing = useEffectEvent(() => frame);

  useEffect(() => {
    if (!paperLayout || !map) return;

    const instance = map.getMap();
    const screen = {
      center: instance.getCenter(),
      zoom: instance.getZoom(),
      pixelRatio: instance.getPixelRatio(),
    };
    let cancelled = false;

    const take = () => {
      instance.once('render', () => {
        if (!cancelled) setSnapshot(instance.getCanvas().toDataURL('image/png'));
      });
      instance.triggerRepaint();
    };

    const settled = setTimeout(() => {
      instance.setPixelRatio(Math.max(REPORT_PIXEL_RATIO, screen.pixelRatio));
      // Size the canvas to the paper layout now, not on the resize observer's next frame.
      instance.resize();
      const bounds = framing();
      if (bounds) instance.fitBounds(bounds, { padding: REPORT_PADDING, duration: 0 });
      instance.once('idle', take);
      // A repaint guarantees an `idle` even when the paper layout changed nothing.
      instance.triggerRepaint();
    }, LAYOUT_SETTLE_MS);

    return () => {
      cancelled = true;
      clearTimeout(settled);
      instance.off('idle', take);
      instance.setPixelRatio(screen.pixelRatio);
      instance.jumpTo({ center: screen.center, zoom: screen.zoom });
    };
  }, [paperLayout, map, setSnapshot]);

  return null;
}

/** Print only: the report's snapshot over the blank canvas, under the legend and credits. */
export function ReportMapImage() {
  const snapshot = useAtomValue(reportMapAtom);
  if (snapshot === null) return null;

  return (
    <img
      src={snapshot}
      alt=""
      aria-hidden
      className="pointer-events-none absolute inset-0 z-1 hidden size-full object-cover print:block"
    />
  );
}

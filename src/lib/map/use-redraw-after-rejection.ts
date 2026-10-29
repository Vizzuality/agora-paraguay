import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import { redrawAfterRejectionAtom } from '@/store/draw';
import { areaRejectionAtom } from '@/store/selection';

/**
 * After a rejected drawing, a press on the map clears the error and starts drawing again
 * from that point (`redrawAfterRejectionAtom`). Pointerdown, not MapLibre's `click`: by
 * the time `click` fires, Terra Draw has already handled the press in static mode. The
 * listener is only attached while a drawing's rejection is showing.
 *
 * Runs inside `<Map>` (needs react-map-gl's context).
 */
export function useRedrawAfterRejection() {
  const { current: mapRef } = useMap();
  const rejectedDrawing = useAtomValue(areaRejectionAtom)?.source === 'draw';
  const redraw = useSetAtom(redrawAfterRejectionAtom);

  useEffect(() => {
    const canvas = mapRef?.getMap().getCanvas();

    if (!canvas || !rejectedDrawing) return;

    const onPointerDown = (event: PointerEvent) => {
      if (event.isPrimary && event.button === 0) redraw();
    };

    canvas.addEventListener('pointerdown', onPointerDown);

    return () => canvas.removeEventListener('pointerdown', onPointerDown);
  }, [mapRef, rejectedDrawing, redraw]);
}

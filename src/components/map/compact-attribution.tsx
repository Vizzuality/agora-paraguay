import { AttributionControl, type Map } from 'maplibre-gl';
import { useControl } from 'react-map-gl/maplibre';

import { collapseAttribution } from '@/lib/map/attribution';

/** MapLibre's compact credits, closed to the ⓘ from the moment they are added. */
class ClosedAttributionControl extends AttributionControl {
  override onAdd(map: Map): HTMLElement {
    const container = super.onAdd(map);
    collapseAttribution(map, container);
    return container;
  }
}

/** Every map's credits: the ⓘ top left, the scale beside it (`globals.css`). */
export function CompactAttribution() {
  useControl(() => new ClosedAttributionControl({ compact: true }), { position: 'top-left' });
  return null;
}

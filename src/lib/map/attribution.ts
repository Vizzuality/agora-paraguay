import type { Map } from 'maplibre-gl';

type AttributionMap = Pick<Map, 'on' | 'off'>;
type AttributionElement = Pick<Element, 'classList'>;

/**
 * MapLibre's compact attribution opens itself the first time a source brings credits,
 * often before `load`, and only closes on a drag; on the non-interactive mini map it
 * would stay open forever. Keep it at the ⓘ until it has compacted, then leave it
 * alone: from there only its own click toggle opens it. Call it as the control is
 * added, so it runs after the control's own data listeners.
 */
export function collapseAttribution(map: AttributionMap, control: AttributionElement) {
  const collapse = () => {
    if (!control.classList.contains('maplibregl-compact')) return;
    control.classList.remove('maplibregl-compact-show');
    map.off('styledata', collapse);
    map.off('sourcedata', collapse);
  };

  map.on('styledata', collapse);
  map.on('sourcedata', collapse);
  collapse();
}

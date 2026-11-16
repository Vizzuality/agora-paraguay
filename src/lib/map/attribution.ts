import type { Map } from 'maplibre-gl';

type AttributionMap = Pick<Map, 'getContainer' | 'on' | 'off'>;

/**
 * MapLibre's compact attribution opens itself the first time a source brings credits,
 * which can land after `load`, and only closes on a drag; on the non-interactive mini
 * map it would stay open forever. Keep it at the ⓘ until it has compacted, then leave
 * it alone: from there only its own click toggle opens it.
 */
export function collapseAttribution(map: AttributionMap) {
  const control = map.getContainer().querySelector('.maplibregl-ctrl-attrib');
  if (!control) return;

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

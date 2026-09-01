import type { Map } from 'maplibre-gl';

/**
 * MapLibre's compact attribution starts expanded and only collapses on map
 * interaction — on the non-interactive mini map it would stay open forever. Collapse
 * it to the ⓘ button up front; its own click toggle keeps the credits one tap away.
 */
export function collapseAttribution(map: Map) {
  map
    .getContainer()
    .querySelector('.maplibregl-ctrl-attrib')
    ?.classList.remove('maplibregl-compact-show');
}

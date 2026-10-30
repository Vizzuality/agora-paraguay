import type { ReactNode } from 'react';
import Map, { AttributionControl } from 'react-map-gl/maplibre';

import { ZoomControl } from '@/components/map/zoom-control';
import { collapseAttribution } from '@/lib/map/attribution';
import { BASEMAP_STYLE, dimBasemap } from '@/lib/map/basemap';
import { addDotPattern } from '@/lib/map/dot-pattern';
import { PARAGUAY_VIEW_STATE } from '@/lib/map/view-state';
// Worker setup (see worker.ts) — without it the style never loads and the map is blank.
import '@/components/map/worker';

import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * The satellite map inside a page's card, the same on every analysis page: the whole
 * country on a dimmed basemap, credits collapsed top right, the panel zoom bottom right,
 * no rotation or pitch. What it shows is its children: a page injects its layers, and
 * they bring their own camera moves and pointer events through `useMap`.
 */
export function PanelMap({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Map
      initialViewState={PARAGUAY_VIEW_STATE}
      mapStyle={BASEMAP_STYLE}
      attributionControl={false}
      onLoad={(event) => {
        collapseAttribution(event.target);
        dimBasemap(event.target);
        addDotPattern(event.target);
      }}
      dragRotate={false}
      touchPitch={false}
      style={{ width: '100%', height: '100%' }}
    >
      <AttributionControl compact position="top-right" />
      <ZoomControl variant="panel" />
      {children}
    </Map>
  );
}

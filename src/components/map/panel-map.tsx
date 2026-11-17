import type { ReactNode } from 'react';
import Map, { ScaleControl } from 'react-map-gl/maplibre';

import { CompactAttribution } from '@/components/map/compact-attribution';
import { CountryMask } from '@/components/map/country-mask';
import { ZoomControl } from '@/components/map/zoom-control';
import { BASEMAP_STYLE, dimBasemap } from '@/lib/map/basemap';
import { addCropPatterns } from '@/lib/map/crop-patterns';
import { PARAGUAY_VIEW_STATE } from '@/lib/map/view-state';
// Worker setup (see worker.ts) — without it the style never loads and the map is blank.
import '@/components/map/worker';

import 'maplibre-gl/dist/maplibre-gl.css';

export function PanelMap({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Map
      initialViewState={PARAGUAY_VIEW_STATE}
      mapStyle={BASEMAP_STYLE}
      attributionControl={false}
      onLoad={(event) => {
        dimBasemap(event.target);
        addCropPatterns(event.target);
      }}
      dragRotate={false}
      touchPitch={false}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Same corners as the main map; the scale sits beside the credits ⓘ. */}
      <CompactAttribution />
      <ScaleControl position="top-left" />
      <ZoomControl variant="panel" />
      {/* First of the layers: the panel's own paint over it. */}
      <CountryMask />
      {children}
    </Map>
  );
}

import type { ReactNode, Ref } from 'react';
import Map, { AttributionControl, type MapProps, type MapRef } from 'react-map-gl/maplibre';

import { ZoomControl } from '@/components/map/zoom-control';
import { collapseAttribution } from '@/lib/map/attribution';
import { BASEMAP_STYLE, dimBasemap } from '@/lib/map/basemap';
// Worker setup (see worker.ts) — without it the style never loads and the map is blank.
import '@/components/map/worker';

import 'maplibre-gl/dist/maplibre-gl.css';

type PanelMapProps = Omit<
  MapProps,
  'mapStyle' | 'attributionControl' | 'dragRotate' | 'touchPitch' | 'style'
> & { ref?: Ref<MapRef>; children?: ReactNode };

/**
 * The satellite map inside a page's card, shared by Exposición climática and the analysis
 * hero: dimmed basemap so the data reads first, credits collapsed top right, the panel
 * zoom bottom right, no rotation or pitch. Each map brings only its camera, its layers
 * and its behaviour, as props and children.
 */
export function PanelMap({ ref, onLoad, children, ...props }: Readonly<PanelMapProps>) {
  return (
    <Map
      ref={ref}
      {...props}
      mapStyle={BASEMAP_STYLE}
      attributionControl={false}
      onLoad={(event) => {
        collapseAttribution(event.target);
        dimBasemap(event.target);
        onLoad?.(event);
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

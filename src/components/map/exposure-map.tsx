import { useAtom } from 'jotai';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { useRef, useState } from 'react';
import Map, {
  AttributionControl,
  type MapLayerMouseEvent,
  type MapRef,
} from 'react-map-gl/maplibre';

import { GlobalLayer, globalLayerFillId, globalLayerSourceId } from '@/components/map/global-layer';
import { MapLoading } from '@/components/map/map-loading';
import { ZoomControl } from '@/components/map/zoom-control';
import { collapseAttribution } from '@/lib/map/attribution';
import { BASEMAP_STYLE, dimBasemap } from '@/lib/map/basemap';
import {
  districtFromProperties,
  EXPOSURE_FILL,
  exposureLabel,
  type ExposureDistrict,
} from '@/lib/map/exposure-districts';
import { useFlyToDistrict } from '@/lib/map/use-fly-to-district';
import { PARAGUAY_VIEW_STATE } from '@/lib/map/view-state';
import { selectedDistrictAtom } from '@/store/exposure';
// Worker setup (see worker.ts) — without it the style never loads and the map is blank.
import '@/components/map/worker';

import 'maplibre-gl/dist/maplibre-gl.css';

/** What the map widget's tabs show: the exposure base, or the reference layers. */
export type ExposureMapView = 'exposicion' | 'capas';

/** The exposure layer Nivel de exposición paints, each district in its class colour. */
const EXPOSURE_LAYER = { id: 9, color: EXPOSURE_FILL };

/** The Capas tab's global layers; 8 is where soy is grown. */
// Mount order is paint order: the country-wide drought hazard first, soy on top.
// Colours are the legend tokens' values (chart-3, chart-1, chart-5).
const REFERENCE_LAYERS = [
  { id: 6, color: '#FF871F', label: 'Expuesto a sequía', swatch: 'border-chart-3 bg-chart-3/50' },
  {
    id: 7,
    color: '#4C95FF',
    label: 'Expuesto a inundación',
    swatch: 'border-chart-1 bg-chart-1/50',
  },
  { id: 8, color: '#1AF807', label: 'Soja', swatch: 'border-chart-5 bg-chart-5/50' },
];

const EXPOSURE_CLASSES = [
  { label: 'Baja exposición', swatch: 'border-risk-low bg-risk-low/50' },
  { label: 'Media exposición', swatch: 'border-risk-medium bg-risk-medium/50' },
  { label: 'Alta exposición', swatch: 'border-risk-high bg-risk-high/50' },
];

/**
 * Satellite map of the whole country for Exposición climática, dimmed so the data reads
 * first. Nivel de exposición paints the exposure layer with its legend; Capas paints the
 * reference layers, soy among them. One map for both views, so switching keeps the camera.
 * A district on the exposure layer names itself on hover and is picked on click: the
 * panel shows it and Capas paints only its features. Clicking it again clears the pick.
 */
export function ExposureMap({ view }: Readonly<{ view: ExposureMapView }>) {
  const [selected, setSelected] = useAtom(selectedDistrictAtom);
  const [hovered, setHovered] = useState<Hovered | null>(null);
  const mapRef = useRef<MapRef>(null);

  useFlyToDistrict(mapRef, globalLayerSourceId(EXPOSURE_LAYER.id), selected?.id ?? null);
  const exposure = view === 'exposicion';

  // The layers are tens of MB: parsing them takes seconds, so the wait shows.
  const sourceIds = (exposure ? [EXPOSURE_LAYER] : REFERENCE_LAYERS).map(({ id }) =>
    globalLayerSourceId(id),
  );
  // Which view's sources last finished: a tab switch is loading until its own do.
  const [loadedView, setLoadedView] = useState<ExposureMapView | null>(null);
  const loading = loadedView !== view;
  const checkLoaded = (map: MapLibreMap) => {
    const ready = sourceIds.every((id) => map.getSource(id) && map.isSourceLoaded(id));
    setLoadedView(ready ? view : null);
  };

  const districtAt = (event: MapLayerMouseEvent) =>
    districtFromProperties(event.features?.[0]?.properties);

  return (
    <Map
      ref={mapRef}
      interactiveLayerIds={exposure ? [globalLayerFillId(EXPOSURE_LAYER.id)] : []}
      cursor={hovered ? 'pointer' : 'grab'}
      onMouseMove={(event) => {
        const district = districtAt(event);
        setHovered(district ? { district, x: event.point.x, y: event.point.y } : null);
      }}
      onMouseLeave={() => setHovered(null)}
      onClick={(event) => {
        const district = districtAt(event);
        if (district) setSelected(district.id === selected?.id ? null : district);
      }}
      initialViewState={PARAGUAY_VIEW_STATE}
      mapStyle={BASEMAP_STYLE}
      attributionControl={false}
      onLoad={(event) => {
        collapseAttribution(event.target);
        dimBasemap(event.target);
      }}
      onSourceData={(event) => checkLoaded(event.target)}
      onIdle={(event) => checkLoaded(event.target)}
      dragRotate={false}
      touchPitch={false}
      style={{ width: '100%', height: '100%' }}
    >
      <AttributionControl compact position="top-right" />
      <MapLegend items={exposure ? EXPOSURE_CLASSES : REFERENCE_LAYERS} />
      {exposure && hovered && <DistrictTooltip {...hovered} />}
      <ZoomControl variant="panel" />
      {loading && <MapLoading>{exposure ? 'Cargando exposición…' : 'Cargando capas…'}</MapLoading>}
      {exposure ? (
        <GlobalLayer {...EXPOSURE_LAYER} highlightedId={selected?.id} />
      ) : (
        REFERENCE_LAYERS.map(({ id, color }) => (
          <GlobalLayer key={id} id={id} color={color} districtId={selected?.id} />
        ))
      )}
    </Map>
  );
}

type Hovered = { district: ExposureDistrict; x: number; y: number };

/** The hovered district's name over the pointer, in the legend's dark glass. */
function DistrictTooltip({ district, x, y }: Readonly<Hovered>) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-md bg-black/70 px-2 py-1 text-xs whitespace-nowrap text-white backdrop-blur-xs"
      style={{ left: x, top: y }}
    >
      <p className="font-medium">{district.name}</p>
      {district.department && <p className="text-white/70">{district.department}</p>}
      {district.exposure && <p>{exposureLabel(district.exposure)}</p>}
    </div>
  );
}

/** The open view's key, bottom left in dark glass: exposure classes, or the layers. */
function MapLegend({ items }: Readonly<{ items: { label: string; swatch: string }[] }>) {
  return (
    <ul className="absolute bottom-0 left-0 flex flex-col gap-1 bg-black/50 p-2 text-xs text-white backdrop-blur-xs">
      {items.map(({ label, swatch }) => (
        <li key={label} className="flex items-center gap-1">
          <span aria-hidden className={`size-4 rounded-full border-2 ${swatch}`} />
          {label}
        </li>
      ))}
    </ul>
  );
}

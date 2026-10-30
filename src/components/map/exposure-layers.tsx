import { useAtom } from 'jotai';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import { useEffect, useEffectEvent, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import { GlobalLayer } from '@/components/map/global-layer';
import { MapLoading } from '@/components/map/map-loading';
import {
  districtFromProperties,
  EXPOSURE_FILL,
  exposureLabel,
  type ExposureDistrict,
} from '@/lib/map/exposure-districts';
import { globalLayerFillId, globalLayerSourceId } from '@/lib/map/global-layer-styles';
import { useFlyToDistrict } from '@/lib/map/use-fly-to-district';
import { useLayerPointer } from '@/lib/map/use-layer-pointer';
import { selectedDistrictAtom } from '@/store/exposure';

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
 * Exposición climática's layers for the panel map. Nivel de exposición paints the
 * exposure layer with its legend; Capas paints the reference layers, soy among them.
 * A district on the exposure layer names itself on hover and is picked on click: the
 * panel shows it, the camera flies to it, and Capas paints only its features. Clicking
 * it again clears the pick.
 */
export function ExposureLayers({ view }: Readonly<{ view: ExposureMapView }>) {
  const [selected, setSelected] = useAtom(selectedDistrictAtom);
  const [hovered, setHovered] = useState<Hovered | null>(null);
  const exposure = view === 'exposicion';

  useFlyToDistrict(globalLayerSourceId(EXPOSURE_LAYER.id), selected?.id ?? null);

  const districtAt = (event: MapLayerMouseEvent) =>
    districtFromProperties(event.features?.[0]?.properties);

  useLayerPointer(exposure ? globalLayerFillId(EXPOSURE_LAYER.id) : null, {
    onMove: (event) => {
      const district = districtAt(event);
      setHovered(district ? { district, x: event.point.x, y: event.point.y } : null);
    },
    onLeave: () => setHovered(null),
    onClick: (event) => {
      const district = districtAt(event);
      if (district) setSelected(district.id === selected?.id ? null : district);
    },
  });

  const loading = useViewLoading(
    view,
    (exposure ? [EXPOSURE_LAYER] : REFERENCE_LAYERS).map(({ id }) => globalLayerSourceId(id)),
  );

  return (
    <>
      <MapLegend items={exposure ? EXPOSURE_CLASSES : REFERENCE_LAYERS} />
      {exposure && hovered && <DistrictTooltip {...hovered} />}
      {loading && <MapLoading>{exposure ? 'Cargando exposición…' : 'Cargando capas…'}</MapLoading>}
      {exposure ? (
        <GlobalLayer {...EXPOSURE_LAYER} highlightedId={selected?.id} />
      ) : (
        REFERENCE_LAYERS.map(({ id, color }) => (
          <GlobalLayer key={id} id={id} color={color} districtId={selected?.id} />
        ))
      )}
    </>
  );
}

/**
 * Whether the open view's sources are still loading. The layers are tens of MB, so
 * parsing them takes seconds and the wait shows; a tab switch is loading until its own
 * sources finish.
 */
function useViewLoading(view: ExposureMapView, sourceIds: string[]): boolean {
  const { current: mapRef } = useMap();
  // Which view's sources last finished.
  const [loadedView, setLoadedView] = useState<ExposureMapView | null>(null);

  const check = useEffectEvent(() => {
    const map = mapRef?.getMap();
    if (!map) return;
    const ready = sourceIds.every((id) => map.getSource(id) && map.isSourceLoaded(id));
    setLoadedView(ready ? view : null);
  });

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    map.on('sourcedata', check);
    map.on('idle', check);

    return () => {
      map.off('sourcedata', check);
      map.off('idle', check);
    };
  }, [mapRef]);

  return loadedView !== view;
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

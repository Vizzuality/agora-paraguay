import { useAtomValue, useSetAtom } from 'jotai';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import { useEffect, useEffectEvent, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import { GlobalLayer } from '@/components/map/global-layer';
import { MapLegend } from '@/components/map/map-legend';
import { MapLoading } from '@/components/map/map-loading';
import { useIndicators } from '@/lib/analysis/use-indicators';
import type { RiskTone } from '@/lib/analysis/widget-config';
import {
  districtFromProperties,
  EXPOSURE_FILL_OPACITY,
  EXPOSURE_LINE_WIDTH,
  exposureClasses,
  exposureLabel,
  exposureLegendLabel,
  exposureColor,
  type ExposureDistrict,
} from '@/lib/map/exposure-districts';
import { globalLayerFillId, globalLayerSourceId } from '@/lib/map/global-layer-styles';
import { LEGEND_KEY_ONLY } from '@/lib/map/legend-config';
import { ordered, scaledOpacity, stackBeforeIds, toggled } from '@/lib/map/legend-order';
import { DISTRICT_PICK, DISTRICTS_FILL, REFERENCE_LAYERS } from '@/lib/map/reference-layer-styles';
import { districtBounds, useFlyToDistrict } from '@/lib/map/use-fly-to-district';
import { useLayerPointer } from '@/lib/map/use-layer-pointer';
import { cn } from '@/lib/utils';
import { pickDistrictAtom, selectedDistrictAtom } from '@/store/exposure';

/** What the map widget's tabs show: the exposure base, or the reference layers. */
export type ExposureMapView = 'exposicion' | 'capas';

/**
 * The districts layer: Nivel de exposición fills and traces each district in its class
 * colour; Capas keeps faint edges and traces the pick over them.
 */
const EXPOSURE_LAYER = { id: 4, legendConfig: LEGEND_KEY_ONLY };

/** On Nivel de exposición, the share of their opacity the districts around a pick keep. */
const UNPICKED_OPACITY = 0.3;

const EXPOSURE_FILL_ID = globalLayerFillId(EXPOSURE_LAYER.id);

/**
 * A class's legend swatch, in the token its ruler band paints (`TONE_COLOR`): the fill at
 * half, the 2px border solid, as the map draws a district's fill and outline.
 */
const TONE_SWATCH: Record<RiskTone, string> = {
  none: 'border-2 border-risk-none bg-risk-none/50',
  low: 'border-2 border-risk-low bg-risk-low/50',
  medium: 'border-2 border-risk-neutral bg-risk-neutral/50',
  elevated: 'border-2 border-risk-medium bg-risk-medium/50',
  high: 'border-2 border-risk-high bg-risk-high/50',
};

/**
 * Exposición climática's layers for the panel map. Nivel de exposición colours each
 * district by its exposure class, with the legend; Capas traces the districts faintly
 * under the reference layers.
 * A district on the exposure layer names itself on hover and is picked on click: the
 * panel shows it, the districts around it fade, the camera flies to it, and Capas paints
 * only its features. Clicking
 * it again clears the pick. The pick holds across both tabs: Capas traces its outline
 * over the reference layers, and a click there picks the district under the pointer too.
 */
export function ExposureLayers({ view }: Readonly<{ view: ExposureMapView }>) {
  const selected = useAtomValue(selectedDistrictAtom);
  const pickDistrict = useSetAtom(pickDistrictAtom);
  const [hovered, setHovered] = useState<Hovered | null>(null);
  // A tab switch moves no pointer, so the last tab's hover would linger without this.
  const [hoveredView, setHoveredView] = useState(view);
  if (hoveredView !== view) {
    setHoveredView(view);
    setHovered(null);
  }
  const exposure = view === 'exposicion';
  // The reference layers mount on the first visit to Capas and then stay, hidden off it:
  // tens of MB, too much to load before anyone asks, too much to load twice.
  const [capasOpened, setCapasOpened] = useState(!exposure);
  if (!exposure && !capasOpened) setCapasOpened(true);
  // The legend's classes and colours, the same as the panel's exposure ruler.
  const classes = exposureClasses(useIndicators('exposicion_climatica').data);

  // The reference layers' legend controls (each layer's `legendConfig`): a hidden one goes,
  // a faded one scales its opacity, and they paint in the legend's order, top row on top.
  // Nivel de exposición's legend is a key only.
  const [hiddenLayers, setHiddenLayers] = useState<ReadonlySet<string>>(new Set());
  const [layerOpacity, setLayerOpacity] = useState<Readonly<Record<string, number>>>({});
  const [layerOrder, setLayerOrder] = useState(() =>
    REFERENCE_LAYERS.map(({ id }) => String(id)).toReversed(),
  );
  const layersTopFirst = ordered(REFERENCE_LAYERS, layerOrder, ({ id }) => String(id));
  const beforeIds = stackBeforeIds(
    layersTopFirst.map(({ id }) => globalLayerFillId(id)),
    EXPOSURE_FILL_ID,
  );

  const exposureSourceId = globalLayerSourceId(EXPOSURE_LAYER.id);
  useFlyToDistrict(exposureSourceId, selected);

  const districtAt = (event: MapLayerMouseEvent) =>
    districtFromProperties(event.features?.[0]?.properties);
  // Measured on the click, while this map's tiles are loaded: a pick moves the map to the
  // other column, and the map mounting there frames the district from this box.
  const pickAt = (event: MapLayerMouseEvent) => {
    const district = districtAt(event);
    return (
      district && {
        ...district,
        bounds: districtBounds(event.target, exposureSourceId, district.id),
      }
    );
  };

  const hover = (event: MapLayerMouseEvent) => {
    const district = districtAt(event);
    setHovered(district ? { district, x: event.point.x, y: event.point.y } : null);
  };

  useLayerPointer(exposure ? EXPOSURE_FILL_ID : null, {
    onMove: hover,
    onLeave: () => setHovered(null),
    onClick: (event) => {
      const district = pickAt(event);
      if (district) pickDistrict(district.id === selected?.id ? null : district);
    },
  });

  // On Capas the district under the pointer darkens, and a click picks it; no toggle, so
  // a click inside the pick keeps it.
  useLayerPointer(exposure ? null : EXPOSURE_FILL_ID, {
    onMove: hover,
    onLeave: () => setHovered(null),
    onClick: (event) => {
      const district = pickAt(event);
      if (district && district.id !== selected?.id) pickDistrict(district);
    },
  });

  const loading = useViewLoading(
    view,
    (exposure ? [EXPOSURE_LAYER] : [...REFERENCE_LAYERS, EXPOSURE_LAYER]).map(({ id }) =>
      globalLayerSourceId(id),
    ),
  );

  return (
    <>
      {exposure ? (
        <MapLegend
          label="Leyenda de exposición"
          className="bottom-2 left-2"
          legendConfig={EXPOSURE_LAYER.legendConfig}
          items={classes.map(({ label, tone }) => ({
            id: label,
            label: exposureLegendLabel(label),
            className: cn('border-2', TONE_SWATCH[tone]),
          }))}
          note="Porcentaje de soja expuesta a una o ambas amenazas; las áreas coincidentes se cuentan una sola vez."
        />
      ) : (
        <MapLegend
          label="Leyenda de capas"
          className="bottom-2 left-2"
          items={layersTopFirst.map(({ id, label, swatch, legendConfig }) => ({
            id: String(id),
            label,
            className: 'border-2',
            style: { backgroundColor: swatch.fill, borderColor: swatch.edge },
            legendConfig,
          }))}
          hidden={hiddenLayers}
          onToggle={(id) => setHiddenLayers((ids) => toggled(ids, id))}
          onReorder={setLayerOrder}
          opacity={layerOpacity}
          onOpacity={(id, value) => setLayerOpacity((values) => ({ ...values, [id]: value }))}
        />
      )}
      {exposure && hovered && <DistrictTooltip {...hovered} />}
      {loading && <MapLoading>{exposure ? 'Cargando exposición…' : 'Cargando capas…'}</MapLoading>}
      {/* Mounted on both tabs, so a switch restyles it instead of reloading it. */}
      <GlobalLayer
        id={EXPOSURE_LAYER.id}
        {...(exposure
          ? {
              color: exposureColor(classes),
              fill: {
                color: exposureColor(classes),
                opacity: EXPOSURE_FILL_OPACITY,
                outlineColor: 'rgba(0, 0, 0, 0)',
              },
              lineWidth: EXPOSURE_LINE_WIDTH,
              othersOpacity: UNPICKED_OPACITY,
            }
          : {
              color: DISTRICT_PICK.stroke,
              fill: DISTRICTS_FILL,
              outline: true,
              hoveredId: hovered?.district.id,
              hoverFill: DISTRICT_PICK.hoverFill,
            })}
        highlightedId={selected?.id}
      />
      {capasOpened &&
        layersTopFirst.map(({ id, fill }) => (
          // Under the exposure layer, so the pick's outline stays on top, each right
          // under the row above it (`stackBeforeIds`). Mounted top first, so every
          // `beforeId` names a layer already there: a missing one would drop the layer.
          <GlobalLayer
            key={id}
            id={id}
            color={fill.color}
            fill={{ ...fill, opacity: scaledOpacity(fill.opacity, layerOpacity[String(id)]) }}
            districtId={selected?.id}
            hidden={exposure || hiddenLayers.has(String(id))}
            beforeId={beforeIds[globalLayerFillId(id)]}
          />
        ))}
    </>
  );
}

/**
 * Whether the open view's sources are still loading. The layers are tens of MB, so
 * parsing them takes seconds and the wait shows. Only a tab's first opening waits: its
 * sources stay mounted after, so once they have loaded the notice stays away for it.
 */
function useViewLoading(view: ExposureMapView, sourceIds: string[]): boolean {
  const { current: mapRef } = useMap();
  // The views whose sources have finished once. Latched: later tile loads (a pan, a
  // layer the legend shows again) fetch tiles too, and must not bring the notice back.
  const [loadedViews, setLoadedViews] = useState<ReadonlySet<ExposureMapView>>(new Set());

  const check = useEffectEvent(() => {
    const map = mapRef?.getMap();
    if (!map || loadedViews.has(view)) return;
    const ready = sourceIds.every((id) => map.getSource(id) && map.isSourceLoaded(id));
    if (ready) setLoadedViews((views) => new Set(views).add(view));
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

  return !loadedViews.has(view);
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

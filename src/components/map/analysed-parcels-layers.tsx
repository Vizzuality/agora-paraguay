import { useQuery } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useEffectEvent, useState } from 'react';
import { Layer, Source, useMap } from 'react-map-gl/maplibre';

import { FilteredParcelsLayer } from '@/components/map/filtered-parcels-layer';
import { ParcelLegend } from '@/components/map/parcel-legend';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { featuresBounds, FIT_PADDING } from '@/lib/map/area-bounds';
import { useAnalysedParcelClick } from '@/lib/map/use-analysed-parcel-click';
import { useFitActiveParcel } from '@/lib/map/use-fit-active-parcel';
import { activeParcelIdAtom, analysedParcelIdsAtom } from '@/store/analysis';
import { drawPolygonsAtom } from '@/store/draw';
import { paperLayoutAtom, reportMapAtom } from '@/store/report';

/** The drawing yellow of `draw-styles.ts`, for the areas while no parcels exist yet. */
const AREA_COLOR = '#F1FF28';

/**
 * The analysis hero's layers for the panel map, showing what Analizar submitted: the
 * analysed parcels only (the main map's layer, restricted — the neighbours the user left
 * out stay behind), with the open tab's parcel in yellow — every one under Todas — and
 * the rest outlined; clicking one opens its tab. The parcels stand in for the drawn
 * areas as on the main map; the areas themselves only paint while no parcels exist.
 * Framed by the analysed parcels' combined bounds on mount, re-framed on the open tab's
 * parcel(s) when it changes, the user's in between. The camera is not written to the
 * URL — that is the main map's, and this one is gone with the page.
 */
export function AnalysedParcelsLayers() {
  const areas = useAtomValue(drawPolygonsAtom);
  const analysedIds = useAtomValue(analysedParcelIdsAtom);
  const activeParcelId = useAtomValue(activeParcelIdAtom);
  const { data: parcels } = useQuery(parcelQueries.filtered(areas));
  const zoom = useZoom();

  const bounds = featuresBounds([
    ...areas,
    ...(parcels?.results
      .filter((parcel) => analysedIds.includes(parcel.parcel_id))
      .flatMap((parcel) => parcel.geometry.features) ?? []),
  ]);

  useFrameOnMount(bounds);

  return (
    <>
      <FilteredParcelsLayer
        parcelIds={analysedIds}
        highlightedIds={activeParcelId === null ? analysedIds : [activeParcelId]}
        variant="analysis"
        zoom={zoom}
      />
      <ParcelLegend className="bottom-1 left-2" />
      <AnalysedParcelsBehaviour />
      <ReportSnapshot />
      <ReportMapImage />
      {(parcels?.results.length ?? 0) === 0 && (
        <Source type="geojson" data={{ type: 'FeatureCollection', features: areas }}>
          <Layer type="fill" paint={{ 'fill-color': AREA_COLOR, 'fill-opacity': 0.5 }} />
          <Layer type="line" paint={{ 'line-color': AREA_COLOR, 'line-width': 2 }} />
        </Source>
      )}
    </>
  );
}

/** The camera's zoom, following each finished move: the parcel number chips size by it. */
function useZoom(): number | undefined {
  const { current: mapRef } = useMap();
  const [zoom, setZoom] = useState(() => mapRef?.getZoom());

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const update = () => setZoom(map.getZoom());
    map.on('moveend', update);
    return () => {
      map.off('moveend', update);
    };
  }, [mapRef]);

  return zoom;
}

/**
 * Jumps to what Analizar submitted when the layers mount, before the first tiles: the
 * panel map opens on the whole country, and this page's first view is the parcels.
 */
function useFrameOnMount(bounds: ReturnType<typeof featuresBounds>) {
  const { current: mapRef } = useMap();
  const frame = useEffectEvent(() => {
    if (bounds) mapRef?.fitBounds(bounds, { padding: FIT_PADDING, duration: 0 });
  });

  useEffect(() => frame(), [mapRef]);
}

/** Hook carrier: click and fit need react-map-gl's context, so they live under `<Map>`. */
function AnalysedParcelsBehaviour() {
  useAnalysedParcelClick();
  useFitActiveParcel();

  return null;
}

/**
 * The map for the report: a WebGL canvas prints blank, so while the page is laid out for
 * paper (`printReport`) the map is rendered to an image `ReportMapImage` prints in its place.
 * The paper layout widens the map (and opens its section, a slide), so the snapshot waits
 * for the layout to settle, resizes the map to it, and is taken at the next `idle` — only
 * once the tiles the wider map needs are in, or its new edges would print empty. Taken
 * from inside a render, the only moment the canvas can be read without preserving its buffer.
 */
/** Long enough for the área's slide (`SettingsSection`, 200ms) to end. */
const LAYOUT_SETTLE_MS = 250;

function ReportSnapshot() {
  const { current: map } = useMap();
  const paperLayout = useAtomValue(paperLayoutAtom);
  const setSnapshot = useSetAtom(reportMapAtom);

  useEffect(() => {
    if (!paperLayout || !map) return;

    const instance = map.getMap();
    let cancelled = false;

    const take = () => {
      instance.once('render', () => {
        if (!cancelled) setSnapshot(instance.getCanvas().toDataURL('image/png'));
      });
      instance.triggerRepaint();
    };

    const settled = setTimeout(() => {
      // Size the canvas to the paper layout now, not on the resize observer's next frame.
      instance.resize();
      instance.once('idle', take);
      // A repaint guarantees an `idle` even when the paper layout changed nothing.
      instance.triggerRepaint();
    }, LAYOUT_SETTLE_MS);

    return () => {
      cancelled = true;
      clearTimeout(settled);
      instance.off('idle', take);
    };
  }, [paperLayout, map, setSnapshot]);

  return null;
}

/** Print only: the report's snapshot over the blank canvas, under the legend and credits. */
function ReportMapImage() {
  const snapshot = useAtomValue(reportMapAtom);
  if (snapshot === null) return null;

  return (
    <img
      src={snapshot}
      alt=""
      aria-hidden
      className="pointer-events-none absolute inset-0 z-1 hidden size-full object-cover print:block"
    />
  );
}

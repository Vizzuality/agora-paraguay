import { useQuery } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useEffectEvent, useState } from 'react';
import { Layer, Source, useMap } from 'react-map-gl/maplibre';

import { FilteredParcelsLayer } from '@/components/map/filtered-parcels-layer';
import { MapLoading } from '@/components/map/map-loading';
import { ParcelLegend } from '@/components/map/parcel-legend';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { featuresBounds, FIT_PADDING } from '@/lib/map/area-bounds';
import { useAnalysedParcelClick } from '@/lib/map/use-analysed-parcel-click';
import { useFitActiveParcel } from '@/lib/map/use-fit-active-parcel';
import { usePainted } from '@/lib/map/use-painted';
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
 * areas as on the main map; the areas themselves only paint once the answer has no parcels:
 * until the answer is on screen, a loader covers the map instead of the drawn areas.
 * Framed by the analysed parcels' combined bounds on mount, re-framed on the open tab's
 * parcel(s) when it changes, the user's in between. The camera is not written to the
 * URL — that is the main map's, and this one is gone with the page.
 */
export function AnalysedParcelsLayers() {
  const areas = useAtomValue(drawPolygonsAtom);
  const analysedIds = useAtomValue(analysedParcelIdsAtom);
  const activeParcelId = useAtomValue(activeParcelIdAtom);
  const { data: parcels, isLoading, isPlaceholderData } = useQuery(parcelQueries.filtered(areas));
  // Up until the parcels show, not just until they arrive: the source still has to draw.
  const painted = usePainted(parcels);
  const loading = isLoading || isPlaceholderData || !painted;
  const zoom = useZoom();

  const bounds = featuresBounds([
    ...areas,
    ...(parcels?.results
      .filter((parcel) => analysedIds.includes(parcel.parcel_id))
      .flatMap((parcel) => parcel.geometry.features) ?? []),
  ]);

  useFrameOnMount(bounds);

  // The report frames what it is about: the open tab's parcel, or every one under Todas.
  const reported = activeParcelId === null ? analysedIds : [activeParcelId];
  const reportBounds =
    featuresBounds(
      parcels?.results
        .filter((parcel) => reported.includes(parcel.parcel_id))
        .flatMap((parcel) => parcel.geometry.features) ?? [],
    ) ?? bounds;

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
      <ReportSnapshot frame={reportBounds} />
      <ReportMapImage />
      {loading && <MapLoading>Cargando parcelas…</MapLoading>}
      {!loading && (parcels?.results.length ?? 0) === 0 && (
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
 * for the layout to settle, resizes the map to it, frames the reported parcels and is
 * taken at the next `idle` — only once the tiles the framed view needs are in, or its
 * edges would print empty. Rendered at twice the pixel density, so it stays sharp on
 * paper. Taken from inside a render, the only moment the canvas can be read without
 * preserving its buffer. The screen's camera and density come back when the dialog closes.
 */
/** Long enough for the área's slide (`SettingsSection`, 200ms) to end. */
const LAYOUT_SETTLE_MS = 250;

/** The snapshot's pixel density: print resolution, whatever the screen's. */
const REPORT_PIXEL_RATIO = 2;

/** Room round the parcels for what prints over the map: scale top left, legend and credits below. */
const REPORT_PADDING = { top: 48, right: 40, bottom: 96, left: 40 };

function ReportSnapshot({ frame }: Readonly<{ frame: ReturnType<typeof featuresBounds> }>) {
  const { current: map } = useMap();
  const paperLayout = useAtomValue(paperLayoutAtom);
  const setSnapshot = useSetAtom(reportMapAtom);
  // Read when the snapshot starts, not a reason to take another.
  const framing = useEffectEvent(() => frame);

  useEffect(() => {
    if (!paperLayout || !map) return;

    const instance = map.getMap();
    const screen = {
      center: instance.getCenter(),
      zoom: instance.getZoom(),
      pixelRatio: instance.getPixelRatio(),
    };
    let cancelled = false;

    const take = () => {
      instance.once('render', () => {
        if (!cancelled) setSnapshot(instance.getCanvas().toDataURL('image/png'));
      });
      instance.triggerRepaint();
    };

    const settled = setTimeout(() => {
      instance.setPixelRatio(Math.max(REPORT_PIXEL_RATIO, screen.pixelRatio));
      // Size the canvas to the paper layout now, not on the resize observer's next frame.
      instance.resize();
      const bounds = framing();
      if (bounds) instance.fitBounds(bounds, { padding: REPORT_PADDING, duration: 0 });
      instance.once('idle', take);
      // A repaint guarantees an `idle` even when the paper layout changed nothing.
      instance.triggerRepaint();
    }, LAYOUT_SETTLE_MS);

    return () => {
      cancelled = true;
      clearTimeout(settled);
      instance.off('idle', take);
      instance.setPixelRatio(screen.pixelRatio);
      instance.jumpTo({ center: screen.center, zoom: screen.zoom });
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

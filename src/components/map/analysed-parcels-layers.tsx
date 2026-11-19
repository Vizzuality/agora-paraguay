import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { useEffect, useEffectEvent, useState } from 'react';
import { Layer, Source, useMap } from 'react-map-gl/maplibre';

import { FilteredParcelsLayer } from '@/components/map/filtered-parcels-layer';
import { MapLoading } from '@/components/map/map-loading';
import { ParcelLegend } from '@/components/map/parcel-legend';
import { ReportMapImage, ReportSnapshot } from '@/components/map/report-snapshot';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { featuresBounds, FIT_PADDING } from '@/lib/map/area-bounds';
import { useAnalysedParcelClick } from '@/lib/map/use-analysed-parcel-click';
import { useFitActiveParcel } from '@/lib/map/use-fit-active-parcel';
import { usePainted } from '@/lib/map/use-painted';
import { activeParcelIdAtom, analysedParcelIdsAtom } from '@/store/analysis';
import { drawPolygonsAtom } from '@/store/draw';

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

import { useQuery } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { Layer, Source, useMap } from 'react-map-gl/maplibre';

import { FilteredParcelsLayer } from '@/components/map/filtered-parcels-layer';
import { PanelMap } from '@/components/map/panel-map';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { featuresBounds, FIT_PADDING } from '@/lib/map/area-bounds';
import { addDotPattern } from '@/lib/map/dot-pattern';
import { useAnalysedParcelClick } from '@/lib/map/use-analysed-parcel-click';
import { useFitActiveParcel } from '@/lib/map/use-fit-active-parcel';
import { INITIAL_VIEW_STATE } from '@/lib/map/view-state';
import { activeParcelIdAtom, analysedParcelIdsAtom } from '@/store/analysis';
import { drawPolygonsAtom } from '@/store/draw';
import { paperLayoutAtom, reportMapAtom } from '@/store/report';

/** The drawing yellow of `draw-styles.ts`, for the areas while no parcels exist yet. */
const AREA_COLOR = '#F1FF28';

/**
 * The panel map for the analysis hero, showing what Analizar submitted: the analysed
 * parcels only (the main map's layer, restricted — the neighbours the user left out stay
 * behind), with the open tab's parcel in yellow — every one under Todas — and the rest
 * outlined; clicking one opens its tab. The parcels stand in for the drawn areas as on
 * the main map; the areas themselves only paint while no parcels exist. Framed by the
 * analysed parcels' combined bounds on mount,
 * re-framed on the open tab's parcel(s) when it changes, the user's in between: pan,
 * scroll-zoom and the zoom buttons work as on the main map. The camera is not written to
 * the URL — that is the main map's, and this one is gone with the page.
 */
export function MiniMap() {
  const areas = useAtomValue(drawPolygonsAtom);
  const analysedIds = useAtomValue(analysedParcelIdsAtom);
  const activeParcelId = useAtomValue(activeParcelIdAtom);
  const { data: parcels } = useQuery(parcelQueries.filtered(areas));
  // The camera's zoom once known, for the parcel number chips: `initialViewState` fits
  // bounds, so the real zoom only exists after load, then follows each finished move.
  const [zoom, setZoom] = useState<number>();

  const bounds = featuresBounds([
    ...areas,
    ...(parcels?.results
      .filter((parcel) => analysedIds.includes(parcel.parcel_id))
      .flatMap((parcel) => parcel.geometry.features) ?? []),
  ]);

  return (
    <PanelMap
      initialViewState={
        bounds === null
          ? INITIAL_VIEW_STATE
          : { bounds, fitBoundsOptions: { padding: FIT_PADDING } }
      }
      onLoad={(event) => {
        addDotPattern(event.target);
        setZoom(event.target.getZoom());
      }}
      onMoveEnd={(event) => setZoom(event.viewState.zoom)}
    >
      <FilteredParcelsLayer
        parcelIds={analysedIds}
        highlightedIds={activeParcelId === null ? analysedIds : [activeParcelId]}
        variant="analysis"
        zoom={zoom}
      />
      <MiniMapBehaviour />
      <ReportSnapshot />
      {(parcels?.results.length ?? 0) === 0 && (
        <Source type="geojson" data={{ type: 'FeatureCollection', features: areas }}>
          <Layer type="fill" paint={{ 'fill-color': AREA_COLOR, 'fill-opacity': 0.5 }} />
          <Layer type="line" paint={{ 'line-color': AREA_COLOR, 'line-width': 2 }} />
        </Source>
      )}
    </PanelMap>
  );
}

/** Hook carrier: click and fit need react-map-gl's context, so they live under `<Map>`. */
function MiniMapBehaviour() {
  useAnalysedParcelClick();
  useFitActiveParcel();

  return null;
}

/**
 * The map for the report: a WebGL canvas prints blank, so while the page is laid out for
 * paper (`printReport`) the map is rendered to an image the hero prints in its place.
 * Taken once the map has settled at paper width with its tiles in (`idle`), from inside
 * a render — the only moment the canvas can be read without preserving its buffer.
 */
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

    instance.once('idle', take);
    // A repaint guarantees an `idle` even when the paper layout changed nothing.
    instance.triggerRepaint();

    return () => {
      cancelled = true;
      instance.off('idle', take);
    };
  }, [paperLayout, map, setSnapshot]);

  return null;
}

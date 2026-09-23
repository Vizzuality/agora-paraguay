import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import Map, { AttributionControl, Layer, Source } from 'react-map-gl/maplibre';

import { FilteredParcelsLayer } from '@/components/map/filtered-parcels-layer';
import { ZoomControl } from '@/components/map/zoom-control';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { featuresBounds, FIT_PADDING } from '@/lib/map/area-bounds';
import { collapseAttribution } from '@/lib/map/attribution';
import { BASEMAP_STYLE, INITIAL_VIEW_STATE } from '@/lib/map/basemap';
import { useAnalysedParcelClick } from '@/lib/map/use-analysed-parcel-click';
import { activeParcelIdAtom } from '@/store/analysis';
import { drawPolygonsAtom } from '@/store/draw';
// Worker setup (see worker.ts) — without it the style never loads and the map is blank.
import '@/components/map/worker';

import 'maplibre-gl/dist/maplibre-gl.css';

/** The drawing yellow of `draw-styles.ts`, for the areas while no parcels exist yet. */
const AREA_COLOR = '#F1FF28';

/**
 * Satellite map for the analysis hero, showing what the main map showed: the parcels
 * `filter-parcels` answered (the same layer), with the active tab's parcel in yellow and
 * the rest outlined; clicking an analysed parcel opens its tab. The parcels stand in for
 * the drawn areas as on the main map; the areas themselves only paint while no parcels
 * exist. Framed by the combined bounds on mount, then the user's: pan, zoom and the zoom
 * buttons work as on the main map. The camera is not written to the URL — that is the
 * main map's, and this one is gone with the page.
 */
export function MiniMap() {
  const areas = useAtomValue(drawPolygonsAtom);
  const activeParcelId = useAtomValue(activeParcelIdAtom);
  const { data: parcels } = useQuery(parcelQueries.filtered(areas));

  const bounds = featuresBounds([
    ...areas,
    ...(parcels?.results.flatMap((parcel) => parcel.geometry.features) ?? []),
  ]);

  return (
    <Map
      initialViewState={
        bounds === null
          ? INITIAL_VIEW_STATE
          : { bounds, fitBoundsOptions: { padding: FIT_PADDING } }
      }
      mapStyle={BASEMAP_STYLE}
      attributionControl={false}
      onLoad={(event) => collapseAttribution(event.target)}
      dragRotate={false}
      touchPitch={false}
      style={{ width: '100%', height: '100%' }}
    >
      <AttributionControl compact position="bottom-left" />
      <ZoomControl />
      <FilteredParcelsLayer highlightedIds={activeParcelId === undefined ? [] : [activeParcelId]} />
      <AnalysedParcelClick />
      {(parcels?.results.length ?? 0) === 0 && (
        <Source type="geojson" data={{ type: 'FeatureCollection', features: areas }}>
          <Layer type="fill" paint={{ 'fill-color': AREA_COLOR, 'fill-opacity': 0.5 }} />
          <Layer type="line" paint={{ 'line-color': AREA_COLOR, 'line-width': 2 }} />
        </Source>
      )}
    </Map>
  );
}

/** Hook carrier: the click listener needs react-map-gl's context, so it lives under `<Map>`. */
function AnalysedParcelClick() {
  useAnalysedParcelClick();

  return null;
}

import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import type { ExpressionSpecification } from 'maplibre-gl';
import Map, { AttributionControl, Layer, Source } from 'react-map-gl/maplibre';

import { FilteredParcelsLayer } from '@/components/map/filtered-parcels-layer';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { featuresBounds, FIT_PADDING } from '@/lib/map/area-bounds';
import { collapseAttribution } from '@/lib/map/attribution';
import { BASEMAP_STYLE, INITIAL_VIEW_STATE } from '@/lib/map/basemap';
import { activeParcelTabAtom } from '@/store/analysis';
import { drawPolygonsAtom } from '@/store/draw';
// Worker setup (see worker.ts) — without it the style never loads and the map is blank.
import '@/components/map/worker';

import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * The parcel palette from the main map (`draw-styles.ts`): the active parcel gets the
 * analysis yellow, the rest the upload white — only the active one's data is shown,
 * so only it reads as selected.
 */
const ACTIVE_COLOR = '#F1FF28';
const INACTIVE_COLOR = '#FFFFFF';
const FILL_OPACITY: ExpressionSpecification = ['case', ['get', 'active'], 0.5, 0.1];
const COLOR: ExpressionSpecification = ['case', ['get', 'active'], ACTIVE_COLOR, INACTIVE_COLOR];

/**
 * Non-interactive satellite thumbnail for the analysis hero, showing what the main map
 * showed: the parcels `filter-parcels` answered (the same layer, selected ones in
 * yellow), which stand in for the drawn areas as on the main map; the areas themselves
 * only show while no parcels exist, the active parcel tab highlighted. Framed by the
 * combined bounds. Every gesture handler is off — the camera belongs to the fit, not
 * the user. Nothing can change while the analysis page is open (analysis mode freezes
 * selection, the parcels query is settled and cached), so the mount-time fit is enough.
 */
export function MiniMap() {
  const areas = useAtomValue(drawPolygonsAtom);
  const storedIndex = useAtomValue(activeParcelTabAtom);
  const { data: parcels } = useQuery(parcelQueries.filtered(areas));

  // Same clamp as the hero tabs: a stale index falls back to the first parcel.
  const activeIndex = storedIndex < areas.length ? storedIndex : 0;
  const features = areas.map((area, index) => ({
    ...area,
    properties: { ...area.properties, active: index === activeIndex },
  }));
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
      dragPan={false}
      scrollZoom={false}
      doubleClickZoom={false}
      dragRotate={false}
      touchZoomRotate={false}
      touchPitch={false}
      keyboard={false}
      style={{ width: '100%', height: '100%' }}
    >
      <AttributionControl compact position="bottom-left" />
      <FilteredParcelsLayer />
      {(parcels?.results.length ?? 0) === 0 && (
        <Source type="geojson" data={{ type: 'FeatureCollection', features }}>
          <Layer type="fill" paint={{ 'fill-color': COLOR, 'fill-opacity': FILL_OPACITY }} />
          <Layer type="line" paint={{ 'line-color': COLOR, 'line-width': 2 }} />
        </Source>
      )}
    </Map>
  );
}

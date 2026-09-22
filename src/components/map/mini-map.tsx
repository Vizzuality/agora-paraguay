import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import Map, { AttributionControl, Layer, Source } from 'react-map-gl/maplibre';

import { FilteredParcelsLayer } from '@/components/map/filtered-parcels-layer';
import { ParcelNumberBadges } from '@/components/map/parcel-number-badges';
import { ZoomControl } from '@/components/map/zoom-control';
import { resolveActiveParcel } from '@/lib/analysis/active-parcel';
import { parcelQueries } from '@/lib/api/parcels/queries';
import type { FilteredParcel } from '@/lib/api/parcels/schemas';
import { featuresBounds, FIT_PADDING } from '@/lib/map/area-bounds';
import { collapseAttribution } from '@/lib/map/attribution';
import { BASEMAP_STYLE, INITIAL_VIEW_STATE } from '@/lib/map/basemap';
import { useActiveParcelSync } from '@/lib/map/use-active-parcel-sync';
import { activeParcelIdAtom, analysedParcelIdsAtom } from '@/store/analysis';
import { drawPolygonsAtom } from '@/store/draw';
// Worker setup (see worker.ts) — without it the style never loads and the map is blank.
import '@/components/map/worker';

import 'maplibre-gl/dist/maplibre-gl.css';

/** The drawing yellow of `draw-styles.ts`, for the areas while no parcels exist yet. */
const AREA_COLOR = '#F1FF28';

/**
 * Satellite map for the analysis hero, showing the parcels `filter-parcels` answered
 * with the hero's active tab highlighted: one parcel in yellow, or every submitted one
 * under Todas; the rest outlined as context. Each submitted parcel carries its number
 * (`ParcelNumberBadges`). Clicking a submitted parcel switches the tab
 * and a tab switch frames the parcel (`useActiveParcelSync`). The areas themselves only
 * paint while no parcels exist. Framed by the combined bounds on mount, then the user's:
 * pan, zoom and the zoom buttons work as on the main map. The camera is not written to
 * the URL — that is the main map's, and this one is gone with the page.
 */
export function MiniMap() {
  const areas = useAtomValue(drawPolygonsAtom);
  const submitted = useAtomValue(analysedParcelIdsAtom);
  const stored = useAtomValue(activeParcelIdAtom);
  const { data: parcels } = useQuery(parcelQueries.filtered(areas));

  const active = resolveActiveParcel(submitted, stored);
  const highlighted = active === null ? submitted : [active];

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
      <FilteredParcelsLayer highlightedIds={highlighted} />
      {parcels && (
        <>
          <ParcelNumberBadges parcels={parcels.results} submitted={submitted} />
          <ActiveParcelSync parcels={parcels.results} submitted={submitted} />
        </>
      )}
      {(parcels?.results.length ?? 0) === 0 && (
        <Source type="geojson" data={{ type: 'FeatureCollection', features: areas }}>
          <Layer type="fill" paint={{ 'fill-color': AREA_COLOR, 'fill-opacity': 0.5 }} />
          <Layer type="line" paint={{ 'line-color': AREA_COLOR, 'line-width': 2 }} />
        </Source>
      )}
    </Map>
  );
}

/** Mount point for the sync hook: it needs `<Map>`'s context, so it cannot run in `MiniMap` itself. */
function ActiveParcelSync(props: Readonly<{ parcels: FilteredParcel[]; submitted: string[] }>) {
  useActiveParcelSync(props);

  return null;
}

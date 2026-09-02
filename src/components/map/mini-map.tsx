import { useAtomValue } from 'jotai';
import type { ExpressionSpecification } from 'maplibre-gl';
import Map, { AttributionControl, Layer, Source } from 'react-map-gl/maplibre';

import { areasBounds } from '@/lib/map/area-bounds';
import { collapseAttribution } from '@/lib/map/attribution';
import { BASEMAP_STYLE, INITIAL_VIEW_STATE } from '@/lib/map/basemap';
import { activeParcelTabAtom } from '@/store/analysis';
import { drawPolygonsAtom } from '@/store/draw';
import { selectedParcelsAtom } from '@/store/parcels';
// Worker setup (see worker.ts) — without it the style never loads and the map is blank.
import '@/components/map/worker';

import 'maplibre-gl/dist/maplibre-gl.css';

/** Breathing room around the framed areas, in px. */
const FIT_PADDING = 40;

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
 * Non-interactive satellite thumbnail for the analysis hero: the analysed areas from
 * the store, framed by their combined bounds, the active parcel tab highlighted.
 * Every gesture handler is off — the camera belongs to the fit, not the user. The
 * areas cannot change while the analysis page is open (analysis mode freezes
 * selection), so the mount-time fit is enough.
 */
export function MiniMap() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const selectedParcels = useAtomValue(selectedParcelsAtom);
  const storedIndex = useAtomValue(activeParcelTabAtom);

  const areas = [...polygons, ...selectedParcels];
  // Same clamp as the hero tabs: a stale index falls back to the first parcel.
  const activeIndex = storedIndex < areas.length ? storedIndex : 0;
  const features = areas.map((area, index) => ({
    ...area,
    properties: { ...area.properties, active: index === activeIndex },
  }));
  const bounds = areasBounds(areas);

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
      <Source type="geojson" data={{ type: 'FeatureCollection', features }}>
        <Layer type="fill" paint={{ 'fill-color': COLOR, 'fill-opacity': FILL_OPACITY }} />
        <Layer type="line" paint={{ 'line-color': COLOR, 'line-width': 2 }} />
      </Source>
    </Map>
  );
}

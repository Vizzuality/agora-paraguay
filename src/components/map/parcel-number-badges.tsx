import type { Map as MapLibreMap } from 'maplibre-gl';
import { useEffect, useState } from 'react';
import { Marker, useMap } from 'react-map-gl/maplibre';

import type { FilteredParcel } from '@/lib/api/parcels/schemas';
import { featuresBounds, type Bounds } from '@/lib/map/area-bounds';
import { badgeScale, parcelLabelPoint } from '@/lib/map/parcel-label-point';

/**
 * The submitted parcels' numbers on the mini map (Figma 5540:8128): a yellow pill with
 * the parcel's position in the submitted list, 1-based, centred on the parcel. HTML
 * markers rather than a symbol layer: the basemap style ships no glyphs and the pill
 * needs a background. Pointer events are off so a click still reaches the parcel under
 * it (`useActiveParcelSync`). A pill shrinks as its parcel gets small on screen
 * (`badgeScale`), so zooming out over many parcels does not leave a heap of overlapping
 * badges.
 */
export function ParcelNumberBadges({
  parcels,
  submitted,
}: Readonly<{ parcels: FilteredParcel[]; submitted: string[] }>) {
  const map = useLiveMap();

  return submitted.map((id, index) => {
    const parcel = parcels.find((entry) => entry.parcel_id === id);
    const point = parcel ? parcelLabelPoint(parcel) : null;

    if (parcel === undefined || point === null) return null;

    const bounds = featuresBounds(parcel.geometry.features);
    const scale = map && bounds ? badgeScale(projectedShorterSide(map, bounds)) : 1;

    return (
      <Marker
        key={id}
        longitude={point.lng}
        latitude={point.lat}
        anchor="center"
        // The wrapper MapLibre creates must let clicks through too, not just the pill.
        style={{ pointerEvents: 'none' }}
      >
        <span
          aria-hidden
          style={{ transform: `scale(${scale})` }}
          className="flex items-center justify-center rounded-full bg-[#F1FF28] px-4 py-2 text-xs font-semibold text-black tabular-nums"
        >
          {index + 1}
        </span>
      </Marker>
    );
  });
}

/** The shorter side of `bounds` in screen pixels at the map's current camera. */
function projectedShorterSide(map: MapLibreMap, [west, south, east, north]: Bounds): number {
  const a = map.project([west, south]);
  const b = map.project([east, north]);

  return Math.min(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
}

/**
 * The MapLibre map, re-rendering the caller on every zoom frame so projected sizes
 * stay current. `null` until react-map-gl has created it.
 */
function useLiveMap(): MapLibreMap | null {
  const { current: mapRef } = useMap();
  const [, setZoom] = useState(0);

  useEffect(() => {
    const map = mapRef?.getMap();

    if (!map) return;

    const update = () => setZoom(map.getZoom());

    update();
    map.on('zoom', update);

    return () => {
      map.off('zoom', update);
    };
  }, [mapRef]);

  return mapRef?.getMap() ?? null;
}

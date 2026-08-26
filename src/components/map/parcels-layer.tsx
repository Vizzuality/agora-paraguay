import { useQuery } from "@tanstack/react-query";
import { Layer, Source } from "react-map-gl/maplibre";

import { parcelQueries } from "@/lib/api/queries";

/**
 * TODO(mock-parcels): this layer renders invented data. When the real parcel layer is
 * available, point it at the real source (or replace the component) and remove every
 * trace of the mock — grep `mock-parcels`.
 *
 * The parcels served by the (mock) API, as a plain MapLibre layer — unlike the drawn
 * and uploaded polygons these are not Terra Draw features: they are not editable, so
 * they stay out of the draw store entirely.
 *
 * Thin white outlines over a barely-there fill: the fields are already visible in the
 * satellite imagery, the layer only traces their boundaries.
 */
export function ParcelsLayer() {
  const { data } = useQuery(parcelQueries.all());

  if (!data || data.features.length === 0) return null;

  return (
    <Source id="parcels" type="geojson" data={data}>
      <Layer
        id="parcels-fill"
        type="fill"
        paint={{ "fill-color": "#FFFFFF", "fill-opacity": 0.05 }}
      />
      <Layer
        id="parcels-outline"
        type="line"
        paint={{ "line-color": "#FFFFFF", "line-width": 1, "line-opacity": 0.8 }}
      />
    </Source>
  );
}

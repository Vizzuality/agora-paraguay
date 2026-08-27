import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import type { FilterSpecification } from "maplibre-gl";
import { Layer, Source } from "react-map-gl/maplibre";

import { parcelQueries } from "@/lib/api/queries";
import { selectedParcelsAtom } from "@/store/parcels";

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
 *
 * Parcels selected for analysis (clicked on the map, `src/store/parcels.ts`) get the
 * same highlight the drawn polygons use (`ANALYSIS` in `draw-styles.ts`), painted by
 * filtered layers — this geometry never enters Terra Draw, so its style functions
 * cannot reach it.
 *
 * TODO(parcel-highlight): the selection currently adds extra layers on top of the base
 * ones. Revisit soon whether that is better than restyling the base layers with
 * data-driven paint expressions (`case`/`in` on the selected ids) — one layer set,
 * no add/remove churn — once the real parcel source settles the layer structure.
 */
export function ParcelsLayer() {
  const { data } = useQuery(parcelQueries.all());
  const selectedParcels = useAtomValue(selectedParcelsAtom);

  if (!data || data.features.length === 0) return null;

  const selectedIds = selectedParcels.map((parcel) => parcel.properties.id);
  const selectedFilter: FilterSpecification = ["in", ["get", "id"], ["literal", selectedIds]];

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
      {/* Explicit `source` and no fragment: <Source> injects the source id by cloning
          its DIRECT children, so a conditional fragment neither inherits it nor
          tolerates the injected prop. */}
      {selectedIds.length > 0 && (
        <Layer
          id="parcels-selected-fill"
          source="parcels"
          type="fill"
          filter={selectedFilter}
          paint={{ "fill-color": "#F1FF28", "fill-opacity": 0.5 }}
        />
      )}
      {selectedIds.length > 0 && (
        <Layer
          id="parcels-selected-outline"
          source="parcels"
          type="line"
          filter={selectedFilter}
          paint={{ "line-color": "#F1FF28", "line-width": 2 }}
        />
      )}
    </Source>
  );
}

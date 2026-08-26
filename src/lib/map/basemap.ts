import type { StyleSpecification } from "maplibre-gl";

import { env } from "@/env";

/**
 * Built-in satellite basemap: Esri World Imagery — keyless, no account, sub-meter
 * Maxar imagery. Tiles verified live over Paraguay up to zoom 19; MapLibre overzooms
 * beyond that. The URL template is Esri's tile scheme, which puts the row before the
 * column: `{z}/{y}/{x}`, not XYZ.
 *
 * An inline style rather than a hosted style.json because no keyless satellite style
 * host exists; attribution is required by Esri's terms and MapLibre renders it from
 * the source.
 */
const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        'Powered by <a href="https://www.esri.com">Esri</a> — Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    },
    // Esri's companion reference layer for World Imagery: administrative boundaries
    // and place labels on transparent tiles, same keyless {z}/{y}/{x} scheme.
    boundaries: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Esri, HERE, Garmin, © OpenStreetMap contributors",
    },
  },
  layers: [
    { id: "satellite", type: "raster", source: "satellite" },
    { id: "boundaries", type: "raster", source: "boundaries" },
  ],
};

/**
 * Basemap style. The env var is the override seam for the client's tile endpoint —
 * the same seam `src/lib/api/client.ts` provides for data; unset, the built-in
 * satellite style above is used.
 */
export const BASEMAP_STYLE: string | StyleSpecification =
  env.VITE_BASEMAP_STYLE_URL ?? SATELLITE_STYLE;

/**
 * Centred on Paraguay (extent ≈ 62.6°W–54.3°W, 27.6°S–19.3°S) at a zoom that fits
 * the whole country in the default viewport.
 */
export const INITIAL_VIEW_STATE = {
  longitude: -58.44,
  latitude: -23.44,
  zoom: 5.5,
} as const;

/**
 * Camera limit — Paraguay's extent padded by roughly 4° so neighbouring context stays
 * reachable, without letting the map wander off to another continent. Intentionally
 * wider than the extent quoted above.
 *
 * MapLibre expects a flat [west, south, east, north] tuple.
 */
export const MAX_BOUNDS: [number, number, number, number] = [-66, -31, -51, -15];

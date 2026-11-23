import { Layer, Source } from 'react-map-gl/maplibre';

/** Built by `scripts/data/build-country-mask.mjs`. */
const MASK_URL = '/data/paraguay-mask.geojson';

const ATTRIBUTION =
  'Límite nacional: <a href="https://www.geoboundaries.org" target="_blank" rel="noopener">' +
  'geoBoundaries</a> (DGEEC 2012) · CC BY 4.0';

/**
 * Dims everything outside Paraguay: one fill over the world with the country cut out.
 * `hidden` toggles its visibility rather than unmounting it, so it keeps its place in the
 * paint order: remounted, it would land on top of the layers mounted after it. Paint
 * order is mount order, so every map mounts it first, right after its controls, and
 * never with a `beforeId`: with a remote basemap
 * style the basemap's layer ids are not ours, and MapLibre drops a layer whose
 * `beforeId` is missing. Everything mounted after paints over it.
 */
export function CountryMask({ hidden = false }: Readonly<{ hidden?: boolean }>) {
  return (
    <Source id="country-mask" type="geojson" data={MASK_URL} attribution={ATTRIBUTION}>
      <Layer
        id="country-mask-fill"
        type="fill"
        layout={{ visibility: hidden ? 'none' : 'visible' }}
        paint={{ 'fill-color': '#000000', 'fill-opacity': 0.5, 'fill-antialias': false }}
      />
    </Source>
  );
}

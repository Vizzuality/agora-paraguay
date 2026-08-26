# Uploading polygons (zipped Shapefile / KML / KMZ / GeoJSON)

Decision record for `src/lib/upload/` and the upload additions to the draw state.
Written 2026-08-20; everything here is client-side because the API does not exist yet.

## What it does

One file per upload — a zipped shapefile, KML/KMZ, or GeoJSON — containing any number
of farm polygons. They are injected into the Terra Draw store, so they behave exactly
like hand-drawn polygons: select, edit, delete and clear all apply. A new upload
replaces the previous upload's polygons; hand-drawn ones survive. Nothing persists
across a reload, matching drawn-polygon behaviour.

Every polygon (drawn or uploaded) appears in the panel's "Areas of interest" list, and
one at a time can be picked for analysis (`analysisId` in `draw-state.ts`). The
analysis selection is app-owned — deliberately separate from Terra Draw's edit
selection, so picking a farm never requires entering edit mode, where drags mutate
geometry. The (future) analysis panel should read `analysisPolygonAtom`.

## Parsing libraries

None of these are on the Tech Radar; they were flagged and signed off with the plan.
All three load lazily inside their parse functions, so the main bundle is unaffected
and a GeoJSON-only user never downloads proj4.

| Format           | Choice                                                            | Why                                                                                                                                                                                                                                                                           |
| ---------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GeoJSON          | `JSON.parse` + Zod schema                                         | Zero new deps; the schema (`geojson-schema.ts`) doubles as the validation layer.                                                                                                                                                                                              |
| KML/KMZ          | `@tmcw/togeojson` + browser `DOMParser`, `fflate` for the KMZ zip | De-facto standard (Placemark/Mapbox lineage), zero-dep, extracts `<name>` → `properties.name`. fflate is the smallest maintained unzip. jszip lost on size (~3–4×); `@loaders.gl/kml` lost on framework weight.                                                               |
| Shapefile (.zip) | `shpjs`                                                           | The only option where "zipped shapefile in EPSG:32721 → WGS84 polygons" is one call: zip handling and proj4 reprojection built in. `@loaders.gl/shapefile` and mbostock's `shapefile` both require rebuilding that by hand. Slow maintenance accepted — the format is frozen. |

## Terra Draw store constraints, and what normalize.ts does about them

Pinned at runtime by `tests/unit/lib/map/terra-draw-api.test.ts` (headless adapter, no
DOM). If a Terra Draw upgrade lifts one of these, that test fails and the matching
workaround can be revisited.

| Store constraint                 | Handling in `normalize.ts`                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Only `Polygon` (no MultiPolygon) | **Explode MultiPolygon → N polygons**, names suffixed `(i/n)` (user-confirmed 2026-08-20). A MultiPolygon file is never rejected wholesale.                                                 |
| Interior rings rejected          | **Skip the holed part with a warning naming it** — not stripped, because silently deleting holes inflates the farm's area for any future analysis (user-confirmed).                         |
| Max 9 coordinate decimals        | Re-parse through `toFixed(9)` (≈ 0.1 mm).                                                                                                                                                   |
| 2D positions                     | z/m dropped (KML and PolygonZ shapefiles produce them).                                                                                                                                     |
| Closed rings                     | Unclosed rings closed.                                                                                                                                                                      |
| Requires `properties.mode`       | Stamped `mode: "polygon"`, plus `origin: "upload"` (drives replace semantics) and `name` (display). Custom properties survive `addFeatures → getSnapshot`, so no id→name side table exists. |

Out-of-range coordinates (|lon| > 180 or |lat| > 90) reject the whole file as
`bad-crs` before anything reaches the store — the usual culprit is a shapefile
without its `.prj`.

## Known caveats

- **Holes are refused, not stripped.** Farms with excluded inner areas (lagoons,
  easements) cannot upload those parts until Terra Draw supports holes or a
  display-only rendering path exists. Biggest functional limitation of the
  editable-store choice.
- **MultiPolygon identity is lost** by explosion: parts are separate list entries and
  separate analysis selections. If whole-farm analysis becomes a requirement, mint a
  shared `properties.groupId` at explosion time — an easy retrofit.
- **Precision**: geometry is not byte-identical to the source. Any future
  hash-of-geometry keying must hash post-normalisation coordinates.
- **Main-thread parsing**: shpjs + proj4 near the 10 MB cap (`MAX_UPLOAD_BYTES`) can
  block for seconds. Web Worker parsing is the future fix if the cap rises.
- **CRS trust is heuristic**: a missing `.prj` with projected coordinates near (0,0)
  can slip the range check and render in the Gulf of Guinea.
- **Shapefile realities**: multi-`.shp` zips are flattened with a warning; non-UTF8
  DBF names may mojibake; `.prj` dialects proj4 cannot read fail as unreadable.
- **KMZ**: only `doc.kml` (or the first `.kml`) is read; `<NetworkLink>` is not
  fetched.
- **Extension-based dispatch**: a mislabelled file fails with its claimed format's
  error, not a hint. Magic-byte sniffing was judged not worth it for three formats.
- Winding order is not normalised; the antimeridian is unhandled (theoretical for
  Paraguay); GeometryCollections recurse one level only; self-intersection is not
  validated — real validity semantics wait for the API.

## Test fixtures

`tests/e2e/fixtures/uploads/` — the text fixtures are committed as-is; the binary ones
(`farms.kmz`, `farms-utm21s.zip`, `corrupt.zip`) are regenerated by
`node tests/e2e/fixtures/uploads/generate.mjs`, which writes the shapefile by hand
(no ogr2ogr needed) and round-trip-verifies it through shpjs.

## Follow-ups

- Per-polygon analysis: `analysisQueries.byPolygon(...)` + Zod schema + fixture-backed
  mock in `client.ts`, keyed by a hash of normalised geometry; a report panel reading
  `analysisPolygonAtom`.
- Web Worker parsing if the size cap rises.
- Display-only rendering path if hole fidelity becomes a requirement.

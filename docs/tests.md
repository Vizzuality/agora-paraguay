# Test inventory

Snapshot of every test in the platform as of 2026-08-27 (branch `feat/app-workflow`): **124
tests — 108 unit (Vitest) + 16 end-to-end (Playwright)**.

## How to run

- `pnpm test:unit` — Vitest, node environment, runs `tests/unit/**` only.
- `pnpm test:e2e` — Playwright (chromium), boots `pnpm dev` itself. First run needs
  `pnpm exec playwright install chromium`.

Ground rules (see `CLAUDE.md`): tests live in `tests/unit/**` mirroring the `src` path, never
colocated in `src/`. No jsdom / testing-library is installed, so there are no component tests —
logic modules are unit-tested, behaviour is e2e-tested.

## Unit tests (108)

### `tests/unit/lib/api/client.test.ts` (3)

**submitAnalysis**

- accepts the request, echoing how many features it received
- mints a distinct id per submission
- rejects a malformed request at the boundary

### `tests/unit/lib/api/parcels-fixtures.test.ts` (7)

**generateParcelFixtures**

- parses against the parcel contract
- covers an extensive area with plenty of parcels
- keeps every parcel inside Paraguay
- makes every parcel an irregular polygon, not an axis-aligned rectangle
- never overlaps two parcels (no centroid falls inside another parcel)
- places parcels flush against neighbours (shared corner vertices)
- is deterministic for a given seed

### `tests/unit/lib/api/schemas.test.ts` (13)

**analysisRequestSchema**

- accepts a FeatureCollection with a Polygon feature
- accepts a MultiPolygon geometry — the contract allows both
- rejects a non-areal geometry
- rejects an empty features array
- rejects a feature with an empty name
- rejects a ring with fewer than 4 positions

**analysisResponseSchema**

- accepts an accepted response
- rejects any status other than accepted

**toAnalysisRequest**

- names features from properties.name, falling back to the list position
- strips Terra Draw's internal properties from the payload
- returns fresh geometry, never aliasing the draw store
- throws on an empty polygon list — the contract wants at least one feature
- accepts cadastral parcel features alongside drawn polygons, named and id-stripped

### `tests/unit/lib/map/draw-features.test.ts` (6)

**isDrawnPolygon**

- accepts a finished polygon
- rejects the guidance features that share the store
- rejects the ring that is still being drawn

**drawnPolygons**

- keeps every finished polygon, in store order
- excludes the polygon being drawn, so a finished count never counts it twice
- is empty when only guidance features remain

### `tests/unit/lib/map/draw-state.test.ts` (11)

**drawReducer**

- marks the instance bound and unbound
- keeps the polygons on unbind — the selection survives the map unmount
- keeps the draw tool over an empty map — a drawing session starts from scratch
- keeps every polygon reported, not just the newest

**analysis selection**

- selects and clears the analysis polygon
- survives tool changes: it is not tied to any Terra Draw mode
- is pruned when its polygon leaves the store
- survives unbind with the polygons it points into

**terraDrawMode**

- is static until the instance is bound
- maps the tool onto a Terra Draw mode

**canSelectParcel**

- allows parcel clicks only while the map is idle

### `tests/unit/lib/map/draw-styles.test.ts` (7)

**PARCEL_STYLES**

- paints the analysis selection yellow, whatever its origin
- paints uploaded parcels white
- leaves hand-drawn parcels on Terra Draw defaults
- requires the analysis flag to be literally true, not merely set

**dotPatternImage**

- produces an RGBA tile of the requested size
- draws one dot at the tile center — an axis-aligned square grid
- draws the dot as a square, not a disc that rasterises into a diamond

### `tests/unit/lib/map/import-features.test.ts` (7)

**importReplacingFeatures**

- imports accepted features and reports the resulting polygons
- replaces everything already in the store once something is accepted
- leaves the store untouched when every feature is rejected
- lands the valid features of a mixed import and warns per rejected one

**restoreFeatures**

- re-adds surviving polygons into a fresh instance, keeping their ids
- keeps the analysis highlight property
- returns only what Terra Draw accepted

### `tests/unit/lib/map/parcel-selection.test.ts` (6)

**toggleParcel**

- adds a parcel that is not selected
- removes a parcel that already is, keeping the rest
- toggles by id, so a re-fetched feature object still matches
- never mutates the selection it was given

**parcelAtPoint**

- finds the parcel under the point
- misses with null, and is empty-safe

### `tests/unit/lib/map/point-in-polygon.test.ts` (5)

**ringContains**

- accepts a point well inside
- rejects a point well outside
- rejects a point outside the bounding box on both axes
- handles a concave ring: inside the L, outside its notch
- rejects a point aligned with an edge but beyond the ring

### `tests/unit/lib/map/terra-draw-api.test.ts` (6)

**terra-draw API**

- subscribes to events Terra Draw still declares
- calls methods Terra Draw still declares

**terra-draw addFeatures contract**

- accepts a Polygon and keeps custom properties through getSnapshot
- returns per-feature validations and still adds the valid features
- rejects MultiPolygons, which is why uploads explode them
- rejects coordinates with more than 9 decimals, which is why uploads round them

### `tests/unit/lib/map/terra-draw-compatibility.test.ts` (1)

**terra-draw MapLibre adapter**

- depends on a surface MapLibre still declares

### `tests/unit/lib/map/view-state.test.ts` (7)

**normalizeLatitude**

- clamps beyond the Web Mercator limit
- leaves a Paraguayan latitude alone apart from rounding

**normalizeLongitude**

- wraps rather than clamps, so crossing the antimeridian is not a dead end
- keeps an in-range longitude

**normalizeZoom**

- clamps to the supported range
- rounds to two decimals

**normalizeViewState**

- repairs a hand-edited URL instead of passing invalid values to MapLibre

### `tests/unit/lib/upload/normalize.test.ts` (21)

**MultiPolygon explosion**

- explodes a MultiPolygon into independent polygons with (i/n) names
- keeps the plain name for a single-part MultiPolygon

**coordinate repair**

- caps precision at 9 decimals, which the store enforces
- drops z and m values
- closes an unclosed ring

**Paraguay bounds**

- rejects valid lng/lat geometry outside Paraguay
- rejects small projected coordinates that slip the world-range check
- rejects the whole file when one polygon of several strays outside
- rejects the whole file when only an interior ring strays outside

**naming**

- prefers name, then nombre, case-insensitively
- falls back to a 1-based Polygon N and ignores non-string values

**non-polygon input**

- counts skipped points and lines into one warning
- recurses into nested GeometryCollections
- errors naming what was found when nothing is importable
- errors on an empty FeatureCollection

**root forms and ids**

- accepts a lone Feature and a bare geometry as the file root
- mints a unique id per feature so auto-select can address them

**normalizeUnknown**

- rejects values that are not GeoJSON with an unreadable error
- skips a malformed feature with a warning instead of rejecting the whole collection
- errors when every feature in the collection is malformed
- still hard-fails a malformed lone-feature root, which has nothing to degrade to

### `tests/unit/lib/upload/parse-geojson.test.ts` (4)

**parseGeoJson**

- rejects text that is not JSON
- rejects JSON that is not GeoJSON
- parses a FeatureCollection with a MultiPolygon, exploding it
- stamps the store properties on every feature

## End-to-end tests (16)

All e2e specs stub the Esri basemap tiles (`tests/e2e/fixtures/map.ts`) so they run without
network access. Binary upload fixtures are regenerated with
`node tests/e2e/fixtures/uploads/generate.mjs`.

### `tests/e2e/analysis.spec.ts` (1)

- analyzes every polygon on the map and moves to the analysis page

### `tests/e2e/camera-url.spec.ts` (1)

- panning twice keeps the camera URL well-formed — regression guard for the nuqs ×
  `retainSearchParams` query-string doubling (`/?lat=X?lat=Y`)

### `tests/e2e/draw.spec.ts` (3)

- draws several polygons without leaving draw mode
- reactivating draw clears the previous session
- loses the drawing on reload

### `tests/e2e/select-cadastral-parcel.spec.ts` (2)

- clicking cadastral parcels selects until Analizar submits them
- clicking a parcel clears the drawn polygons

### `tests/e2e/upload-polygons.spec.ts` (9)

- imports a GeoJSON upload, exploding its MultiPolygon
- switches the analysis selection from the list
- an upload replaces everything already on the map
- imports a KMZ with names from the KML inside
- imports a UTM 21S shapefile, reprojected via its .prj
- a failed upload keeps the polygons already on the map
- rejects a corrupt zip with a readable error
- loses the upload on reload

## Coverage notes

- The KML/KMZ and shapefile parsers (`src/lib/upload/parse-kml.ts`, `parse-shapefile.ts`)
  have no unit tests of their own — they lazy-import DOM-dependent libraries, so their
  behaviour is covered end-to-end by `upload-polygons.spec.ts`, while the shared
  `normalize.ts` they converge on carries the unit coverage.
- `terra-draw-api.test.ts` and `terra-draw-compatibility.test.ts` are contract pins: they
  fail when a dependency bump changes the Terra Draw or MapLibre surface the app relies on,
  which is what turns silent upgrade breakage into a red test.
- No component tests by design — see the ground rules above.

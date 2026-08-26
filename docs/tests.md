# Test inventory

Snapshot of every test in the platform as of 2026-08-26 (branch `feat/terra-draw`): **117
tests — 99 unit (Vitest) + 18 end-to-end (Playwright)**.

## How to run

- `pnpm test:unit` — Vitest, node environment, runs `tests/unit/**` only.
- `pnpm test:e2e` — Playwright (chromium), boots `pnpm dev` itself. First run needs
  `pnpm exec playwright install chromium`.

Ground rules (see `CLAUDE.md`): tests live in `tests/unit/**` mirroring the `src` path, never
colocated in `src/`. No jsdom / testing-library is installed, so there are no component tests —
logic modules are unit-tested, behaviour is e2e-tested.

## Unit tests (99)

### `tests/unit/lib/api/client.test.ts` (5)

**fetchPlaceholders**

- returns data that satisfies the schema
- returns parsed objects, not the raw fixture reference

**submitAnalysis**

- accepts the request, echoing how many features it received
- mints a distinct id per submission
- rejects a malformed request at the boundary

### `tests/unit/lib/api/schemas.test.ts` (19)

**placeholderSchema**

- accepts a well-formed record
- rejects an empty id
- rejects an empty description
- rejects a non-numeric value rather than coercing it
- rejects a record missing a required field

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

**fixtures**

- conform to the schema
- cover the empty case

### `tests/unit/lib/map/draw-features.test.ts` (6)

**isDrawnPolygon**

- accepts a finished polygon
- rejects the guidance features that share the store
- rejects the ring that is still being drawn

**drawnPolygons**

- keeps every finished polygon, in store order
- excludes the polygon being drawn, so a finished count never counts it twice
- is empty when only guidance features remain

### `tests/unit/lib/map/draw-state.test.ts` (19)

**drawReducer**

- marks the instance bound and unbound
- drops everything on unbind, because the instance owned the geometry
- keeps the selection when the tool stays on edit
- clears the selection when leaving edit, without waiting for a deselect event
- releases the edit tool when the last polygon goes, so the toggle cannot stick pressed
- keeps the draw tool over an empty map — a drawing session starts from scratch
- keeps every polygon reported, not just the newest
- keeps the selection while the selected polygon is still there
- clears the selection when the selected polygon goes away
- ignores a deselect for a feature that is not the current selection

**analysis selection**

- selects and clears the analysis polygon
- survives tool changes, unlike the edit selection
- is pruned when its polygon leaves the store
- resets on unbind with everything else

**terraDrawMode**

- is static until the instance is bound
- maps the tool onto a Terra Draw mode

**control availability**

- enables nothing before the instance is bound
- allows drawing but nothing else with an empty map
- allows editing and clearing once any polygon exists, deleting only with a selection

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

### `tests/unit/lib/map/terra-draw-api.test.ts` (7)

**terra-draw API**

- subscribes to events Terra Draw still declares
- calls methods Terra Draw still declares

**terra-draw addFeatures contract**

- accepts a Polygon and keeps custom properties through getSnapshot
- returns per-feature validations and still adds the valid features
- rejects MultiPolygons, which is why uploads explode them
- rejects polygons with holes, which is why uploads skip them
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

### `tests/unit/lib/upload/normalize.test.ts` (24)

**MultiPolygon explosion**

- explodes a MultiPolygon into independent polygons with (i/n) names
- keeps the plain name for a single-part MultiPolygon
- keeps the hole-free parts when one part of a MultiPolygon has holes

**holes**

- skips a holed polygon with a warning naming it, keeping its siblings
- errors when every polygon is holed, mentioning the holes

**coordinate repair**

- caps precision at 9 decimals, which the store enforces
- drops z and m values
- closes an unclosed ring
- rejects the whole file when any coordinate is outside lon/lat range

**Paraguay bounds**

- rejects valid lng/lat geometry outside Paraguay
- rejects small projected coordinates that slip the world-range check
- rejects the whole file when one polygon of several strays outside

**naming**

- prefers name, then nombre, case-insensitively
- falls back to a 1-based Polygon N and ignores non-string values

**non-polygon input**

- counts skipped points and lines into one warning
- recurses one level into a GeometryCollection and skips deeper nesting
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

## End-to-end tests (18)

All e2e specs stub the Esri basemap tiles (`tests/e2e/fixtures/map.ts`) so they run without
network access. Binary upload fixtures are regenerated with
`node tests/e2e/fixtures/uploads/generate.mjs`.

### `tests/e2e/analysis.spec.ts` (1)

- analyzes every polygon on the map and ends the drawing session

### `tests/e2e/camera-url.spec.ts` (1)

- panning twice keeps the camera URL well-formed — regression guard for the nuqs ×
  `retainSearchParams` query-string doubling (`/?lat=X?lat=Y`)

### `tests/e2e/draw-controls.spec.ts` (6)

- starts with nothing drawn and only drawing available
- draws several polygons without leaving draw mode
- deletes one selected polygon and keeps the rest
- clears every polygon at once
- reactivating draw clears the previous session
- loses the drawing on reload

### `tests/e2e/upload-polygons.spec.ts` (10)

- imports a GeoJSON upload, exploding its MultiPolygon
- switches the analysis selection from the list
- an upload replaces everything already on the map
- uploaded polygons are editable: select and delete one
- imports a KMZ with names from the KML inside
- imports a UTM 21S shapefile, reprojected via its .prj
- skips holed polygons with a warning naming them
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

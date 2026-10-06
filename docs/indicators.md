# Indicators: types, behaviour per riesgo, widgets

What an indicator is on `/analisis`, how each kind is read, and which widget it renders under
each riesgo (sanitario (public), productivo (private)) and scope (one parcel, Todas). Written against the code as
it stands; where the live API and the spec disagree, the row says what the client does about
it. The rules live in `src/lib/analysis/widget-config.ts` (`widgetFor`) and the schemas in
`src/lib/api/metadata/schemas.ts` and `src/lib/api/analysis/schemas.ts`. Figma: **Chart types
and colors**, `Agora` file, node `5698-5900`.

## Vocabulary

| Word          | Meaning                                                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Riesgo**    | The analysis tab: `sanitario` (public, `POST /api/parcels/analysis/diseases/`) or `productivo` (login, `POST /api/parcels/analysis/production/`).         |
| **Indicator** | One entry of `GET /api/parcels/indicators/?riesgo=…`: id, name, description, unit, `default`, and an `indicator_type` that says how its reading is typed. |
| **Reading**   | One parcel's value for one indicator, as a property column of the analysis answer.                                                                        |
| **Scope**     | How many parcels a widget reads: `individual` (a parcel tab in the hero) or `multiple` (the Todas tab).                                                   |
| **Widget**    | The card an indicator renders as. Kinds are named by what they draw: ruler, fact, bar chart, histogram, number, deviation, diverging histogram.           |
| **Class**     | One band a classed reading falls in: `Sin riesgo` / `Moderado` / `Severo` for a range, the indicator's own categories for a category.                     |

## 1. Indicator types

`indicator_type.type` is a discriminated union. An unknown type fails the parse on purpose: a
new kind needs a widget before the list can show it.

| Type        | Metadata carries                                                        | Reading must be                                        | Example (live)                                         |
| ----------- | ----------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| `range`     | `min`, `max`, optional `step` (number or `"1"`)                         | A number, or digits in a string (`"2.49"`)             | Disease index 1–3 (`asian_rust`), data quality 0–100 % |
| `category`  | `categories` (ordered labels), optional `value`                         | One of the labels, or its index (sample encodes codes) | `Resiliencia`: Alta / Media / Baja; ITR, volatility    |
| `text`      | nothing                                                                 | A string                                               | `weather_station`, `phenology_stage`, `crop_type`      |
| `numeric`   | nothing (open number)                                                   | A number, or digits in a string                        | `Pro_soja` t/ha, `area` ha                             |
| `deviation` | optional `base` (id of the reference indicator), optional `min` / `max` | A signed number: the difference from the base          | `Des_soja` t/ha (retyped by the client, see below)     |

Normalisations the client applies before the schema (`asSpecIndicator`):

- **`number` → `numeric`.** The API writes the open-number type as `number` on sanitario and
  `numeric` on productivo for the same kind of value. The widgets only know `numeric`.
- **`field_type` → text indicator.** The hero filter `crop_type` is echoed into the indicator
  list with `field_type` + options instead of `indicator_type`. The analysis answers it as text
  (`"Soja"`), so it is read as a `text` indicator: general info, never in the picker.
- **List envelope.** The endpoint answers either the bare array or `{ indicators: [...] }`.
  Both are accepted until the backend settles on one.
- **`Des_*` → `deviation`** (`asDeviationIndicators`, a `select` on the indicators query,
  marked `TODO(api-deviation)` and `TODO(risk)`). The live list types every productivo number
  `numeric`, the deviations from the historical base included. Until the API says which
  indicators are deviations, the client retypes those whose id starts with `Des_` and names
  the crop's production as their base (`Des_soja` → `base: Pro_soja`). A guess on spelling:
  replace with an API type or an explicit list of ids, never grow the prefix rule.

### Readings and "no reading"

The analysis answers one entry per parcel, the indicators as property columns (`properties`),
nothing pre-aggregated. Reading rules (`src/lib/analysis/readings.ts`):

- Columns match ids **ignoring case**: the backend answers `Asian_rust` for `asian_rust`.
- **No reading** = column missing, `null`, blank, `NaN`, or one of `NA`, `N/A`, `nan`, `null`,
  `none`, `-` (trimmed, case-blind). A parcel with no reading gets no card, no row, no count.
- A reading that exists but the metadata cannot place (a `numeric` column holding text, a
  category label outside the list) still shows, as **"Sin datos"**.
- Category labels match by **stem**: case, accents and a final gender vowel are ignored, so
  the answer's `Positivo` / `Medio` matches the definition's `Positiva` / `Media`.
- The category `NA` can be listed in `categories` (ITR, volatility). It is never a band of the
  ruler nor a column of the bar chart; a parcel reading `NA` has no reading.

### Two indicators with special roles

- **`area`** (`numeric`, unit `ha`). Always requested, never a widget or a picker entry: it is
  the figure on the mini map thumbnail (one parcel's area, or the parcels summed under Todas).
  Matched by id ignoring case (`src/lib/analysis/area.ts`).
- **General info** (text, and open numbers on sanitario): always requested, always rendered
  in the single "Información general" card on sanitario, never in the picker. Productivo has no
  general-info card today; its text indicators are facts in theory but nothing renders them.

## 2. Behaviour per riesgo

### What is requested

`requestedIndicatorIds` sends, in metadata order: every general-info indicator, the area, and
the measured indicators the picker shows. The picker (Personalizar indicadores) shows the
user's selection; before the user touches it, the indicators the API flags `default: true`; if
none is flagged, all of them. Selection is per riesgo (`selectedIndicatorIdsAtom`).

The request also carries the hero filters flat (`crop_type`, `sowing_date`, `date`, …, whatever
`GET /api/parcels/filters/` lists). Any of parcels, filters or indicators changing re-POSTs;
`keepPreviousData` keeps the cards up meanwhile.

### Sanitario (public)

| Type       | One parcel                                   | Todas                                                                                                     |
| ---------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `range`    | Ruler: class as the figure, marker in a band | Short range (max ≤ 10): bar chart per class. Long range: histogram over the scale, bins coloured by class |
| `category` | Ruler: category as the figure                | Bar chart, one column per category                                                                        |
| `text`     | General info row                             | General info row, distinct values listed (`"A, B"`)                                                       |
| `numeric`  | General info row (number + unit)             | General info row, values averaged                                                                         |

Todas on sanitario reads a **combined parcel** (`combinedParcel`): per column, the parcels that
carry a reading are combined by type: range and open numbers **average**, a category takes the
**most frequent** (first wins a tie), text lists the **distinct values**. Columns the metadata
does not know follow the shape of their values (numbers average, strings list). The classed
widgets do not use the combined parcel; they count or bin the submitted parcels directly.

### Productivo (login)

| Type        | One parcel                                                                      | Todas                                                                                                       |
| ----------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `range`     | Number card: figure + marker on the range's own scale                           | Histogram over the range: one bin per step when short (0–8), twenty bins when long (0–100 %), single colour |
| `category`  | Ruler: category as the figure                                                   | Bar chart, one column per category                                                                          |
| `text`      | Fact (no card renders it today)                                                 | Fact (no card renders it today)                                                                             |
| `numeric`   | Number card: figure + marker on the set's scale                                 | Histogram over the set's scale, single colour                                                               |
| `deviation` | Deviation card: signed figure, marker on a diverging track, base value under it | Diverging histogram: parcels binned over their base, a bar up for those above it, down for those below      |

Productivo-only rules:

- **Applicability by crop** (`applicableIndicators`, marked `TODO(api-filters)`). The list
  carries every crop's indicators (`Pro_soja`, `Pro_arroz`, …) and the analysis answers them all.
  An indicator whose id ends in `_soja` / `_arroz` shows only for that crop (hero `crop_type`
  `soy` → `soja`, `rice` → `arroz`). An indicator the answer carries but every submitted parcel
  reads as no reading is out too. One the answer does not carry at all stays. Sanitario's list
  is left as is. Remove once the API filters by crop itself.
- **Scale shared across scopes.** The number card (one parcel) and the histogram (Todas) draw
  the same axis. An open number: zero to the first round tick above the largest submitted
  value (`numberScale`, d3-style 1/2/5 steps), so a parcel reads against the set. A range:
  its own `min`–`max` (`scaleFor`), so a count of 3 on 0–8 or 40 % on 0–100 reads against the
  scale it is defined on, never as a risk class.
- **A deviation reads against its base.** One parcel: the signed difference as the figure, the
  track from `-span` to `+span` with zero in the middle (`deviationSpan`: the metadata's bound,
  else a round figure above the largest absolute value), the base reading printed under the
  marker. Todas: each parcel placed on the axis by its **base** reading, counted above or below
  by the sign of its deviation (an exact zero counts neither); without a `base` the axis is the
  deviation itself, symmetric around zero.
- **Parcel labels.** Rows say "Parcela N", N the parcel's 1-based place in the submission,
  whichever tab is open.
- The AI summary widget (`POST /api/parcels/analysis/summary/`) sits above the grid; it is not
  an indicator.

## 3. Visualizations

### Decision table

`widgetFor(type, { riesgo, scope })`, the single place this is decided. Each builder in
`src/lib/analysis/` answers only the indicators whose kind is its own, so an indicator lands in
at most one widget; `analysisWidgets` assembles them in metadata order.

| Type        | Riesgo     | Scope      | Widget kind                            | Builder                                          | Component                                  | Figma node                                                           |
| ----------- | ---------- | ---------- | -------------------------------------- | ------------------------------------------------ | ------------------------------------------ | -------------------------------------------------------------------- |
| `range`     | sanitario  | individual | `ruler`                                | `indicatorCards`                                 | `RiskClassCard`                            | `5698-5989` (integer on short range) / `5698-6186` (value on marker) |
| `range`     | sanitario  | multiple   | `bar-chart` if short, else `histogram` | `categoryCountWidgets` / `valueHistogramWidgets` | `CategoryCountCard` / `ValueHistogramCard` | `5698-6010` / `5698-6207`                                            |
| `range`     | productivo | individual | `number`                               | `numberWidgets`                                  | `NumberCard`                               | — (own decision, AGP-69)                                             |
| `range`     | productivo | multiple   | `histogram` (stepped when short)       | `valueHistogramWidgets`                          | `ValueHistogramCard`                       | — (own decision, AGP-69)                                             |
| `category`  | any        | individual | `ruler`                                | `indicatorCards`                                 | `RiskClassCard`                            | `5698-5989`                                                          |
| `category`  | any        | multiple   | `bar-chart`                            | `categoryCountWidgets`                           | `CategoryCountCard`                        | `5698-6010`                                                          |
| `text`      | any        | any        | `fact`                                 | `generalInfo`                                    | `GeneralInfoCard`                          | —                                                                    |
| `numeric`   | sanitario  | any        | `fact`                                 | `generalInfo`                                    | `GeneralInfoCard`                          | —                                                                    |
| `numeric`   | productivo | individual | `number`                               | `numberWidgets`                                  | `NumberCard`                               | `5698-6230`                                                          |
| `numeric`   | productivo | multiple   | `histogram`                            | `valueHistogramWidgets`                          | `ValueHistogramCard`                       | `5698-6251`                                                          |
| `deviation` | sanitario  | any        | `fact`                                 | `generalInfo`                                    | `GeneralInfoCard`                          | —                                                                    |
| `deviation` | productivo | individual | `deviation`                            | `deviationWidgets`                               | `DeviationCard`                            | `5702-9119` (Widget03)                                               |
| `deviation` | productivo | multiple   | `diverging-histogram`                  | `deviationHistogramWidgets`                      | `DeviationHistogramCard`                   | `5702-8853` (Widget03, several parcels)                              |

"Short range" is `max ≤ 10` (`SHORT_RANGE_MAX`): a 1–3 disease index reads as a handful of
values, a 0–100 % quality as a continuum.

### Ruler (`RiskClassCard`)

The class as the large figure, one band per class, the marker inside the band the reading
falls in.

- **Range.** Always three classes, `RANGE_CLASSES`: `Sin riesgo` (low), `Moderado` (medium),
  `Severo` (high), splitting `[min, max]` equally. An **integer on a short range** centres the
  marker in its bin, bins' upper edges inclusive: 0–3 in three is (0,1], (1,2], (2,3], the
  minimum and out-of-range values to the outer classes. Any other reading (a decimal, or any
  number on a long range) puts the marker at the exact spot and prints the number over it.
  Without `min`/`max` the scale defaults to 0–100.
- **Category.** One band per category (NA excluded), in the metadata's order, read low to high;
  the marker centres in its band. Colours by band count (`classTones`): 1 = orange; 2 = blue,
  red; 3 = blue, grey, red; 4 = blue, grey, orange, red; more keep the ends and grey the middle.
- `classIndexAt`: a cut point belongs to the class above it; NaN and out-of-range positions clamp
  to the outer classes.

### Bar chart (`CategoryCountCard`)

One column per class with the count of submitted parcels in it, empty classes kept. Shown as
soon as some submitted parcel carries the column, even if every parcel reads NA (the chart
then shows nothing counted). Classes: a category's own (NA aside); a short range's three
`RANGE_CLASSES`, each parcel classed by `rangeClassIndex` (the same rule the ruler uses, so
counts agree with cards). Category columns are coloured by the **label's magnitude word**
(`categoryTone`): `Bajo` / `Muy bajo` grey, `Alto` / `Muy alto` / `Alerta` orange, anything
else blue.

### Histogram (`ValueHistogramCard`)

Twenty equal bins over a scale (`HISTOGRAM_BINS`), every bin kept, a value on an upper edge in
the bin above, the maximum in the last, out-of-range values in the outer bins.

- **Long range:** the indicator's `[min, max]`; the class names under the scale in thirds; each
  bin painted by the class its middle falls in.
- **Open number (productivo):** `numberScale` of the submitted values, no classes, every bin
  orange, the unit under the title.
- **Range (productivo):** the indicator's `[min, max]`, no classes, every bin orange. A
  **short range** (`max ≤ 10`) is **stepped** (`steppedBins`): one bin per step, centred on its
  value and labelled by it, so 0–8 in steps of 1 is nine bins, "0" to "8", the axis padded half
  a step either side so the ticks fall in the middle of the bins. A long range gets the twenty
  equal bins.

### Number card (`NumberCard`)

One parcel's number as the figure, unit under the title, marker on a single-colour track.
An open number's track is `numberScale` of **all** submitted parcels' values (the Todas
histogram's axis); a range's is its own `min`–`max` with linear ticks.

### Deviation card (`DeviationCard`)

One parcel's signed difference from its base as the figure (`formatSigned`: es-PY, sign
always shown, `+0,5` / `-0,3`, zero bare), unit under the title, marker on a diverging track
with zero in the middle, red to the left, blue to the right, `-span` / `0` / `+span` as the
ticks. The base reading (`Pro_soja`: `3,55`) prints under the marker when the metadata names a
`base` and the parcel answered it. A parcel with no reading gets no card.

### Diverging histogram (`DeviationHistogramCard`)

The set under Todas: twenty bins over the base production (zero to a round figure above the
largest base), each bin a bar **up** with the count of parcels above their base and a bar
**down** with the count below, sharing one y-unit so the sides compare. Tooltip: the bin's
edges and "N por encima, M por debajo" (`deviationCounts`, "ninguna" when empty). A parcel
without a base reading is left out; without a `base` in the metadata the axis is the deviation
itself around zero.

### General info (`GeneralInfoCard`)

The text and open-number facts of the active parcel, in metadata order, a number formatted
with its unit; then any column the metadata does not claim, under its own column name.
Indicator descriptions behind the info icon (all widgets) are run through `describeWithFilters`:
`{'id': 'date'}` in a description reads as the hero's current value for that filter.

### Colour tokens

| Tone       | Token            | Used by                                                        |
| ---------- | ---------------- | -------------------------------------------------------------- |
| `low`      | `--risk-low`     | Blue: `Sin riesgo`, first category band, "other" category bars |
| `medium`   | muted foreground | Grey: `Moderado`, middle bands, `Bajo` bars                    |
| `elevated` | `--risk-medium`  | Orange: single-band palettes, `Alto` bars, open-number bins    |
| `high`     | `--risk-high`    | Red: `Severo`, last band                                       |

## Follow-ups found while writing

Mismatches between code, spec and live API, listed rather than fixed:

1. **Two colour rules for categories.** The ruler colours a category by its **position**
   (`classTones`); the bar chart by its **label's word** (`categoryTone`). A 3-category indicator
   with `Alta / Media / Baja` reads blue/grey/red on the ruler and orange/blue/grey on the bars.
   The design's "colour by number of categories" rule (AGP-52) matches the ruler; confirm which
   one the bars should follow.
2. **`number` vs `numeric`.** Both live lists write `numeric`; the `number → numeric`
   normalisation and the schema comment about sanitario are stale. Drop or keep as insurance.
3. **`crop_type` in the indicator list** as a `field_type` entry. Client reads it as text;
   the API should either list it as an indicator or leave it to the filters endpoint.
4. **Productivo range indicators** (IEP, ProInf, `N_*`) render as a number card and a histogram
   on their own scale (AGP-69), a client decision without a Figma frame of its own: the design
   file has no "range on productivo" widget. Confirm with design.
5. **Productivo text indicators** are classed as facts but no card renders them: there is no
   general-info card on productivo. Live casualties: `Zafras_soja` / `Zafras_arroz`, the codes.
6. **Crop applicability is client-side** (`_soja` / `_arroz` id suffix). Marked
   `TODO(api-filters)`; goes away when the API filters by crop.
7. **Column casing** (`Asian_rust` for `asian_rust`) and **category label gender**
   (`Positivo` for `Positiva`) are papered over by stem matching.
8. **Descriptions carry Python dict reprs** (`{'id': 'date'}`) that the client rewrites.
9. **List envelope** undecided (bare array vs `{ indicators }`).
10. `step` arrives as a string (`"1"`) in the spec example; the live list writes a number.
11. **Humidity and data-quality ranges read as risks.** `humidity_rel_avg` and the three
    `*_data_quality` indicators are typed `range` 0–100, so they get the risk ruler and the
    class-banded histogram, "Sin riesgo" as the figure. Probably `numeric` facts instead.

## Appendix: the live lists

As the local Django answered `GET /api/parcels/indicators/?riesgo=…`. Every entry carries
`default: true`, so the picker starts with all of them. Widget column = what each renders on a
parcel tab / under Todas.

### Sanitario

| id                         | Name                                            | Type                  | Unit | Widget             |
| -------------------------- | ----------------------------------------------- | --------------------- | ---- | ------------------ |
| `DPTO_CODE`                | Código del departamento                         | `text`                | —    | general info       |
| `DIST_CODE`                | Código del distrito                             | `text`                | —    | general info       |
| `weather_station`          | Nombre de la estación meteorológica más cercana | `text`                | —    | general info       |
| `area`                     | Area                                            | `numeric`             | ha   | mini map thumbnail |
| `temperature_avg`          | Temperatura promedio (72 h)                     | `numeric`             | °C   | general info       |
| `humidity_rel_avg`         | Humedad relativa promedio (72 h)                | `range` 0–100, step 1 | %    | ruler / histogram  |
| `rain_avg`                 | Lluvia promedio (72 h)                          | `numeric`             | mm   | general info       |
| `temperature_data_quality` | Calidad del dato de temperatura                 | `range` 0–100, step 1 | %    | ruler / histogram  |
| `humidity_data_quality`    | Calidad del dato de humedad                     | `range` 0–100, step 1 | %    | ruler / histogram  |
| `rain_data_quality`        | Calidad del dato de lluvia                      | `range` 0–100, step 1 | %    | ruler / histogram  |
| `crop_type`                | Tipo de cultivo                                 | `field_type` → `text` | —    | general info       |
| `phenology_stage`          | Nombre del momento fenológico estimado          | `text`                | —    | general info       |
| `roya_asiatica`            | Roya asiática                                   | `range` 0–3, step 1   | —    | ruler / bar chart  |
| `mancha_marron`            | Mancha marrón                                   | `range` 0–3, step 1   | —    | ruler / bar chart  |
| `mancha_ojo_de_rana`       | Mancha ojo de rana                              | `range` 0–3, step 1   | —    | ruler / bar chart  |
| `mildiu`                   | Mildiu                                          | `range` 0–3, step 1   | —    | ruler / bar chart  |
| `antracnosis`              | Antracnosis                                     | `range` 0–3, step 1   | —    | ruler / bar chart  |
| `cancro_del_tallo`         | Cancro del Tallo                                | `range` 0–3, step 1   | —    | ruler / bar chart  |
| `tizon_de_la_hoja`         | Tizon-de-la-Hoja                                | `range` 0–3, step 1   | —    | ruler / bar chart  |
| `oidio`                    | Oídio                                           | `range` 0–3, step 1   | —    | ruler / bar chart  |

Read off the list:

- The open-number type arrives as `numeric`, not `number` as the schema comment records for
  sanitario (see the productivo note on the normalisation).
- **`humidity_rel_avg` is a `range`**, so it renders as a risk: "Sin riesgo" / "Moderado" /
  "Severo" over relative humidity, with the Todas histogram banded in those classes. The three
  `*_data_quality` ranges read the same way. If these are facts, not risks, the API should type
  them `numeric` (follow-up 11).
- Descriptions reference the hero filters as `{'id': 'date'}` / `{'id': 'sowing_date'}` and the
  request group as `disease_filters` (`describeWithFilters` rewrites both).
- Diseases are 0–3 with step 1: integers, short range, so a parcel's marker centres in a class
  and Todas counts per class.

### Productivo

Fifty-six entries, most in `_soja` / `_arroz` pairs (the crop rule hides the other crop's).
`default` is `true` on all but the two codes. Grouped by family:

| Family (ids)                                                                | Name                                                       | Type                                                  | Unit | Widget (parcel / Todas)              |
| --------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------- | ---- | ------------------------------------ |
| `DPTO_CODE`, `DIST_CODE`                                                    | Código del departamento / distrito                         | `text` (`default: false`)                             | —    | fact: nothing renders it             |
| `area`                                                                      | Área de la parcela                                         | `numeric`                                             | ha   | mini map thumbnail                   |
| `Pro_*`, `Mad_*`, `P25_*`, `P50_*`, `P75_*`, `IQR_*`                        | Historical production: base, MAD, quartiles, IQR           | `numeric`                                             | t/ha | number card / histogram              |
| `Des_*`                                                                     | Desviación de la producción (documented as SD)             | `numeric` → `deviation`, base `Pro_*` (client retype) | t/ha | deviation card / diverging histogram |
| `MID_H5_*`, `MID_H10_*`, `HIGH_H5_*`, `HIGH_H10_*`, `LOW_H5_*`, `LOW_H10_*` | Projected production, 3 scenarios × 2 horizons             | `numeric`                                             | t/ha | number card / histogram              |
| `N_soja`, `N_arroz`                                                         | Contador de zafras detectadas                              | `range` 0–8, step 1                                   | —    | number card / stepped histogram      |
| `Zafras_soja`, `Zafras_arroz`                                               | Listado de Zafras                                          | `text`                                                | —    | fact: nothing renders it             |
| `ITR_*`                                                                     | Índice de Tendencia Relativa                               | `category` Positiva / Estable / Alerta                | —    | ruler / bar chart                    |
| `Resiliencia`                                                               | Proxy de resiliencia operativa (no crop suffix: all crops) | `category` Muy Alta / Alta / Media / Baja / Muy Baja  | —    | ruler (5 bands) / bar chart          |
| `Vol_*`                                                                     | Volatilidad del rendimiento asociada al clima              | `category` Alta / Media / Baja                        | —    | ruler / bar chart                    |
| `IEP_H5_*`, `IEP_H10_*`                                                     | Índice de estabilidad productiva                           | `range` 0–100, step 1                                 | %    | number card / histogram              |
| `ProInf_H5_*`, `ProInf_H10_*`                                               | Probabilidad de quedar por debajo de la media histórica    | `range` 0–100, step 1                                 | %    | number card / histogram              |
| `Conf_H5_*`, `Conf_H10_*`                                                   | Bandera de confianza para uso crediticio                   | `category` Muy Alta / Alta / Moderada / Baja          | —    | ruler (4 bands) / bar chart          |
| `Puntuacion_*`                                                              | Puntuación de exposición climática corto vs. medio plazo   | `category` Alta / Moderada / Baja                     | `%`  | ruler / bar chart                    |

Read off the list:

- The open-number type is `numeric` here too. The `number → numeric` normalisation in
  `asSpecIndicator` matches nothing the live API writes today; it stays only as insurance.
- **Every range on productivo is a number on its own scale**, never a risk: `N_*` (0–8) is a
  number card on 0–8 and, under Todas, nine stepped columns "0" to "8"; `IEP_*` / `ProInf_*`
  (0–100 %) a number card on 0–100 and a twenty-bin histogram. No ruler, no classes.
- **`Des_*` is retyped as a deviation** by the client (`Des_` prefix, base `Pro_*`) and gets
  the diverging widgets. Its description calls it a standard deviation, which is never
  negative; whether the backend answers a signed difference is open (follow-up 15).
- **Text indicators render nowhere**: `Zafras_*` (the list of seasons detected) and the two
  codes are requested and answered but no productivo card shows facts.
- **Category order is best → worst** (`Positiva, Estable, Alerta`; `Muy Alta … Muy Baja`), so
  on the ruler the first band is blue and the last red, the marker in a good class sits left.
  The bar chart ignores the order and colours by word, so `Muy Alta` is orange there and blue
  on the ruler (follow-up 1, with these very indicators).
- The category `NA` the schema comment attributes to ITR and volatility is not in the live
  lists; the backend answers it as a reading instead, and `readingOf` drops it.
- `Puntuacion_*` is a category with `unit: "%"`; the unit is unused on a category widget.
- Content slips in the metadata, for the data team: `Mad_arroz` is named "… de soja";
  `ITR_arroz`'s description talks about soja; `P75_*` say "50 por ciento"; `IQR_arroz` writes
  `P75_arrox`.

12. **Short ranges on productivo** (`N_soja` / `N_arroz`, 0–8 integers) bin one column per
    step under Todas (AGP-69) and read as a number on a parcel tab, never as risk classes.
    Confirm the stepped histogram is the wanted reading of "zafras detectadas".
13. **Metadata content slips** (names, descriptions, a `%` unit on a category) listed under the
    productivo appendix; for the data team, not the client.
14. **Productivo numbers need a representation of their own.** Two defects, seen live on a
    one-parcel analysis of soja:
    - _The scale says nothing._ `numberScale` spans the submitted parcels' values, so with one
      parcel the axis runs from zero to the parcel's own value rounded up and the marker always
      sits near the right end: 3,87 on 0–4,5; 0,58 on 0–1,1; 4,19 on 0–4,5. The design's
      "Numerical individual" assumes the set gives the scale meaning; a single parcel has no set.
    - _One distribution, seven cards._ `Pro` (mean), `Des` (SD), `Mad`, `P25`, `P50`, `P75` and
      `IQR` describe the same historical production. As separate number cards the relationship
      between them is lost; read together they are a box plot: P25–P75 box (the IQR), P50 line,
      the mean as a marker, ±SD as whiskers, all on one t/ha axis. The same applies to the
      projections, `LOW`/`MID`/`HIGH` × `H5`/`H10`: two horizons as range bars (low–mid–high) on
      one axis, the historical base as the reference line; and to the per-horizon trio
      `IEP` / `ProInf` / `Conf` (+ `Puntuacion`).

    The API lists them flat: no `group`, `horizon` or `scenario` attribute. A grouped widget
    needs either new metadata (preferred: a `group` id and a `role` such as `mean`, `sd`, `p25`,
    `low`, `mid`, `high`, `h5`, `h10`) or a client convention on the id prefix, like the crop
    suffix rule and with the same `TODO(api-filters)` caveat. Design for the grouped widgets is
    not in the Figma frame yet. What the frame does have is Widget03 (node `5702-9119`): a
    signed deviation from the base (`+0,5` t/ha) on a diverging track, red below zero, blue
    above. Built as the `deviation` type (AGP-68), today fed by the `Des_` stopgap.

15. **The `Des_` prefix rule is a stopgap** (`deviation-override.ts`, `TODO(api-deviation)`,
    `TODO(risk)`). It guesses meaning from the spelling of ids, and the live `Des_soja` is
    documented as a **standard deviation** (never negative), not a signed difference: on live
    data the diverging track only ever fills the blue side. Needs the API to type deviations
    (`{ type: 'deviation', base, min?, max? }`) and the data team to say which indicators are
    signed. Discussion thread on AGP-68.

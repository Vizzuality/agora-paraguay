import type { FillPaint } from '@/lib/map/global-layer-styles';
import { LEGEND_ALL_CONTROLS, type LegendConfig } from '@/lib/map/legend-config';

/*
 * How the exposición climática map paints its global layers: the districts layer on both
 * tabs, and the reference layers Capas adds under it. Pure, node-tested.
 */

/** The districts layer: clear, so it still reports hover and clicks, with faint edges. */
export const DISTRICTS_FILL: FillPaint & { opacity: number } = {
  color: 'rgba(109, 128, 103, 0)',
  opacity: 1,
  outlineColor: 'rgba(0, 0, 0, 0.2)',
};

/** Exposed hectares where the drought and flood ramps start and end. */
const RAMP_START_HA = 0;
const RAMP_END_HA = 1_000_000;

// Both ramps hold one colour at each end for now; the stops stay so either can be retuned.
const DROUGHT = '#c98763';
const FLOOD = '#9bbec0';
const FLOOD_EDGE = '#9bbebf';
const SOJA = '#6d8067';

/** A fill that ramps a parcel's exposed hectares (`property`) from `from` to `to`. */
function hectareRamp(property: string, from: string, to: string): FillPaint['color'] {
  return [
    'interpolate',
    ['linear'],
    ['to-number', ['coalesce', ['get', property], 0]],
    RAMP_START_HA,
    from,
    RAMP_END_HA,
    to,
  ];
}

export type ReferenceLayer = {
  id: number;
  label: string;
  /** One opacity for the whole layer, which the legend fades. */
  fill: FillPaint & { opacity: number };
  /** The legend swatch's fill and edge, matching the layer. */
  swatch: { fill: string; edge: string };
  /** The controls its legend row gets. */
  legendConfig: LegendConfig;
};

/** Capas's layers in paint order: the country-wide hazards first, soy on top. */
export const REFERENCE_LAYERS: ReferenceLayer[] = [
  {
    id: 6,
    label: 'Expuesto a sequía',
    fill: {
      color: hectareRamp('Drought_ha', DROUGHT, DROUGHT),
      opacity: 0.85,
      outlineColor: DROUGHT,
    },
    swatch: { fill: DROUGHT, edge: DROUGHT },
    legendConfig: LEGEND_ALL_CONTROLS,
  },
  {
    id: 7,
    label: 'Expuesto a inundación',
    fill: { color: hectareRamp('Flood_ha', FLOOD, FLOOD), opacity: 0.8, outlineColor: FLOOD_EDGE },
    swatch: { fill: FLOOD, edge: FLOOD_EDGE },
    legendConfig: LEGEND_ALL_CONTROLS,
  },
  {
    id: 8,
    label: 'Soja',
    fill: { color: SOJA, opacity: 0.9, outlineColor: 'rgba(92, 107, 84, 0)' },
    swatch: { fill: SOJA, edge: SOJA },
    legendConfig: LEGEND_ALL_CONTROLS,
  },
];

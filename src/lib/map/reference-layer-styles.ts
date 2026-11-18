import type { FillPaint } from '@/lib/map/global-layer-styles';
import { LEGEND_ALL_CONTROLS, type LegendConfig } from '@/lib/map/legend-config';

/*
 * How the exposición climática map paints its global layers: the districts layer on both
 * tabs, and the reference layers Capas adds under it. Pure, node-tested.
 */

/** The districts layer: clear, so it still reports hover and clicks, with faint edges. */
export const DISTRICTS_FILL: FillPaint & { opacity: number } = {
  color: 'rgba(0, 0, 0, 0)',
  opacity: 1,
  outlineColor: 'rgba(0, 0, 0, 0.2)',
};

/** How Capas marks districts over the reference layers: the pick and the pointer's. */
export const DISTRICT_PICK = { stroke: '#000', hoverFill: 'rgba(0, 0, 0, 0.3)' };

/** Drought-exposed hectares a parcel needs to start the drought ramp, and to end it. */
export const DROUGHT_RAMP_START_HA = 264_864;
export const DROUGHT_RAMP_END_HA = 1_000_000;

const DROUGHT_DARK = '#c98763';
const DROUGHT_LIGHT = '#e3b570';
const FLOOD = '#6a898a';
const SOJA = '#6d8067';

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
      color: [
        'interpolate',
        ['linear'],
        ['to-number', ['coalesce', ['get', 'Drought_ha'], 0]],
        DROUGHT_RAMP_START_HA,
        DROUGHT_DARK,
        DROUGHT_RAMP_END_HA,
        DROUGHT_LIGHT,
      ],
      opacity: 0.85,
      outlineColor: DROUGHT_LIGHT,
    },
    swatch: { fill: DROUGHT_DARK, edge: DROUGHT_LIGHT },
    legendConfig: LEGEND_ALL_CONTROLS,
  },
  {
    id: 7,
    label: 'Expuesto a inundación',
    fill: { color: FLOOD, opacity: 0.75, outlineColor: '#9bbec0' },
    swatch: { fill: FLOOD, edge: '#9bbec0' },
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

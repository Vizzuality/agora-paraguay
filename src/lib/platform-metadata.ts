import { z } from 'zod';

import metadata from '@/content/platform-metadata.json';
import type { RiskTone } from '@/lib/analysis/widget-config';

/*
 * Copy and settings the front end holds until the backend serves them, kept in
 * `src/content/platform-metadata.json` in the shape a `GET /api/metadata/` endpoint could
 * answer (snake_case). When it exists, fetch this from there and delete the file.
 */

const introSectionSchema = z.object({ title: z.string().min(1), body: z.array(z.string()) });

const analysisTypeSchema = z.object({
  id: z.enum(['exposicion_climatica', 'sanitario', 'productivo']),
  name: z.string().min(1),
  description: z.string().min(1),
  requires_login: z.boolean(),
  intro: z
    .object({
      pick_district: introSectionSchema,
      read_map: z.object({
        title: z.string().min(1),
        body: z.object({ exposicion: z.array(z.string()), capas: z.array(z.string()) }),
      }),
    })
    .nullable(),
});

/**
 * A class's colour by name, so the metadata stays free of hex and themes: the front end
 * paints each name with its own tokens (`RiskTone`).
 */
export const riskColorSchema = z.enum(['green', 'blue', 'grey', 'orange', 'red']);

const COLOR_TONES: Record<z.infer<typeof riskColorSchema>, RiskTone> = {
  green: 'none',
  blue: 'low',
  grey: 'medium',
  orange: 'elevated',
  red: 'high',
};

/** The ruler tone a metadata colour name paints with. */
export function colorTone(color: z.infer<typeof riskColorSchema>): RiskTone {
  return COLOR_TONES[color];
}

/** A titled run of indicators: the API's `category`, plus the front end's context facts. */
const indicatorCategorySchema = z.object({
  id: z.enum(['context', 'historic', 'future']),
  name: z.string().min(1),
});

const platformMetadataSchema = z.object({
  analysis_types: z.array(analysisTypeSchema),
  indicator_categories: z.array(indicatorCategorySchema),
  risk_classes: z.array(z.object({ label: z.string().min(1), color: riskColorSchema })).min(1),
  indicator_plural_names: z.record(z.string(), z.string().min(1)),
  crops: z.object({
    options: z.array(z.object({ id: z.enum(['soja', 'rice']), name: z.string().min(1) })),
    all_label: z.string().min(1),
  }),
  projection: z.object({
    title: z.string().min(1),
    picker_name: z.string().min(1),
    baseline_label: z.string().min(1),
    // The ids are the scenario columns' infix (`MID_H5_soja`), so only these two exist.
    horizons: z.array(z.object({ id: z.enum(['H5', 'H10']), name: z.string().min(1) })),
  }),
  parcels: z.object({
    legend_items: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })),
    legend_note: z.string().nullable(),
  }),
  report: z.object({ attribution_lead: z.string().min(1), hectares_label: z.string().min(1) }),
});

export type AnalysisTypeId = z.infer<typeof analysisTypeSchema>['id'];

const METADATA = platformMetadataSchema.parse(metadata);

/** An analysis type as the app names and gates it. Throws for an id the file lacks. */
export function analysisTypeMetadata(id: AnalysisTypeId): {
  label: string;
  description: string;
  requiresLogin: boolean;
} {
  const type = METADATA.analysis_types.find((entry) => entry.id === id);

  if (!type) throw new Error(`No metadata for analysis type ${id}`);

  return { label: type.name, description: type.description, requiresLogin: type.requires_login };
}

/** Exposición climática's intro: what to pick, and how to read each view of the map. */
export const EXPOSURE_INTRO = (() => {
  const intro = METADATA.analysis_types.find(({ id }) => id === 'exposicion_climatica')?.intro;

  if (!intro) throw new Error('Exposición climática has no intro');

  return { pickDistrict: intro.pick_district, readMap: intro.read_map };
})();

export type IndicatorCategoryId = z.infer<typeof indicatorCategorySchema>['id'];

/** Text by id for every id the app needs; throws at load for one the file lacks. */
function textById<Id extends string>(
  ids: readonly Id[],
  entries: readonly (readonly [id: string, text: string])[],
  what: string,
): Readonly<Record<Id, string>> {
  const byId = new Map(entries);

  return Object.fromEntries(
    ids.map((id) => {
      const text = byId.get(id);

      if (text === undefined) throw new Error(`No ${what} for ${id}`);

      return [id, text];
    }),
  ) as Record<Id, string>;
}

/** The title over each category's indicators, on the widgets page and in the picker. */
export const INDICATOR_CATEGORY_TITLES = textById(
  ['context', 'historic', 'future'] as const satisfies readonly IndicatorCategoryId[],
  METADATA.indicator_categories.map(({ id, name }) => [id, name]),
  'title for indicator category',
);

/** The parcel legend's footnote: which season the crop textures read. */
export const PARCEL_LEGEND_NOTE = METADATA.parcels.legend_note;

/** The parcel legend's rows by id; their swatches are the front end's. */
export const PARCEL_LEGEND_LABELS = textById(
  ['selection', 'soja', 'arroz'] as const,
  METADATA.parcels.legend_items.map(({ id, label }) => [id, label]),
  'parcel legend label',
);

/** Sanitario's disease-index bands, low to high. */
export const RISK_CLASS_METADATA = METADATA.risk_classes.map(({ label, color }) => ({
  label,
  tone: colorTone(color),
}));

/** A general-info fact's name when Todas lists several values, by indicator id (lower case). */
export const INDICATOR_PLURAL_NAMES: Readonly<Record<string, string>> =
  METADATA.indicator_plural_names;

/** Each crop's name by the API's id, and the "every crop" option's label. */
export const CROP_NAMES = textById(
  ['soja', 'rice'] as const,
  METADATA.crops.options.map(({ id, name }) => [id, name]),
  'crop name',
);
export const ALL_CROPS_LABEL = METADATA.crops.all_label;

/** The projection chart's copy: its title, its picker row, its base point and horizons. */
export const PROJECTION_TEXT = {
  title: METADATA.projection.title,
  pickerName: METADATA.projection.picker_name,
  baselineLabel: METADATA.projection.baseline_label,
  horizons: METADATA.projection.horizons.map(({ id, name }) => ({ key: id, label: name })),
};

/** The printed report's attribution lead and area row label. */
export const REPORT_TEXT = {
  attributionLead: METADATA.report.attribution_lead,
  hectaresLabel: METADATA.report.hectares_label,
};

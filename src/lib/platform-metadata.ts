import { z } from 'zod';

import metadata from '@/content/platform-metadata.json';

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

const platformMetadataSchema = z.object({
  analysis_types: z.array(analysisTypeSchema),
  parcels: z.object({ legend_note: z.string().nullable() }),
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

/** The parcel legend's footnote: which season the crop textures read. */
export const PARCEL_LEGEND_NOTE = METADATA.parcels.legend_note;

import { normalizeUnknown } from '@/lib/upload/normalize';
import { UploadError, type ParseOutcome, type UploadWarning } from '@/lib/upload/types';

/**
 * Zipped shapefiles, via `shpjs`: the one library where "a shapefile in EPSG:32721
 * (UTM 21S — the likely projection for Paraguay) becomes WGS84 polygons" is a single
 * call, because it bundles the zip handling and proj4 reprojection.
 *
 * The zip's file listing is inspected with fflate first, because shpjs's result cannot
 * say what was missing: no `.shp` is a hard error, while missing `.dbf` (names) and
 * missing `.prj` (projection) degrade with a warning. Without a `.prj` shpjs assumes
 * WGS84 and the Paraguay check in `normalize.ts` is what catches projected coordinates.
 *
 * Both libraries load lazily so the ~80 kB of shpjs+proj4 never reaches the main
 * bundle.
 */
export async function parseShapefile(buffer: ArrayBuffer): Promise<ParseOutcome> {
  const [{ unzipSync }, { default: shp }] = await Promise.all([import('fflate'), import('shpjs')]);

  let entryNames: string[];

  try {
    entryNames = Object.keys(unzipSync(new Uint8Array(buffer)));
  } catch {
    throw new UploadError('unreadable', 'No se pudo leer el archivo como archivo zip.');
  }

  const has = (extension: string) =>
    entryNames.some((name) => name.toLowerCase().endsWith(extension));

  if (!has('.shp')) {
    throw new UploadError(
      'unreadable',
      'El zip no contiene ningún archivo .shp — no es un shapefile comprimido.',
    );
  }

  const warnings: UploadWarning[] = [];

  if (!has('.dbf')) {
    warnings.push({
      message:
        'No se encontró la tabla de atributos (.dbf) — los polígonos se nombraron automáticamente.',
    });
  }

  const missingPrj = !has('.prj');

  let result: Awaited<ReturnType<typeof shp>>;

  try {
    result = await shp(buffer);
  } catch {
    throw new UploadError(
      'unreadable',
      'No se pudo leer el shapefile — su contenido o sistema de coordenadas puede no ser compatible.',
    );
  }

  // A zip holding several .shp files yields an array of collections; flatten and say so,
  // since their attribute schemas may differ.
  const collections = Array.isArray(result) ? result : [result];

  if (collections.length > 1) {
    warnings.push({
      message: `El zip contiene ${collections.length} shapefiles; sus entidades se combinaron.`,
    });
  }

  const merged = {
    type: 'FeatureCollection',
    features: collections.flatMap((collection) => collection.features),
  };

  const outcome = normalizeUnknown(merged, 'un shapefile');

  if (missingPrj) {
    warnings.push({
      message: 'El shapefile no tiene archivo .prj — se asumieron coordenadas WGS84.',
    });
  }

  return { features: outcome.features, warnings: [...warnings, ...outcome.warnings] };
}

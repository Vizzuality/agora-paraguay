import { parseGeoJson } from '@/lib/upload/parse-geojson';
import { parseKmlText, parseKmz } from '@/lib/upload/parse-kml';
import { parseShapefile } from '@/lib/upload/parse-shapefile';
import { MAX_UPLOAD_BYTES, UploadError, type ParseOutcome } from '@/lib/upload/types';

/** What the hidden file input advertises. Must match the dispatch below. */
export const UPLOAD_ACCEPT = '.zip,.kml,.kmz,.geojson,.json';

/**
 * The upload pipeline's single entry point: size cap, extension dispatch, and the
 * read of the file's contents. Everything it throws is an `UploadError` with a
 * user-facing message.
 *
 * Dispatch is by extension — a mislabelled file fails with its claimed format's error
 * rather than a hint, which is judged acceptable for three formats over sniffing
 * magic bytes.
 */
export async function parseUploadFile(file: File): Promise<ParseOutcome> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError(
      'too-large',
      `El archivo supera los ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`,
    );
  }

  const extension = file.name.toLowerCase().split('.').pop() ?? '';

  switch (extension) {
    case 'geojson':
    case 'json':
      return parseGeoJson(await file.text());

    case 'kml':
      return parseKmlText(await file.text());

    case 'kmz':
      return parseKmz(await file.arrayBuffer());

    case 'zip':
      return parseShapefile(await file.arrayBuffer());

    default:
      throw new UploadError(
        'unsupported-type',
        'Tipo de archivo no compatible. Sube un shapefile comprimido (.zip), KML/KMZ o GeoJSON.',
      );
  }
}

import { normalizeUnknown } from "@/lib/upload/normalize";
import { UploadError, type ParseOutcome } from "@/lib/upload/types";

/**
 * KML and KMZ, via `@tmcw/togeojson` — which extracts `<name>` into `properties.name`,
 * exactly what the polygon list displays. KML is WGS84 by spec, so no CRS handling.
 *
 * Parsing leans on the browser's `DOMParser`, so this must only run client-side. The
 * libraries themselves are loaded lazily inside the functions, so Vite splits them out
 * of the main bundle and non-uploaders never download them.
 */
export async function parseKmlText(text: string): Promise<ParseOutcome> {
  const { kml } = await import("@tmcw/togeojson");

  const doc = new DOMParser().parseFromString(text, "text/xml");

  // DOMParser reports XML errors as a document containing <parsererror>, not by throwing.
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new UploadError("unreadable", "No se pudo leer el archivo como KML.");
  }

  return normalizeUnknown(kml(doc), "KML");
}

export async function parseKmz(buffer: ArrayBuffer): Promise<ParseOutcome> {
  const { unzipSync } = await import("fflate");

  let entries: Record<string, Uint8Array>;

  try {
    entries = unzipSync(new Uint8Array(buffer));
  } catch {
    throw new UploadError("unreadable", "No se pudo leer el archivo como archivo KMZ.");
  }

  // Finder-zipped archives carry AppleDouble copies (`__MACOSX/._x.kml`) whose payload
  // is a resource fork, not KML — counting or reading them breaks valid files.
  const kmlNames = Object.keys(entries).filter((name) => {
    if (name.startsWith("__MACOSX/")) return false;
    if ((name.split("/").at(-1) ?? name).startsWith("._")) return false;

    return name.toLowerCase().endsWith(".kml");
  });
  // The spec says the main document is `doc.kml`; fall back to whatever KML is there.
  const chosen = kmlNames.find((name) => name.toLowerCase() === "doc.kml") ?? kmlNames[0];

  if (chosen === undefined) {
    throw new UploadError("unreadable", "El archivo KMZ no contiene ningún documento KML.");
  }

  const outcome = await parseKmlText(new TextDecoder().decode(entries[chosen]));

  if (kmlNames.length > 1) {
    outcome.warnings.push({
      message: `El KMZ contiene ${kmlNames.length} documentos KML; solo se leyó "${chosen}".`,
    });
  }

  return outcome;
}

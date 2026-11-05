import { MAX_UNZIPPED_BYTES, UploadError } from '@/lib/upload/types';

/** One file in a zip, as its central directory declares it. */
export type ZipEntry = { name: string; size: number };

/**
 * The zip's file list with each entry's declared uncompressed size, read from the
 * directory without inflating anything. Throws `UploadError('unreadable')` on a corrupt
 * archive; `unreadableMessage` names the format the user picked.
 */
export async function listZipEntries(
  buffer: ArrayBuffer,
  unreadableMessage: string,
): Promise<ZipEntry[]> {
  const { unzipSync } = await import('fflate');
  const entries: ZipEntry[] = [];

  try {
    unzipSync(new Uint8Array(buffer), {
      filter: (file) => {
        entries.push({ name: file.name, size: file.originalSize });

        return false;
      },
    });
  } catch {
    throw new UploadError('unreadable', unreadableMessage);
  }

  return entries;
}

/**
 * Rejects an archive that would inflate past `max` — a zip bomb fits under the upload
 * cap and expands to gigabytes on the main thread. Sizes are the declared ones; fflate
 * sizes its output buffers from them, so a lying entry cannot grow past its declaration.
 */
export function assertUnzippedSize(entries: ZipEntry[], max = MAX_UNZIPPED_BYTES): void {
  const total = entries.reduce((sum, entry) => sum + entry.size, 0);

  if (total > max) {
    throw new UploadError(
      'too-large',
      `El archivo descomprimido supera los ${Math.round(max / 1024 / 1024)} MB.`,
    );
  }
}

/** Inflates the one entry named `name`; every other entry is skipped. */
export async function readZipEntry(buffer: ArrayBuffer, name: string): Promise<Uint8Array> {
  const { unzipSync } = await import('fflate');
  const entry = unzipSync(new Uint8Array(buffer), { filter: (file) => file.name === name })[name];

  if (entry === undefined) {
    throw new UploadError('unreadable', `No se pudo leer "${name}" del archivo comprimido.`);
  }

  return entry;
}

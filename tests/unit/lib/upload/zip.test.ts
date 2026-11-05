import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';

import { UploadError } from '@/lib/upload/types';
import { assertUnzippedSize, listZipEntries, readZipEntry } from '@/lib/upload/zip';

function zip(files: Record<string, Uint8Array>): ArrayBuffer {
  const bytes = zipSync(files);

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

describe('listZipEntries', () => {
  it('lists every entry with its declared uncompressed size', async () => {
    const archive = zip({ 'doc.kml': strToU8('<kml/>'), 'big.bin': new Uint8Array(50_000) });

    await expect(listZipEntries(archive, 'unreadable')).resolves.toEqual([
      { name: 'doc.kml', size: 6 },
      { name: 'big.bin', size: 50_000 },
    ]);
  });

  it('turns a corrupt archive into an unreadable UploadError with the given message', async () => {
    const error = await listZipEntries(strToU8('not a zip').buffer, 'No es un zip.').catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(UploadError);
    expect(error).toMatchObject({ code: 'unreadable', message: 'No es un zip.' });
  });
});

describe('assertUnzippedSize', () => {
  it('accepts an archive whose entries add up to the cap', () => {
    expect(() =>
      assertUnzippedSize(
        [
          { name: 'a', size: 60 },
          { name: 'b', size: 40 },
        ],
        100,
      ),
    ).not.toThrow();
  });

  it('rejects an archive that inflates past the cap as too-large', () => {
    expect(() =>
      assertUnzippedSize(
        [
          { name: 'a', size: 60 },
          { name: 'b', size: 41 },
        ],
        100,
      ),
    ).toThrow(expect.objectContaining({ code: 'too-large' }));
  });

  it('rejects a compression bomb: tiny on disk, huge declared', async () => {
    const archive = zip({ 'zeros.bin': new Uint8Array(2 * 1024 * 1024) });

    expect(archive.byteLength).toBeLessThan(10 * 1024);
    expect(() =>
      assertUnzippedSize([{ name: 'zeros.bin', size: 2 * 1024 * 1024 }], 1024 * 1024),
    ).toThrow(expect.objectContaining({ code: 'too-large' }));
    await expect(listZipEntries(archive, 'unreadable')).resolves.toEqual([
      { name: 'zeros.bin', size: 2 * 1024 * 1024 },
    ]);
  });
});

describe('readZipEntry', () => {
  it('inflates only the named entry', async () => {
    const archive = zip({ 'doc.kml': strToU8('<kml/>'), 'other.kml': strToU8('<x/>') });

    expect(new TextDecoder().decode(await readZipEntry(archive, 'doc.kml'))).toBe('<kml/>');
  });

  it('throws unreadable when the entry is missing', async () => {
    const archive = zip({ 'doc.kml': strToU8('<kml/>') });

    await expect(readZipEntry(archive, 'missing.kml')).rejects.toMatchObject({
      code: 'unreadable',
    });
  });
});

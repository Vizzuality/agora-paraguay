import { useSetAtom } from 'jotai';
import type { ChangeEvent } from 'react';

import { parseUploadFile } from '@/lib/upload/parse-file';
import { UploadError } from '@/lib/upload/types';
import { failUploadAtom, uploadFeaturesAtom } from '@/store/upload';

/**
 * The file input's change handler: parses the picked file into areas on the map, or
 * records why it could not. Reads atoms, so callers render inside `<ClientOnly>`.
 */
export function useUploadFile() {
  const uploadFeatures = useSetAtom(uploadFeaturesAtom);
  const failUpload = useSetAtom(failUploadAtom);

  return async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    // Reset so picking the same file again still fires a change event.
    event.currentTarget.value = '';

    if (!file) return;

    try {
      const outcome = await parseUploadFile(file);

      uploadFeatures({ fileName: file.name, outcome });
    } catch (error) {
      const upload = error instanceof UploadError ? error : null;

      failUpload({
        fileName: file.name,
        error: upload?.message ?? 'No se pudo leer el archivo.',
        errorCode: upload?.code ?? null,
      });
    }
  };
}

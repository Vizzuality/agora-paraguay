import { useAtomValue, useSetAtom } from 'jotai';
import { X } from 'lucide-react';

import { ErrorToast, NO_PARCEL_INTERSECTION_MESSAGE } from '@/components/error-toast';
import { Button } from '@/components/ui/button';
import type { UploadResult } from '@/lib/upload/types';
import { drawAtom } from '@/store/draw';
import { uploadResultAtom } from '@/store/upload';

/** How many upload warnings are shown before collapsing into "and N more". */
const MAX_VISIBLE_WARNINGS = 5;

/**
 * What the panel says about the map and the last upload, in both steps: a live region
 * for screen readers plus the visible error toast or warning list. Separate from the
 * step-1 buttons so an import with warnings keeps its notice once the panel moves on
 * to step 2.
 */
export function UploadFeedback() {
  const draw = useAtomValue(drawAtom);
  const uploadResult = useAtomValue(uploadResultAtom);

  return (
    <>
      {/* Disabled buttons take no focus, so without this a screen reader user has no
          way to tell why the buttons are inert, or that an upload landed. */}
      <output aria-label="Estado de la selección" className="sr-only">
        {!draw.bound && 'El mapa todavía se está cargando.'}
        {uploadResult !== null && uploadStatus(uploadResult)}
      </output>

      <UploadNotices />
    </>
  );
}

function uploadStatus(result: UploadResult): string {
  if (result.error !== null) return `Error al subir: ${result.error}`;

  return result.accepted === 1
    ? `Se importó 1 área de ${result.fileName}.`
    : `Se importaron ${result.accepted} áreas de ${result.fileName}.`;
}

/** The visible counterpart of the live region: upload errors and per-polygon warnings. */
function UploadNotices() {
  const uploadResult = useAtomValue(uploadResultAtom);
  const setUploadResult = useSetAtom(uploadResultAtom);

  if (uploadResult === null) return null;
  if (uploadResult.error === null && uploadResult.warnings.length === 0) return null;

  if (uploadResult.error !== null) {
    const formatOrSize =
      uploadResult.errorCode === 'too-large' || uploadResult.errorCode === 'unsupported-type';

    return (
      <ErrorToast
        label="Avisos de subida"
        dismissLabel="Descartar los avisos de subida"
        onDismiss={() => setUploadResult(null)}
      >
        {formatOrSize ? (
          <FormatSizeHelp />
        ) : (
          <p>
            {uploadResult.errorCode === 'out-of-paraguay'
              ? NO_PARCEL_INTERSECTION_MESSAGE
              : uploadResult.error}
          </p>
        )}
      </ErrorToast>
    );
  }

  const visible = uploadResult.warnings.slice(0, MAX_VISIBLE_WARNINGS);
  const hidden = uploadResult.warnings.length - visible.length;

  return (
    <section
      aria-label="Avisos de subida"
      className="flex flex-col gap-1 rounded-lg border bg-muted/50 p-3 text-sm"
    >
      <header className="flex items-start justify-between gap-2">
        <p className="font-medium">{`Se importó ${uploadResult.fileName} con advertencias:`}</p>
        <Button
          variant="ghost"
          size="icon"
          className="-mt-1 -mr-1 size-6 shrink-0"
          onClick={() => setUploadResult(null)}
          aria-label="Descartar los avisos de subida"
        >
          <X />
        </Button>
      </header>

      {visible.length > 0 && (
        <ul className="flex list-disc flex-col gap-1 pl-4 text-muted-foreground">
          {visible.map((warning) => (
            <li key={warning.message}>{warning.message}</li>
          ))}
          {hidden > 0 && <li>y {hidden} más.</li>}
        </ul>
      )}
    </section>
  );
}

function FormatSizeHelp() {
  return (
    <>
      <p>
        Tamaño máximo recomendado: 10 MB. Los archivos más grandes pueden no funcionar
        correctamente.
      </p>
      <p>
        Formatos compatibles: .csv (debe contener una columna "geom" con información geográfica),
        .geojson, .kml, .kmz, .wkt, .shp (deben incluirse los archivos .shp, .shx, .dbf y .prj)
      </p>
    </>
  );
}

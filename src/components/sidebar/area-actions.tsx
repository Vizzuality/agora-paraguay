import { useAtomValue, useSetAtom } from 'jotai';
import { SquarePen, Upload, X } from 'lucide-react';
import { useRef, type ChangeEvent } from 'react';

import { ErrorToast, NO_PARCEL_INTERSECTION_MESSAGE } from '@/components/error-toast';
import { Button } from '@/components/ui/button';
import { parseUploadFile, UPLOAD_ACCEPT } from '@/lib/upload/parse-file';
import { UploadError, type UploadResult } from '@/lib/upload/types';
import { cn } from '@/lib/utils';
import { drawAtom, setDrawToolAtom, startDrawAtom } from '@/store/draw';
import { modeAtom } from '@/store/mode';
import { failUploadAtom, uploadFeaturesAtom, uploadResultAtom } from '@/store/upload';

/** How many upload warnings are shown before collapsing into "and N more". */
const MAX_VISIBLE_WARNINGS = 5;

/**
 * The two entry points into an areas-of-interest session, in the panel: draw a polygon
 * or upload a file of them. The third entry point — clicking cadastral parcels — lives
 * on the map itself. Editing what is on the map (select, delete, clear) stays in
 * `DrawControls`, next to the geometry it edits.
 *
 * Rendered inside `<ClientOnly>`: it reads the draw atoms.
 */
export function AreaActions() {
  const draw = useAtomValue(drawAtom);
  const mode = useAtomValue(modeAtom);
  const uploadResult = useAtomValue(uploadResultAtom);
  const setTool = useSetAtom(setDrawToolAtom);
  const startDraw = useSetAtom(startDrawAtom);
  const uploadFeatures = useSetAtom(uploadFeaturesAtom);
  const failUpload = useSetAtom(failUploadAtom);
  const inputRef = useRef<HTMLInputElement>(null);

  // `startAnalysisAtom` parks the tool, so the tool check alone would do — the
  // explicit conjunction documents the rule: drawing is a selection-mode activity.
  const drawing = mode === 'selection' && draw.tool === 'draw';

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
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

  return (
    <section className="flex flex-col gap-3">
      <fieldset className="grid grid-cols-2 gap-1.5">
        <legend className="sr-only">Seleccionar parcelas para análisis</legend>

        <Button
          variant="secondary"
          className="h-auto flex-col gap-2.5 rounded-3xl border-[3px] border-secondary p-8 font-normal text-accent-foreground aria-pressed:border-primary"
          // Activation clears the map — a draw session always starts from scratch.
          onClick={() => (drawing ? setTool(null) : startDraw())}
          aria-pressed={drawing}
          disabled={!draw.bound}
        >
          <SquarePen aria-hidden className="size-10" strokeWidth={1.5} />
          {drawing ? 'Cancelar' : 'Dibujar polígono'}
        </Button>

        <Button
          variant="secondary"
          // The entry point that caused the showing error carries a destructive border.
          // Draw gets the same treatment once a draw-triggered error exists (the
          // no-parcel-intersection check waits on the API).
          className={cn(
            'h-auto flex-col gap-2.5 rounded-3xl border-[3px] border-secondary p-8 font-normal text-accent-foreground',
            uploadResult?.error != null && 'border-destructive',
          )}
          onClick={() => inputRef.current?.click()}
          disabled={!draw.bound}
        >
          <Upload aria-hidden className="size-10" strokeWidth={1.5} />
          Subir archivo
        </Button>

        {/* The file input is a real element rather than a programmatic picker:
            Playwright's `setInputFiles` and screen readers both need one in the DOM.
            It stays visually hidden and out of the tab order. */}
        <input
          ref={inputRef}
          type="file"
          accept={UPLOAD_ACCEPT}
          onChange={(event) => void handleChange(event)}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />

        {/* Disabled buttons take no focus, so without this a screen reader user has no
            way to tell why the buttons are inert, or that an upload landed. */}
        <p aria-live="polite" className="sr-only">
          {!draw.bound && 'El mapa todavía se está cargando.'}
          {uploadResult !== null && uploadStatus(uploadResult)}
        </p>
      </fieldset>

      <UploadNotices />
    </section>
  );
}

// TO - DO - remove (+tests)
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

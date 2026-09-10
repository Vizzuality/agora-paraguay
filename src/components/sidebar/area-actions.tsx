import { useAtomValue, useSetAtom } from 'jotai';
import { SquarePen, Upload } from 'lucide-react';
import { useRef, type ChangeEvent } from 'react';

import { ActionCardButton } from '@/components/sidebar/action-card-button';
import { parseUploadFile, UPLOAD_ACCEPT } from '@/lib/upload/parse-file';
import { UploadError } from '@/lib/upload/types';
import { cn } from '@/lib/utils';
import { drawAtom, setDrawToolAtom, startDrawAtom } from '@/store/draw';
import { modeAtom } from '@/store/mode';
import { failUploadAtom, uploadFeaturesAtom, uploadResultAtom } from '@/store/upload';

/**
 * Step 1 of the selection: the two ways to bring an área de interés onto the map —
 * upload a file of polygons or draw one. The third entry point, clicking cadastral
 * parcels, lives on the map itself. Upload outcomes are reported by `UploadFeedback`,
 * which outlives this component into step 2.
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
    <fieldset className="grid grid-cols-2 gap-1.5">
      <legend className="sr-only">Seleccionar parcelas para análisis</legend>

      <ActionCardButton
        icon={Upload}
        // The entry point that caused the showing error carries a destructive border.
        className={cn(uploadResult?.error != null && 'border-destructive')}
        onClick={() => inputRef.current?.click()}
        disabled={!draw.bound}
      >
        Subir archivo
      </ActionCardButton>

      <ActionCardButton
        icon={SquarePen}
        className="aria-pressed:border-primary aria-pressed:text-primary"
        // Activation clears the map — a draw session always starts from scratch.
        onClick={() => (drawing ? setTool(null) : startDraw())}
        aria-pressed={drawing}
        disabled={!draw.bound}
      >
        {drawing ? 'Cancelar' : 'Dibujar polígono'}
      </ActionCardButton>

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
    </fieldset>
  );
}

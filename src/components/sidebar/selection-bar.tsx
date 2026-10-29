import { useAtomValue } from 'jotai';

import { AreaActions } from '@/components/sidebar/area-actions';
import { ConfirmActions } from '@/components/sidebar/confirm-actions';
import { UploadFeedback } from '@/components/sidebar/upload-feedback';
import { selectionStepAtom } from '@/store/selection';

/**
 * The phone's row under the map, standing in for the hidden panel: step 2's entry
 * points while a polygon is traced (Subir archivo / Cancelar), step 3's Reiniciar /
 * Analizar once areas are in. The upload feedback comes
 * along so a file picked from here still reports. Rendered inside `<ClientOnly>`.
 */
export function SelectionBar() {
  const step = useAtomValue(selectionStepAtom);

  return (
    <div className="flex shrink-0 flex-col gap-2 bg-background p-2">
      <UploadFeedback />
      {step === 3 ? <ConfirmActions layout="bar" /> : <AreaActions layout="bar" />}
    </div>
  );
}

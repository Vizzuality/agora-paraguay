import { useAtomValue, useSetAtom } from 'jotai';
import { CircleArrowRight, LayoutGrid, SquarePen, Undo2, Upload } from 'lucide-react';
import { useId, useRef } from 'react';

import {
  NO_PARCEL_INTERSECTION_MESSAGE,
  PARCELS_REQUEST_FAILED_MESSAGE,
} from '@/components/error-toast';
import { AnalysedParcelsLayers } from '@/components/map/analysed-parcels-layers';
import { PanelMap } from '@/components/map/panel-map';
import { SettingCardButton } from '@/components/settings/setting-card';
import { UploadFeedback } from '@/components/sidebar/upload-feedback';
import { Button } from '@/components/ui/button';
import { FLOATING_FIELD_CLASS, FloatingLabel } from '@/components/ui/floating-label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { parcelLabel } from '@/lib/analysis/parcel-label';
import { selectionStep } from '@/lib/selection-steps';
import { UPLOAD_ACCEPT } from '@/lib/upload/parse-file';
import { useUploadFile } from '@/lib/upload/use-upload-file';
import { useConfirmedParcels } from '@/lib/use-confirmed-parcels';
import { cn } from '@/lib/utils';
import { activeParcelIdAtom, activeParcelTabAtom, analysedParcelIdsAtom } from '@/store/analysis';
import { drawAtom, restartSelectionAtom, startDrawAtom } from '@/store/draw';
import { analysedViewAtom, backToSelectionAtom, startAnalysisAtom } from '@/store/mode';
import { areaRejectionAtom } from '@/store/selection';
import { uploadResultAtom } from '@/store/upload';

/** What the closed heading says: the open parcel once analysed, nothing before. */
export function useAreaSelectionLabel(): string | undefined {
  const analysed = useAtomValue(analysedViewAtom);
  const parcels = useAtomValue(analysedParcelIdsAtom);
  const activeId = useAtomValue(activeParcelIdAtom);

  if (!analysed) return undefined;

  return activeId === null ? 'Todas' : parcelLabel(activeId, parcels);
}

/**
 * Área de interés: building the selection (upload or draw, then Reiniciar / Analizar,
 * the map in the content column), or, once analysed, the parcel picker, Todas, Nuevo análisis
 * and the mini map. Reads atoms: render inside `<ClientOnly>`.
 */
export function AreaSetting() {
  return useAtomValue(analysedViewAtom) ? <AnalysedArea /> : <SelectingArea />;
}

const DESCRIPTION = {
  area: 'Suba un archivo con su área de interés o dibuje un polígono en el mapa para visualizar las parcelas disponibles.',
  confirm:
    'Verifique que estas son las parcelas que desea y pulse Analizar. Use el mapa para seleccionar y deseleccionar parcelas.',
};

function SelectingArea() {
  const draw = useAtomValue(drawAtom);
  // The type is the route here, so the selection never sits on step 1.
  const step = selectionStep({
    analysisType: 'sanitario',
    areaCount: draw.polygons.length,
    drawing: draw.tool === 'draw',
  });

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {step === 3 ? DESCRIPTION.confirm : DESCRIPTION.area}
      </p>
      {step === 3 ? <ConfirmCards /> : <AreaCards />}
      <UploadFeedback />
    </>
  );
}

/** Subir archivo and Dibujar polígono; while drawing, Borrar mapa and the how-to. */
function AreaCards() {
  const draw = useAtomValue(drawAtom);
  const uploadResult = useAtomValue(uploadResultAtom);
  const rejection = useAtomValue(areaRejectionAtom);
  const setRejection = useSetAtom(areaRejectionAtom);
  const startDraw = useSetAtom(startDrawAtom);
  const restart = useSetAtom(restartSelectionAtom);
  const handleChange = useUploadFile();
  const inputRef = useRef<HTMLInputElement>(null);
  const drawing = draw.tool === 'draw';
  const uploadFailed = uploadResult?.error != null || rejection?.source === 'upload';

  return (
    <>
      <fieldset className="grid grid-cols-2 gap-1.5">
        <legend className="sr-only">Seleccionar parcelas para análisis</legend>

        <SettingCardButton
          icon={Upload}
          // The entry point behind the showing error stays outlined, as the design does.
          active={uploadFailed}
          disabled={!draw.bound}
          onClick={() => {
            setRejection(null);
            inputRef.current?.click();
          }}
        >
          Subir archivo
        </SettingCardButton>

        <SettingCardButton
          icon={SquarePen}
          active={drawing}
          aria-pressed={drawing}
          disabled={!draw.bound}
          // A drawing session starts from scratch; Borrar mapa clears it and disarms.
          onClick={() => (drawing ? restart() : startDraw())}
        >
          {drawing ? 'Borrar mapa' : 'Dibujar polígono'}
        </SettingCardButton>

        {/* A real input, so Playwright's `setInputFiles` and screen readers find it. */}
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

      {drawing && uploadResult?.error == null && (
        <p className="text-sm text-muted-foreground">
          Haga clic para comenzar el polígono, luego haga clic para añadir cada vértice. Termine
          haciendo clic en el punto de inicio, haciendo doble clic o pulsando Enter.
        </p>
      )}
    </>
  );
}

/** Reiniciar or Analizar the parcels the areas selected; Analizar stays an explicit step. */
function ConfirmCards() {
  const { parcelIds, isError, noIntersection } = useConfirmedParcels();
  const restart = useSetAtom(restartSelectionAtom);
  const startAnalysis = useSetAtom(startAnalysisAtom);

  return (
    <div aria-live="polite" className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-1.5">
        <SettingCardButton icon={Undo2} onClick={() => restart()}>
          Reiniciar
        </SettingCardButton>
        <SettingCardButton
          icon={CircleArrowRight}
          primary
          disabled={parcelIds.length === 0}
          onClick={() => startAnalysis(parcelIds)}
        >
          Analizar
        </SettingCardButton>
      </div>

      {isError && <p className="text-sm text-destructive">{PARCELS_REQUEST_FAILED_MESSAGE}</p>}
      {noIntersection && (
        <p className="text-sm text-destructive">{NO_PARCEL_INTERSECTION_MESSAGE}</p>
      )}
    </div>
  );
}

/** An área action: icon left of its label, 48px tall, as the setting cards' row form. */
const AREA_ACTION_CLASS =
  'h-12 gap-2.5 rounded-2xl px-8 font-normal max-md:px-4 [&_svg:not([class*=size-])]:size-6';

/** Once analysed: which parcel the page reads, Todas, Nuevo análisis, the mini map. */
function AnalysedArea() {
  const parcels = useAtomValue(analysedParcelIdsAtom);
  const activeId = useAtomValue(activeParcelIdAtom);
  const setActiveTab = useSetAtom(activeParcelTabAtom);
  const backToSelection = useSetAtom(backToSelectionAtom);
  const all = activeId === null;

  return (
    <>
      {/* The report names the parcel in the heading instead (`SettingsSection`). */}
      <div className="flex items-end gap-3 pt-2 print:hidden">
        <ParcelSelect />
        {parcels.length > 1 && (
          <Button
            variant="secondary"
            aria-pressed={all}
            className={cn(
              AREA_ACTION_CLASS,
              'text-primary',
              all ? 'border-3 border-primary' : 'border border-border',
            )}
            onClick={() => setActiveTab(null)}
          >
            <LayoutGrid aria-hidden strokeWidth={1.5} />
            Todas
          </Button>
        )}
        <Button className={AREA_ACTION_CLASS} onClick={() => backToSelection()}>
          <SquarePen aria-hidden strokeWidth={1.5} />
          Nuevo análisis
        </Button>
      </div>

      {/* Edge to edge under the controls, as the design bleeds it to the card's corners. */}
      <div className="relative -mx-6 -mb-6 h-70 overflow-hidden rounded-3xl bg-muted print:h-120 paper:h-120">
        <PanelMap>
          <AnalysedParcelsLayers />
        </PanelMap>
      </div>
    </>
  );
}

/** Parcela: each analysed parcel, as "Parcela N"; under Todas nothing is picked and the label rests in the field. */
function ParcelSelect() {
  const parcels = useAtomValue(analysedParcelIdsAtom);
  const activeId = useAtomValue(activeParcelIdAtom);
  const setActiveTab = useSetAtom(activeParcelTabAtom);
  const id = useId();

  return (
    <div className="relative min-w-0 flex-1">
      <Select
        // Todas is the button beside the picker: here it is no value at all.
        value={activeId ?? ''}
        onValueChange={(value) => setActiveTab(value)}
        disabled={parcels.length === 1}
      >
        <SelectTrigger id={id} className={cn(FLOATING_FIELD_CLASS, 'data-[size=default]:h-12')}>
          <SelectValue />
        </SelectTrigger>
        <FloatingLabel htmlFor={id}>Parcela</FloatingLabel>
        <SelectContent>
          {parcels.map((parcel) => (
            <SelectItem key={parcel} value={parcel}>
              {parcelLabel(parcel, parcels)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

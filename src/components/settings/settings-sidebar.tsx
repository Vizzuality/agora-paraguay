import { useAtomValue } from 'jotai';
import { useState } from 'react';

import {
  AnalysisTypeSetting,
  useCurrentAnalysisType,
} from '@/components/settings/analysis-type-setting';
import { AreaSetting, useAreaSelectionLabel } from '@/components/settings/area-setting';
import { CropDatesSetting, useCropDatesLabel } from '@/components/settings/crop-dates-setting';
import { SettingsSection } from '@/components/settings/settings-section';
import type { Riesgo } from '@/lib/api/metadata/schemas';
import { analysedViewAtom } from '@/store/mode';

type SectionKey = 'analysisType' | 'area' | 'cropDates';

/**
 * The redesign's settings column, one section open at a time: the analysis type, then
 * on a riesgo the área de interés, open to start with since that is where the work is.
 * Reads atoms: render inside `<ClientOnly>`.
 */
export function SettingsSidebar() {
  const current = useCurrentAnalysisType();

  // Keyed by the type, so moving onto a riesgo opens its área de interés afresh.
  return <Sections key={String(current?.to)} />;
}

function Sections() {
  const current = useCurrentAnalysisType();
  const parcelAnalysis = current?.riesgo !== undefined;
  const [open, setOpen] = useState<SectionKey | null>(parcelAnalysis ? 'area' : null);
  const areaLabel = useAreaSelectionLabel();
  const analysed = useAtomValue(analysedViewAtom);
  const toggle = (key: SectionKey) => setOpen((value) => (value === key ? null : key));

  return (
    <>
      <SettingsSection
        name="Tipo de análisis"
        selection={current?.label}
        open={open === 'analysisType'}
        onToggle={() => toggle('analysisType')}
      >
        <AnalysisTypeSetting onChoose={() => setOpen(null)} />
      </SettingsSection>

      {current?.riesgo && (
        <SettingsSection
          name="Área de interés"
          selection={areaLabel}
          open={open === 'area'}
          onToggle={() => toggle('area')}
        >
          <AreaSetting />
        </SettingsSection>
      )}

      {/* The filters apply to an analysis: none to set before Analizar. */}
      {current?.riesgo && analysed && (
        <CropDatesSection
          riesgo={current.riesgo}
          open={open === 'cropDates'}
          onToggle={() => toggle('cropDates')}
        />
      )}
    </>
  );
}

/** Its own component: the filter query runs only while the section is on screen. */
function CropDatesSection({
  riesgo,
  open,
  onToggle,
}: Readonly<{ riesgo: Riesgo; open: boolean; onToggle: () => void }>) {
  const label = useCropDatesLabel(riesgo);

  return (
    <SettingsSection name="Cultivo y fechas" selection={label} open={open} onToggle={onToggle}>
      <CropDatesSetting riesgo={riesgo} />
    </SettingsSection>
  );
}

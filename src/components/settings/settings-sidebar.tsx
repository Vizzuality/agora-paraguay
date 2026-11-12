import { useState } from 'react';

import {
  AnalysisTypeSetting,
  useCurrentAnalysisType,
} from '@/components/settings/analysis-type-setting';
import { AreaSetting, useAreaSelectionLabel } from '@/components/settings/area-setting';
import { SettingsSection } from '@/components/settings/settings-section';

type SectionKey = 'tipo' | 'area';

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
  const toggle = (key: SectionKey) => setOpen((value) => (value === key ? null : key));

  return (
    <>
      <SettingsSection
        name="Tipo de análisis"
        selection={current?.label}
        open={open === 'tipo'}
        onToggle={() => toggle('tipo')}
      >
        <AnalysisTypeSetting onChoose={() => setOpen(null)} />
      </SettingsSection>

      {parcelAnalysis && (
        <SettingsSection
          name="Área de interés"
          selection={areaLabel}
          open={open === 'area'}
          onToggle={() => toggle('area')}
        >
          <AreaSetting />
        </SettingsSection>
      )}
    </>
  );
}

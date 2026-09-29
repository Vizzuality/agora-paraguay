import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';

import { AnalysisHeader } from '@/components/analysis-header';
import { AnalysisStatus } from '@/components/analysis-status';
import { GeneralInfoCard } from '@/components/general-info-card';
import { RiskClassCard } from '@/components/risk-class-card';
import { WidgetGrid } from '@/components/widget-grid';
import { combinedParcel, generalInfo, indicatorCards } from '@/lib/analysis/indicator-cards';
import { selectableIndicators, visibleIndicators } from '@/lib/analysis/indicator-picker';
import { useAnalysis } from '@/lib/analysis/use-analysis';
import { activeParcelIdAtom, selectedIndicatorIdsAtom } from '@/store/analysis';

/** Riesgo sanitario is public: hero, title row and the cards, no gate. */
export const Route = createFileRoute('/analisis/sanitario')({
  component: SanitarioPage,
});

function SanitarioPage() {
  return (
    <>
      <ClientOnly>
        <AnalysisHeader riesgo="sanitario" />
      </ClientOnly>

      <ClientOnly fallback={<WidgetGrid />}>
        <SanitarioWidgets />
      </ClientOnly>
    </>
  );
}

/**
 * The active parcel tab's indicators — its text facts in the general-info card, then one
 * risk card per selected measured indicator. Cards are per parcel; the Todas tab shows
 * the same cards over the parcels combined (`combinedParcel`). The active parcel is the
 * hero's open tab (`activeParcelIdAtom`); the answer is matched by id, since the backend
 * need not echo the parcels in request order. Changing the picker or the hero filters
 * re-runs the analysis (`useAnalysis`); the previous cards stay until the new answer lands.
 */
function SanitarioWidgets() {
  const { analysis, indicators, indicatorsError, parcelIds } = useAnalysis('sanitario');
  const activeId = useAtomValue(activeParcelIdAtom);
  const selected = useAtomValue(selectedIndicatorIdsAtom);

  const answered = analysis.data?.indicators ?? [];
  const parcel =
    activeId === null
      ? combinedParcel(
          answered.filter((entry) => parcelIds.includes(String(entry.parcel_id))),
          indicators,
        )
      : answered.find((entry) => String(entry.parcel_id) === activeId);
  // General info is always on; the cards are the selected measured indicators (the API's
  // defaults until the user touches Personalizar indicadores).
  const info = generalInfo(parcel, indicators, 'sanitario');
  const shown = indicators
    ? visibleIndicators(selectableIndicators(indicators, 'sanitario'), selected)
    : undefined;
  const cards = indicatorCards(parcel, shown, 'sanitario');

  return (
    <div className="flex flex-col gap-4">
      <AnalysisStatus analysis={analysis} indicatorsError={indicatorsError} />
      {info.length > 0 && <GeneralInfoCard items={info} />}
      <WidgetGrid>
        {cards.map((card) => (
          <RiskClassCard key={card.id} {...card} />
        ))}
      </WidgetGrid>
    </div>
  );
}

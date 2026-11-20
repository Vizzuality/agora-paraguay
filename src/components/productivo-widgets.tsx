import type { ReactNode } from 'react';

import { AnalysisActions } from '@/components/analysis-actions';
import { AnalysisPanel } from '@/components/analysis-panel';
import { AnalysisStatus } from '@/components/analysis-status';
import { AnalysisWidgetCard } from '@/components/analysis-widget-card';
import { GeneralInfoCard } from '@/components/general-info-card';
import { ReportFooter } from '@/components/report-footer';
import { WidgetGrid } from '@/components/widget-grid';
import {
  CATEGORY_TITLES,
  widgetGroups,
  type AnalysisWidget,
} from '@/lib/analysis/analysis-widgets';
import { generalInfo } from '@/lib/analysis/indicator-cards';
import { useRiesgoWidgets } from '@/lib/analysis/use-riesgo-widgets';
import { cn } from '@/lib/utils';

/**
 * Riesgo productivo's analysis: the open tab's text facts in Información de contexto, then
 * the widgets (`useRiesgoWidgets`), restricted to what applies to the crop (`useApplicableIndicators`): under Todas a number bins every parcel's value and a
 * category counts them per class; on a parcel tab the number is that parcel's figure on
 * the same scale and the category reads its class on the ruler. Shared by
 * `/analisis/productivo` and the redesign. Reads atoms: render inside `<ClientOnly>`.
 *
 * Under Todas, Información de contexto is a titled section: the facts, then the context
 * widgets (`isContextIndicator`). On one parcel those widgets are facts, so the facts card
 * stands alone, titled in itself.
 */
export function ProductivoWidgets() {
  const { analysis, indicators, indicatorsError, parcel, scope, widgets, describe } =
    useRiesgoWidgets('productivo');

  const info = generalInfo(parcel, indicators, 'productivo', scope).map((row) => ({
    ...row,
    description: describe(row.description),
  }));
  const groups = widgetGroups(widgets, indicators, 'productivo');
  const context = groups.find((group) => group.key === 'context');
  const rest = groups.filter((group) => group !== context);
  const stacked = scope === 'multiple';

  return (
    // Fills the content column, so the first-run frame can take the height left.
    <div className="flex flex-1 flex-col gap-4">
      <AnalysisStatus analysis={analysis} indicatorsError={indicatorsError} />
      {/* Nothing to show before the first answer: no empty panel (and gap) under the frame. */}
      {analysis.data && (
        <AnalysisPanel busy={analysis.isPlaceholderData}>
          {scope === 'multiple' ? (
            <CategorySection title={CATEGORY_TITLES.context}>
              {info.length > 0 && <GeneralInfoCard items={info} titled={false} />}
              {context && <Widgets widgets={context.widgets} stacked={stacked} />}
            </CategorySection>
          ) : (
            info.length > 0 && <GeneralInfoCard items={info} />
          )}
          {/* One titled run per category: historic, then projected. */}
          {rest.map((group) => (
            <CategorySection
              key={group.key}
              title={group.title}
              // On paper the historic analysis opens a page of its own.
              newPage={group.key === 'historic'}
            >
              <Widgets widgets={group.widgets} stacked={stacked} />
            </CategorySection>
          ))}
        </AnalysisPanel>
      )}
      {analysis.data && <ReportFooter />}
      {analysis.data && <AnalysisActions riesgo="productivo" />}
    </div>
  );
}

/** A run of widgets under its uppercase title; untitled for the agnostic run. */
function CategorySection({
  title,
  newPage = false,
  children,
}: Readonly<{ title: string | null; newPage?: boolean; children: ReactNode }>) {
  return (
    <section
      aria-label={title ?? undefined}
      // 32px between categories: the panel's 16px gap plus this margin.
      className={cn('flex flex-col gap-4 not-first:mt-4', newPage && 'print:break-before-page')}
    >
      {title && (
        <h2 className="text-base leading-4 font-normal tracking-[0.28px] text-foreground uppercase">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

function Widgets({ widgets, stacked }: Readonly<{ widgets: AnalysisWidget[]; stacked: boolean }>) {
  return (
    <WidgetGrid stacked={stacked}>
      {widgets.map((widget) => (
        <AnalysisWidgetCard key={widget.id} widget={widget} />
      ))}
    </WidgetGrid>
  );
}

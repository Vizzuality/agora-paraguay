import { CategoryCountCard } from '@/components/category-count-card';
import { NumberGaugeCard } from '@/components/number-gauge-card';
import { ParcelValuesCard } from '@/components/parcel-values-card';
import { RiskClassCard } from '@/components/risk-class-card';
import { ValueHistogramCard } from '@/components/value-histogram-card';
import type { AnalysisWidget } from '@/lib/analysis/analysis-widgets';

/** The card a widget renders as, by its kind (`analysisWidgets`). */
export function AnalysisWidgetCard({ widget }: { widget: AnalysisWidget }) {
  switch (widget.kind) {
    case 'ruler':
      return <RiskClassCard {...widget} />;
    case 'parcel-list':
      return <ParcelValuesCard {...widget} />;
    case 'bar-chart':
      return <CategoryCountCard {...widget} />;
    case 'histogram':
      return <ValueHistogramCard {...widget} />;
    case 'gauge':
      return <NumberGaugeCard {...widget} />;
  }
}

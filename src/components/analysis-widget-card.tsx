import { CategoryCountCard } from '@/components/category-count-card';
import { NumberCard } from '@/components/number-card';
import { ProjectionCard } from '@/components/projection-card';
import { RiskClassCard } from '@/components/risk-class-card';
import { ValueHistogramCard } from '@/components/value-histogram-card';
import type { AnalysisWidget } from '@/lib/analysis/analysis-widgets';

/** The card a widget renders as, by its kind (`analysisWidgets`). */
export function AnalysisWidgetCard({ widget }: Readonly<{ widget: AnalysisWidget }>) {
  switch (widget.kind) {
    case 'ruler':
      return <RiskClassCard {...widget} />;
    case 'bar-chart':
      return <CategoryCountCard {...widget} />;
    case 'histogram':
      return <ValueHistogramCard {...widget} />;
    case 'number':
      return <NumberCard {...widget} />;
    case 'projection':
      // Across the row: three points over time need the width a single widget lacks.
      return <ProjectionCard {...widget} className="col-span-full" />;
  }
}

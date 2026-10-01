import { CategoryCountCard } from '@/components/category-count-card';
import { ParcelValuesCard } from '@/components/parcel-values-card';
import { RiskClassCard } from '@/components/risk-class-card';
import type { AnalysisTile } from '@/lib/analysis/analysis-tiles';

/** The card a tile renders as, by its kind (`analysisTiles`). */
export function AnalysisTileCard({ tile }: { tile: AnalysisTile }) {
  switch (tile.kind) {
    case 'risk-class':
      return <RiskClassCard {...tile} />;
    case 'parcel-values':
      return <ParcelValuesCard {...tile} />;
    case 'category-count':
      return <CategoryCountCard {...tile} />;
  }
}

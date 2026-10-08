import { CategoryBars } from '@/components/charts/category-bars';
import { WidgetCard, WidgetHeader } from '@/components/widget-card';
import type { CategoryCountWidget } from '@/lib/analysis/category-counts';

type CategoryCountCardProps = Omit<CategoryCountWidget, 'id'> & { className?: string };

/**
 * Widget counting the analysed parcels per category (the "Categorical multiple"
 * design): the indicator's name, one column per category with the count over a bar
 * coloured by the class (`classTones`), a baseline and the category names. Empty
 * categories keep their slot. The counts are listed for assistive tech; the chart is
 * decoration over that list.
 */
export function CategoryCountCard({
  label,
  description,
  columns,
  className,
}: Readonly<CategoryCountCardProps>) {
  return (
    <WidgetCard className={className}>
      <WidgetHeader label={label} description={description} subtitle="Número de parcelas" />

      <ul className="sr-only">
        {columns.map((column) => (
          <li key={column.label}>
            {column.label}: {column.count}
          </li>
        ))}
      </ul>
      <CategoryBars columns={columns} />
    </WidgetCard>
  );
}

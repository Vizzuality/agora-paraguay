import { CategoryBars } from '@/components/charts/category-bars';
import { InfoTip } from '@/components/info-tip';
import { Card } from '@/components/ui/card';
import type { CategoryCountWidget } from '@/lib/analysis/category-counts';
import { cn } from '@/lib/utils';

type CategoryCountCardProps = Omit<CategoryCountWidget, 'id'> & { className?: string };

/**
 * Widget counting the analysed parcels per category (the "Categorical multiple"
 * design): the indicator's name, one column per category with the count over a bar
 * coloured by the class (`categoryTone`), a baseline and the category names. Empty
 * categories keep their slot. The counts are listed for assistive tech; the chart is
 * decoration over that list.
 */
export function CategoryCountCard({
  label,
  description,
  columns,
  className,
}: CategoryCountCardProps) {
  return (
    <Card
      className={cn(
        'min-h-[254px] justify-between gap-6 rounded-3xl border-0 bg-card p-6 text-card-foreground shadow-none backdrop-blur-xs',
        className,
      )}
    >
      <div className="grid grid-cols-[auto_1fr] items-start gap-x-2 gap-y-1">
        <h3 className="text-[16px] leading-[20.3px] tracking-[0.28px] text-balance">{label}</h3>
        <InfoTip
          description={description}
          subject={label}
          className="mt-0.5 text-accent-foreground"
        />
        <p className="col-span-2 text-[12px] leading-[17.4px] text-muted-foreground opacity-70">
          Número de parcelas
        </p>
      </div>

      <ul className="sr-only">
        {columns.map((column) => (
          <li key={column.label}>
            {column.label}: {column.count}
          </li>
        ))}
      </ul>
      <CategoryBars columns={columns} />
    </Card>
  );
}

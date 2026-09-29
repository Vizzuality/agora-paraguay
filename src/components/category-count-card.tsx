import { InfoTip } from '@/components/info-tip';
import { Card } from '@/components/ui/card';
import type { CategoryCountTile, CategoryTone } from '@/lib/analysis/category-counts';
import { cn } from '@/lib/utils';

type CategoryCountCardProps = Omit<CategoryCountTile, 'id'> & { className?: string };

/** The bar's cap, solid in the tone's hue. */
const CAP_CLASS: Record<CategoryTone, string> = {
  low: 'bg-muted-foreground',
  mid: 'bg-risk-low',
  high: 'bg-risk-medium',
};

/** The bar's body: the same hue fading into the card. */
const BODY_CLASS: Record<CategoryTone, string> = {
  low: 'from-muted-foreground',
  mid: 'from-risk-low',
  high: 'from-risk-medium',
};

/**
 * TODO(charts): move this to the charts library once the API settles and the widgets are
 * clarified — Recharts per the repo decision, TanStack Charts if it has left pre-alpha by
 * then. Hand-rolled bars for now, because the design is a handful of rectangles.
 *
 * Widget tile counting the analysed parcels per category (Figma Widget03 on productivo):
 * the indicator's name, one column per category with the count over a bar sized to the
 * fullest column and coloured by the class (`categoryTone`), a baseline and the category
 * names. Empty categories keep their slot.
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
      {/* Same title grid as `ParcelValuesCard`: heading, icon, caption under both. */}
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

      <div className="flex flex-col">
        <ul className="flex items-end gap-2 border-b border-foreground">
          {columns.map((column) => (
            <li
              key={column.label}
              className="flex h-[98px] min-w-0 flex-1 flex-col items-center justify-end gap-1"
            >
              <span
                className={cn(
                  'text-center text-[12px] leading-[17.4px] font-semibold tabular-nums',
                  column.count === 0 && 'invisible',
                )}
              >
                {column.count}
              </span>
              {column.count > 0 && (
                // The bar: a solid cap over a body fading into the card.
                <span
                  aria-hidden
                  className="flex w-full flex-col"
                  style={{ height: `${column.height}%` }}
                >
                  <span className={cn('h-1 shrink-0 rounded-[2px]', CAP_CLASS[column.tone])} />
                  <span
                    className={cn(
                      'min-h-px flex-1 rounded-[2px] bg-gradient-to-b to-card opacity-20',
                      BODY_CLASS[column.tone],
                    )}
                  />
                </span>
              )}
            </li>
          ))}
        </ul>
        <ul
          aria-hidden
          className="flex gap-2 text-center text-[12px] leading-[17.4px] text-muted-foreground opacity-70"
        >
          {columns.map((column) => (
            <li key={column.label} className="min-w-0 flex-1">
              {column.label}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

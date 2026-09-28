import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Placeholder text block: rows of "word" bars at `text-sm` line height, last line short. */
type SkeletonParagraphProps = React.ComponentProps<'div'> & {
  length?: keyof typeof ROW_COUNT;
};

const ROW_COUNT = { short: 2, paragraph: 6, long: 10 } as const;

// Word widths in spacing units, one row per line. Rows stretch to the container, so the
// numbers only set the proportions between words.
const ROWS: number[][] = [
  [9, 10, 4, 9, 4, 10, 8, 14, 7, 10, 9],
  [4, 12, 8, 6, 14, 8, 16, 11, 6, 9, 4],
  [10, 12, 8, 14, 16, 8, 12, 10, 8, 6],
  [14, 11, 5, 12, 10, 8, 14, 12, 4, 8],
  [12, 14, 7, 11, 5, 12, 6, 16, 5, 12],
  [8, 14, 10, 6, 12, 9, 15, 7, 11, 8],
  [13, 6, 11, 9, 14, 5, 10, 12, 8, 7],
  [7, 12, 9, 15, 6, 11, 8, 13, 10, 5],
  [11, 9, 14, 7, 12, 10, 6, 13, 9, 8],
];

const CLOSING_ROW = [11, 8, 12, 4, 10, 8];

function SkeletonParagraph({ length = 'paragraph', className, ...props }: SkeletonParagraphProps) {
  const rows = [...ROWS.slice(0, ROW_COUNT[length] - 1), CLOSING_ROW];

  return (
    <div
      data-slot="skeleton-paragraph"
      aria-hidden
      className={cn('flex flex-col text-sm', className)}
      {...props}
    >
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={cn(
            'flex h-5 items-center gap-1.5',
            rowIndex === rows.length - 1 ? 'w-3/5' : 'w-full',
          )}
        >
          {row.map((units, wordIndex) => (
            <Skeleton
              key={wordIndex}
              className="h-1.5 min-w-0 grow rounded-full bg-muted-foreground/30"
              style={{ flexBasis: `${units / 4}rem` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export { SkeletonParagraph };

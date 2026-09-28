import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type SkeletonParagraphProps = React.ComponentProps<'div'> & {
  /** Lines of text to stand in for; the last one is the short closing line. */
  lines?: number;
};

const WORDS_PER_LINE = 10;
const CLOSING_LINE_WORDS = 6;

/**
 * Word widths in spacing units, 5 to 15, from the line and word index — a fixed
 * pattern, not random, so server and client render the same markup. Rows stretch to
 * the container, so the numbers only set the proportions between words.
 */
function wordWidth(line: number, word: number): number {
  return ((line * 7 + word * 13) % 11) + 5;
}

/** Placeholder text block at `text-sm` line height: one row of "word" bars per line. */
function SkeletonParagraph({ lines = 4, className, ...props }: SkeletonParagraphProps) {
  const rows = Array.from({ length: lines }, (_, line) => {
    const closing = line === lines - 1;
    const words = closing ? CLOSING_LINE_WORDS : WORDS_PER_LINE;

    return {
      id: `line-${line}`,
      closing,
      words: Array.from({ length: words }, (_, word) => ({
        id: `word-${word}`,
        units: wordWidth(line, word),
      })),
    };
  });

  return (
    <div
      data-slot="skeleton-paragraph"
      aria-hidden
      className={cn('flex flex-col text-sm', className)}
      {...props}
    >
      {rows.map(({ id, closing, words }) => (
        <div key={id} className={cn('flex h-5 items-center gap-1.5', closing ? 'w-3/5' : 'w-full')}>
          {words.map(({ id: wordId, units }) => (
            <Skeleton
              key={wordId}
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

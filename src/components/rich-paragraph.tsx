import { splitStrong } from '@/lib/analysis-texts';

/** One paragraph of copy, its `**…**` runs in bold. */
export function RichParagraph({ text }: Readonly<{ text: string }>) {
  return (
    <p>
      {splitStrong(text).map(({ text: run, strong, offset }) =>
        strong ? <strong key={offset}>{run}</strong> : run,
      )}
    </p>
  );
}

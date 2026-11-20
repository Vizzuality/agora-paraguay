import { splitStrong } from '@/lib/analysis-texts';

/** One paragraph of copy, its `**…**` runs in bold. */
export function RichParagraph({ text }: Readonly<{ text: string }>) {
  return (
    <p>
      {splitStrong(text).map((segment, index) =>
        segment.strong ? <strong key={index}>{segment.text}</strong> : segment.text,
      )}
    </p>
  );
}

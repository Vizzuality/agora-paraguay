/** A run of copy; `offset` is where it starts in the source paragraph, unique per run. */
export type TextSegment = { text: string; strong: boolean; offset: number };

/** Splits a paragraph on `**…**` so the copy can mark its bold runs in plain JSON. */
export function splitStrong(paragraph: string): TextSegment[] {
  let offset = 0;
  return paragraph
    .split('**')
    .map((text, index) => {
      const segment = { text, strong: index % 2 === 1, offset };
      offset += text.length + 2;
      return segment;
    })
    .filter(({ text }) => text !== '');
}

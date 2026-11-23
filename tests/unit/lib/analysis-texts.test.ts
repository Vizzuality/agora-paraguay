import { describe, expect, it } from 'vitest';

import { splitStrong } from '@/lib/analysis-texts';

describe('splitStrong', () => {
  it('marks the runs between double asterisks as bold', () => {
    expect(splitStrong('Ambas capas a un **período de 100 años**.')).toEqual([
      { text: 'Ambas capas a un ', strong: false, offset: 0 },
      { text: 'período de 100 años', strong: true, offset: 19 },
      { text: '.', strong: false, offset: 40 },
    ]);
  });

  it('leaves plain copy as one segment', () => {
    expect(splitStrong('Sin negrita.')).toEqual([
      { text: 'Sin negrita.', strong: false, offset: 0 },
    ]);
  });

  it('drops the empty edges when bold starts or ends the paragraph', () => {
    expect(splitStrong('**Todo en negrita.**')).toEqual([
      { text: 'Todo en negrita.', strong: true, offset: 2 },
    ]);
  });
});

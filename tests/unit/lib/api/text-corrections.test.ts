import { describe, expect, it } from 'vitest';

import corrections from '@/content/api-text-corrections.json';
import { correctApiDescription, correctApiText } from '@/lib/api/text-corrections';

describe('correctApiText', () => {
  it('replaces a whole value listed as exact, ignoring stray spaces around it', () => {
    expect(correctApiText('Tizon de la hoja')).toBe('Tizón de la hoja');
    expect(correctApiText('Area ')).toBe('Área');
  });

  it('replaces a fragment wherever it appears, as often as it appears', () => {
    expect(
      correctApiText(
        'Resultado desde la Zafra 2017-2018 hasta la Zafra 2024-2025. Qué años de Zafra soja ha habido.',
      ),
    ).toBe(
      'Resultado desde la zafra 2017-2018 hasta la zafra 2024-2025. Qué años de zafra de soja ha habido.',
    );
  });

  it('leaves text it has no entry for as it came', () => {
    expect(correctApiText('Roya asiática')).toBe('Roya asiática');
  });

  it('leaves every corrected text alone, so a fix on the backend does not double it', () => {
    const corrected = [
      ...Object.values(corrections.exact),
      ...Object.values(corrections.fragments),
    ];

    for (const text of corrected) expect(correctApiText(text)).toBe(text.trim());
  });

  it('rewords the weather station description but keeps its date reference', () => {
    expect(
      correctApiText(
        "Estación meteorológica usada para analizar los datos observados en las últimas 72 horas previas a {'id': 'date'} proporcionada en disease_filters ",
      ),
    ).toBe(
      "Estación meteorológica usada para analizar los datos observados durante las 72 horas previas al {'id': 'date'}, fecha indicada en los filtros.",
    );
  });
});

describe('correctApiDescription', () => {
  it('closes a description without a full stop, and leaves one that has it', () => {
    expect(correctApiDescription('Contador con rango desde 0 hasta 8 veces')).toBe(
      'Contador con rango desde 0 hasta 8 veces.',
    );
    expect(correctApiDescription('Cultivo a evaluar.')).toBe('Cultivo a evaluar.');
  });
});

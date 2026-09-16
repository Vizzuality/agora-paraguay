import { describe, expect, it } from 'vitest';

import { generalInfo, indicatorCards, levelOf, toneOf } from '@/lib/analysis/indicator-cards';
import { analysisFixture } from '@/lib/api/analysis/fixtures/analysis';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicator } from '@/lib/api/metadata/schemas';

/** A bare analysed parcel carrying only the given columns. */
function parcel(properties: Record<string, string | number | null>): AnalysisParcel {
  return {
    type: 'Feature',
    properties: { parcela_id: 'P1', ...properties },
    geometry: { type: 'MultiPolygon', coordinates: [] },
  };
}

const asianRust: Indicator = {
  id: 'asian_rust',
  name: 'Phakopsora pachyrhizi',
  indicator_type: { type: 'range', min: 1, max: 3, step: 1 },
};

const dataQuality: Indicator = {
  id: 'data_quality',
  name: 'Calidad del dato',
  unit: '%',
  indicator_type: { type: 'range', min: 0, max: 100 },
};

const itr: Indicator = {
  id: 'ITR_soja',
  name: 'ITR soja',
  indicator_type: { type: 'category', categories: ['Positiva', 'Estable', 'Alerta', 'NA'] },
};

const station: Indicator = {
  id: 'weather_station',
  name: 'Estación',
  indicator_type: { type: 'text' },
};

const production: Indicator = {
  id: 'Pro_soja',
  name: 'Producción base',
  unit: 't/ha',
  indicator_type: { type: 'numeric' },
};

const crop: Indicator = { id: 'crop_type', name: 'Cultivo', indicator_type: { type: 'text' } };

const phenology: Indicator = {
  id: 'phenology_stage',
  name: 'Momento fenológico',
  indicator_type: { type: 'text' },
};

const brownSpot: Indicator = {
  id: 'brown_spot',
  name: 'Septoria glycines',
  indicator_type: { type: 'range', min: 1, max: 3, step: 1 },
};

/** The sanitario metadata as `GET /api/analysis/public` lists it, in its order. */
const sanitarioIndicators = [station, dataQuality, crop, phenology, asianRust, brownSpot];

describe('levelOf', () => {
  it('splits the ruler in thirds, the cut points belonging to the higher class', () => {
    expect(levelOf(0)).toBe('Bajo');
    expect(levelOf(32.9)).toBe('Bajo');
    expect(levelOf(33)).toBe('Medio');
    expect(levelOf(65.9)).toBe('Medio');
    expect(levelOf(66)).toBe('Alto');
    expect(levelOf(100)).toBe('Alto');
  });

  it('reads a 1–3 disease index as Bajo, Medio, Alto', () => {
    expect([0, 50, 100].map(levelOf)).toEqual(['Bajo', 'Medio', 'Alto']);
  });

  it('clamps out-of-range positions to the outer classes', () => {
    expect(levelOf(-10)).toBe('Bajo');
    expect(levelOf(140)).toBe('Alto');
  });

  it('colours the ruler by the same cut points', () => {
    expect([0, 32.9, 33, 65.9, 66, 100].map(toneOf)).toEqual([
      'low',
      'low',
      'medium',
      'medium',
      'high',
      'high',
    ]);
  });
});

describe('indicatorCards', () => {
  it('is empty without a parcel or without metadata', () => {
    expect(indicatorCards(null, [asianRust])).toEqual([]);
    expect(indicatorCards(undefined, [asianRust])).toEqual([]);
    expect(indicatorCards(parcel({ asian_rust: 2 }), undefined)).toEqual([]);
  });

  it('says "Sin datos" for a selected indicator without a reading: missing, blank, null or "NA"', () => {
    const cards = indicatorCards(
      parcel({ data_quality: '', weather_station: null, Pro_soja: 'NA', asian_rust: 2 }),
      [station, dataQuality, production, asianRust, itr],
    );

    expect(cards.map((card) => [card.id, card.level])).toEqual([
      ['data_quality', 'Sin datos'],
      ['Pro_soja', 'Sin datos'],
      ['asian_rust', 'Medio'],
      ['ITR_soja', 'Sin datos'],
    ]);
    expect(cards[0]).toEqual({ id: 'data_quality', label: 'Calidad del dato', level: 'Sin datos' });
  });

  it('keeps metadata order, not column order', () => {
    const cards = indicatorCards(parcel({ data_quality: 90, asian_rust: 1 }), [
      asianRust,
      dataQuality,
    ]);

    expect(cards.map((card) => card.id)).toEqual(['asian_rust', 'data_quality']);
  });

  describe('range indicators', () => {
    it('places the value on the range and prints it as caption, unit included', () => {
      const [card] = indicatorCards(parcel({ data_quality: '92' }), [dataQuality]);

      expect(card).toMatchObject({
        id: 'data_quality',
        label: 'Calidad del dato',
        position: 92,
        caption: '92 %',
      });
    });

    it('spreads a 1–3 disease index over the ruler: 1 at 0, 2 at 50, 3 at 100', () => {
      const positions = [1, 2, 3].map(
        (value) => indicatorCards(parcel({ asian_rust: value }), [asianRust])[0].position,
      );

      expect(positions).toEqual([0, 50, 100]);
    });

    it('leaves an untyped indicator to the general info: no scale to sit on', () => {
      const bare: Indicator = { id: 'data_quality', name: 'Calidad' };

      expect(indicatorCards(parcel({ data_quality: '50' }), [bare])).toEqual([]);
      expect(generalInfo(parcel({ data_quality: '50' }), [bare])).toEqual([
        { id: 'data_quality', label: 'Calidad', value: '50' },
      ]);
    });

    it('reads a non-numeric range value as no reading', () => {
      expect(indicatorCards(parcel({ data_quality: 'n/a' }), [dataQuality])[0].level).toBe(
        'Sin datos',
      );
    });

    it('collapses a degenerate range to the left edge', () => {
      const flat: Indicator = { ...dataQuality, indicator_type: { type: 'range', min: 5, max: 5 } };

      expect(indicatorCards(parcel({ data_quality: 5 }), [flat])[0].position).toBe(0);
    });
  });

  describe('category indicators', () => {
    it('reads the label, case-insensitively, and places it among the ordered categories', () => {
      const [card] = indicatorCards(parcel({ ITR_soja: 'alerta' }), [itr]);

      expect(card).toEqual({
        id: 'ITR_soja',
        label: 'ITR soja',
        level: 'Alerta',
        position: (2 / 3) * 100,
      });
    });

    it('reads a class code as an index into the categories', () => {
      expect(indicatorCards(parcel({ ITR_soja: '1' }), [itr])[0].level).toBe('Estable');
    });

    it('reads a value outside the categories as no reading', () => {
      expect(indicatorCards(parcel({ ITR_soja: 'Negativa' }), [itr])[0].level).toBe('Sin datos');
      expect(indicatorCards(parcel({ ITR_soja: 9 }), [itr])[0].level).toBe('Sin datos');
    });

    it('has no ruler position with a single category', () => {
      const single: Indicator = {
        ...itr,
        indicator_type: { type: 'category', categories: ['presente'] },
      };

      expect(indicatorCards(parcel({ ITR_soja: 0 }), [single])[0].position).toBeUndefined();
    });
  });

  it('keeps text indicators out of the risk cards', () => {
    expect(indicatorCards(parcel({ weather_station: 'Hohenau' }), [station])).toEqual([]);
  });

  it('shows an open number as the formatted figure with its unit', () => {
    const [card] = indicatorCards(parcel({ Pro_soja: 2.774 }), [production]);

    expect(card).toEqual({ id: 'Pro_soja', label: 'Producción base', level: '2,77 t/ha' });
  });

  it('turns the mocked analysis into one card per measured index, per parcel', () => {
    const [first, , third] = analysisFixture.features;

    expect(indicatorCards(first, sanitarioIndicators).map((card) => card.id)).toEqual([
      'data_quality',
      'asian_rust',
      'brown_spot',
    ]);

    // Different parcels, different readings — the tab switch has to show it.
    const rust = (parcel: AnalysisParcel) =>
      indicatorCards(parcel, sanitarioIndicators).find((card) => card.id === 'asian_rust');

    expect(rust(first)).toMatchObject({ position: 100, caption: '3' });
    expect(rust(third)).toMatchObject({ position: 50, caption: '2' });
  });
});

describe('generalInfo', () => {
  it('is empty without a parcel or without metadata', () => {
    expect(generalInfo(null, [station])).toEqual([]);
    expect(generalInfo(parcel({ weather_station: 'Hohenau' }), undefined)).toEqual([]);
  });

  it('lists the text indicators the parcel carries, in metadata order, and nothing measured', () => {
    expect(
      generalInfo(parcel({ crop_type: 'Soja', asian_rust: 3, weather_station: 'Hohenau' }), [
        station,
        asianRust,
        crop,
      ]),
    ).toEqual([
      { id: 'weather_station', label: 'Estación', value: 'Hohenau' },
      { id: 'crop_type', label: 'Cultivo', value: 'Soja' },
    ]);
  });

  it('skips a missing, blank or "NA" reading', () => {
    expect(generalInfo(parcel({ weather_station: 'NA' }), [station])).toEqual([]);
    expect(generalInfo(parcel({ weather_station: '' }), [station])).toEqual([]);
    expect(generalInfo(parcel({}), [station])).toEqual([]);
  });

  it("groups the mocked parcel's station, crop and phenology", () => {
    const [first] = analysisFixture.features;

    expect(generalInfo(first, sanitarioIndicators).map((row) => [row.id, row.value])).toEqual([
      ['weather_station', 'Colonias Unidas - Capitán Meza'],
      ['crop_type', 'Soja'],
      ['phenology_stage', 'R5 (Inicio de grano)'],
    ]);
  });
});

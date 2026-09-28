import { describe, expect, it } from 'vitest';

import { generalInfo, indicatorCards } from '@/lib/analysis/indicator-cards';
import { RANGE_CLASSES } from '@/lib/analysis/widget-config';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicator } from '@/lib/api/metadata/schemas';

/** A bare analysed parcel carrying only the given columns. */
function parcel(properties: Record<string, string | number | null>): AnalysisParcel {
  return { parcel_id: 'D07D21P00000001', properties };
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

const area: Indicator = {
  id: 'area',
  name: 'Área',
  unit: 'ha',
  indicator_type: { type: 'numeric' },
};

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

/** The sanitario metadata as `GET /api/parcels/analysis/diseases/` lists it, in its order. */
const sanitarioIndicators = [station, dataQuality, crop, phenology, asianRust, brownSpot];

describe('range classes', () => {
  /** The class a data-quality reading (0–100 %) is printed as. */
  const levelAt = (value: number) =>
    indicatorCards(parcel({ data_quality: value }), [dataQuality])[0].level;

  it('splits the ruler in thirds, the cut points belonging to the higher class', () => {
    expect([0, 33, 34, 66, 67, 100].map(levelAt)).toEqual([
      'Sin riesgo',
      'Sin riesgo',
      'Moderado',
      'Moderado',
      'Severo',
      'Severo',
    ]);
  });

  it('reads a 1–3 disease index as Sin riesgo, Moderado, Severo', () => {
    expect(
      [1, 2, 3].map((value) => indicatorCards(parcel({ asian_rust: value }), [asianRust])[0].level),
    ).toEqual(['Sin riesgo', 'Moderado', 'Severo']);
  });

  it('clamps out-of-range readings to the outer classes', () => {
    expect(levelAt(-10)).toBe('Sin riesgo');
    expect(levelAt(140)).toBe('Severo');
  });
});

describe('indicatorCards', () => {
  it('is empty without a parcel or without metadata', () => {
    expect(indicatorCards(null, [asianRust])).toEqual([]);
    expect(indicatorCards(undefined, [asianRust])).toEqual([]);
    expect(indicatorCards(parcel({ asian_rust: 2 }), undefined)).toEqual([]);
  });

  it('shows only the indicators the response answered: missing, blank, null or "NA" get no card', () => {
    const cards = indicatorCards(
      parcel({ data_quality: '', weather_station: null, Pro_soja: 'NA', asian_rust: 2 }),
      [station, dataQuality, production, asianRust, itr],
    );

    expect(cards.map((card) => [card.id, card.level])).toEqual([['asian_rust', 'Moderado']]);
  });

  it('matches a column to its indicator ignoring case — the backend answers Asian_rust', () => {
    const [card] = indicatorCards(parcel({ Asian_rust: 3 }), [asianRust]);

    expect(card).toMatchObject({
      id: 'asian_rust',
      label: 'Phakopsora pachyrhizi',
      level: 'Severo',
    });
  });

  it('lists a column the metadata does not know as a fact, number or text, never a card', () => {
    const cards = indicatorCards(parcel({ Late_blight: 2, asian_rust: 1, note: 'x' }), [asianRust]);

    expect(cards.map((card) => [card.id, card.level])).toEqual([['asian_rust', 'Sin riesgo']]);
    expect(generalInfo(parcel({ Late_blight: 2, note: 'x', asian_rust: 1 }), [asianRust])).toEqual([
      { id: 'Late_blight', label: 'Late_blight', value: '2' },
      { id: 'note', label: 'note', value: 'x' },
    ]);
  });

  it('keeps the area out of the cards and the facts: it is the thumbnail figure', () => {
    const p = parcel({ Area: 10.2, asian_rust: 1 });

    expect(indicatorCards(p, [area, asianRust]).map((card) => card.id)).toEqual(['asian_rust']);
    expect(generalInfo(p, [area, asianRust])).toEqual([]);
  });

  it('keeps metadata order, not column order', () => {
    const cards = indicatorCards(parcel({ data_quality: 90, asian_rust: 1 }), [
      asianRust,
      dataQuality,
    ]);

    expect(cards.map((card) => card.id)).toEqual(['asian_rust', 'data_quality']);
  });

  describe('range indicators', () => {
    it('places the value on the range, read in the three range classes, no caption', () => {
      const [card] = indicatorCards(parcel({ data_quality: 92 }), [dataQuality]);

      expect(card).toEqual({
        id: 'data_quality',
        label: 'Calidad del dato',
        level: 'Severo',
        scale: { classes: RANGE_CLASSES, position: 92 },
      });
    });

    it('reads a number delivered as a string as no reading: the type says number', () => {
      expect(indicatorCards(parcel({ data_quality: '92' }), [dataQuality])[0].level).toBe(
        'Sin datos',
      );
    });

    it('spreads a 1–3 disease index over the ruler: 1 at 0, 2 at 50, 3 at 100', () => {
      const positions = [1, 2, 3].map(
        (value) => indicatorCards(parcel({ asian_rust: value }), [asianRust])[0].scale?.position,
      );

      expect(positions).toEqual([0, 50, 100]);
    });

    it('reads a non-numeric range value as no reading', () => {
      expect(indicatorCards(parcel({ data_quality: 'n/a' }), [dataQuality])[0].level).toBe(
        'Sin datos',
      );
    });

    it('collapses a degenerate range to the left edge', () => {
      const flat: Indicator = { ...dataQuality, indicator_type: { type: 'range', min: 5, max: 5 } };

      expect(indicatorCards(parcel({ data_quality: 5 }), [flat])[0].scale?.position).toBe(0);
    });
  });

  describe('category indicators', () => {
    it('reads the label, case-insensitively, and places it among the ordered categories', () => {
      const [card] = indicatorCards(parcel({ ITR_soja: 'alerta' }), [itr]);

      // Four bands of 25: the third one's middle.
      expect(card).toEqual({
        id: 'ITR_soja',
        label: 'ITR soja',
        level: 'Alerta',
        scale: {
          classes: [
            { label: 'Positiva', tone: 'low' },
            { label: 'Estable', tone: 'medium' },
            { label: 'Alerta', tone: 'medium' },
            { label: 'NA', tone: 'high' },
          ],
          position: 62.5,
        },
      });
    });

    it('reads a class code as an index into the categories', () => {
      expect(indicatorCards(parcel({ ITR_soja: '1' }), [itr])[0].level).toBe('Estable');
    });

    it('reads a value outside the categories as no reading', () => {
      expect(indicatorCards(parcel({ ITR_soja: 'Negativa' }), [itr])[0].level).toBe('Sin datos');
      expect(indicatorCards(parcel({ ITR_soja: 9 }), [itr])[0].level).toBe('Sin datos');
    });

    it('has no ruler with a single category', () => {
      const single: Indicator = {
        ...itr,
        indicator_type: { type: 'category', categories: ['presente'] },
      };

      expect(indicatorCards(parcel({ ITR_soja: 0 }), [single])[0].scale).toBeUndefined();
    });
  });

  it('keeps text and open-number indicators out of the risk cards', () => {
    expect(indicatorCards(parcel({ weather_station: 'Hohenau' }), [station])).toEqual([]);
    expect(indicatorCards(parcel({ Pro_soja: 2.774 }), [production])).toEqual([]);
  });

  it('turns an analysed parcel into one card per measured index, per parcel', () => {
    const first = parcel({ data_quality: 92, asian_rust: 3, brown_spot: 2 });
    const third = parcel({ data_quality: 78, asian_rust: 2, brown_spot: 3 });

    expect(indicatorCards(first, sanitarioIndicators).map((card) => card.id)).toEqual([
      'data_quality',
      'asian_rust',
      'brown_spot',
    ]);

    // Different parcels, different readings — the tab switch has to show it.
    const rust = (parcel: AnalysisParcel) =>
      indicatorCards(parcel, sanitarioIndicators).find((card) => card.id === 'asian_rust');

    expect(rust(first)).toMatchObject({ level: 'Severo', scale: { position: 100 } });
    expect(rust(third)).toMatchObject({ level: 'Moderado', scale: { position: 50 } });
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

  it('lists an open number as a fact, formatted with its unit', () => {
    expect(generalInfo(parcel({ Pro_soja: 2.774 }), [production])).toEqual([
      { id: 'Pro_soja', label: 'Producción base', value: '2,77 t/ha' },
    ]);
  });

  it('reads a numeric indicator that is not a number as "Sin datos"', () => {
    expect(generalInfo(parcel({ Pro_soja: '2.774' }), [production])[0].value).toBe('Sin datos');
    expect(generalInfo(parcel({ Pro_soja: 'alto' }), [production])[0].value).toBe('Sin datos');
  });

  it('reads a number for a text indicator as "Sin datos"', () => {
    expect(generalInfo(parcel({ weather_station: 12 }), [station])[0].value).toBe('Sin datos');
  });

  it("groups a parcel's station, crop and phenology", () => {
    const first = parcel({
      weather_station: 'Colonias Unidas - Capitán Meza',
      crop_type: 'Soja',
      phenology_stage: 'R5 (Inicio de grano)',
      asian_rust: 3,
    });

    expect(generalInfo(first, sanitarioIndicators).map((row) => [row.id, row.value])).toEqual([
      ['weather_station', 'Colonias Unidas - Capitán Meza'],
      ['crop_type', 'Soja'],
      ['phenology_stage', 'R5 (Inicio de grano)'],
    ]);
  });
});

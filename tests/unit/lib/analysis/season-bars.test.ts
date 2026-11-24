import { describe, expect, it } from 'vitest';

import { parseSeason, seasonBarsWidgets } from '@/lib/analysis/season-bars';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicator } from '@/lib/api/metadata/schemas';

const zafrasSoja: Indicator = {
  id: 'Zafras_soja',
  name: 'Listado de zafras de soja',
  description: 'Qué años de zafra de soja ha habido.',
  indicator_type: { type: 'list' },
};

const zafrasArroz: Indicator = {
  id: 'Zafras_arroz',
  name: 'Listado de zafras de arroz',
  indicator_type: { type: 'list' },
};

function parcel(id: string, lists: Record<string, string[]>): AnalysisParcel {
  return {
    parcel_id: id,
    properties: Object.fromEntries(
      Object.entries(lists).map(([column, seasons]) => [column, seasons.join(', ')]),
    ),
    lists,
  };
}

const west = parcel('west', {
  Zafras_soja: ['2017-2018', '2018-2019', '2019-2020', '2020-2021', '2022-2023'],
});
const east = parcel('east', { Zafras_soja: ['2022-2023', '2023-2024', '2024-2025'] });

describe('parseSeason', () => {
  it('reads a season as its two years, and nothing else', () => {
    expect(parseSeason('2017-2018')).toEqual({ start: 2017, end: 2018 });
    expect(parseSeason(' 2017 - 2018 ')).toEqual({ start: 2017, end: 2018 });
    expect(parseSeason('2017')).toBeUndefined();
    expect(parseSeason('2018-2017')).toBeUndefined();
  });
});

describe('seasonBarsWidgets', () => {
  it('under Todas, one bar per season over the years, as tall as the parcels that grew it', () => {
    const [widget] = seasonBarsWidgets(
      [west, east],
      ['west', 'east'],
      [zafrasSoja],
      'productivo',
      'multiple',
    );

    expect(widget).toMatchObject({
      id: 'Zafras_soja',
      label: 'Listado de zafras de soja',
      description: 'Qué años de zafra de soja ha habido.',
      from: 2017,
      to: 2025,
    });
    expect(widget.bars.map(({ season, count }) => [season, count])).toEqual([
      ['2017-2018', 1],
      ['2018-2019', 1],
      ['2019-2020', 1],
      ['2020-2021', 1],
      // A season no parcel grew keeps its slot, so the gap shows.
      ['2021-2022', 0],
      ['2022-2023', 2],
      ['2023-2024', 1],
      ['2024-2025', 1],
    ]);
  });

  it('always spans the classifier period, 2017-2018 to 2024-2025, empty edges included', () => {
    const [widget] = seasonBarsWidgets([east], ['east'], [zafrasSoja], 'productivo', 'multiple');

    expect([widget.from, widget.to]).toEqual([2017, 2025]);
    expect(widget.bars.map(({ count }) => count)).toEqual([0, 0, 0, 0, 0, 1, 1, 1]);
  });

  it('counts only the submitted parcels', () => {
    const [widget] = seasonBarsWidgets(
      [west, east],
      ['east'],
      [zafrasSoja],
      'productivo',
      'multiple',
    );

    expect(widget.bars.filter(({ count }) => count > 0).map(({ season }) => season)).toEqual([
      '2022-2023',
      '2023-2024',
      '2024-2025',
    ]);
  });

  it('shares one axis across crops, stretched past the period rather than dropping a season', () => {
    const rice = parcel('rice', { Zafras_arroz: ['2015-2016'] });
    const widgets = seasonBarsWidgets(
      [west, rice],
      ['west', 'rice'],
      [zafrasSoja, zafrasArroz],
      'productivo',
      'multiple',
    );

    expect(widgets.map(({ id, from, to }) => [id, from, to])).toEqual([
      ['Zafras_soja', 2015, 2025],
      ['Zafras_arroz', 2015, 2025],
    ]);
  });

  it('draws nothing on one parcel, for a list without seasons, or without readings', () => {
    expect(seasonBarsWidgets([west], ['west'], [zafrasSoja], 'productivo', 'individual')).toEqual(
      [],
    );
    expect(
      seasonBarsWidgets(
        [parcel('p', { Zafras_soja: ['primavera'] })],
        ['p'],
        [zafrasSoja],
        'productivo',
        'multiple',
      ),
    ).toEqual([]);
    expect(seasonBarsWidgets([west], ['west'], [zafrasArroz], 'productivo', 'multiple')).toEqual(
      [],
    );
  });
});

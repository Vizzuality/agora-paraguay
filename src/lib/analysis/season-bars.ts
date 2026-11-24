import { widgetFor, type ParcelScope } from '@/lib/analysis/widget-config';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicators, IndicatorsRiesgo } from '@/lib/api/metadata/schemas';

/*
 * The seasons widget, under Todas: a list of growing seasons (`Zafras_soja`, answered as
 * `["2017-2018", …]` per parcel) charted over the years, one bar per season between its
 * two years, as tall as the analysed parcels that grew it. Every season in the span keeps
 * its slot, so a season nobody grew shows as a gap. All the season lists share one span,
 * so soy and rice line up. Pure, node-tested; `SeasonBars` draws it.
 */

export type Season = { start: number; end: number };

export type SeasonBar = Season & {
  /** As the backend writes it, `2017-2018`: the tooltip's name for the bar. */
  season: string;
  count: number;
};

export type SeasonBarsWidget = {
  id: string;
  label: string;
  /** The metadata's description, behind the title's info icon. */
  description?: string;
  /** The axis, in years: the first season's start to the last one's end. */
  from: number;
  to: number;
  bars: SeasonBar[];
};

/** `2017-2018` as its two years; anything that is not two consecutive-or-later years is not a season. */
export function parseSeason(text: string): Season | undefined {
  const match = /^\s*(\d{4})\s*-\s*(\d{4})\s*$/.exec(text);
  if (!match) return undefined;

  const start = Number(match[1]);
  const end = Number(match[2]);

  return end > start ? { start, end } : undefined;
}

export function seasonBarsWidgets(
  parcels: AnalysisParcel[],
  parcelIds: string[],
  indicators: Indicators | undefined,
  riesgo: IndicatorsRiesgo,
  scope: ParcelScope,
): SeasonBarsWidget[] {
  if (!indicators) return [];

  const byId = new Map(parcels.map((parcel) => [String(parcel.parcel_id), parcel]));
  const submitted = parcelIds.flatMap((parcelId) => byId.get(parcelId) ?? []);

  const charted = indicators.flatMap((indicator) => {
    if (widgetFor(indicator.indicator_type, { riesgo, scope, id: indicator.id }) !== 'seasons')
      return [];

    // Each parcel counts once per season, however often its list repeats it.
    const counts = new Map<number, number>();
    for (const parcel of submitted) {
      const starts = new Set(
        listOf(parcel, indicator.id).flatMap((text) => parseSeason(text)?.start ?? []),
      );
      for (const start of starts) counts.set(start, (counts.get(start) ?? 0) + 1);
    }

    return counts.size === 0 ? [] : [{ indicator, counts }];
  });

  if (charted.length === 0) return [];

  const starts = charted.flatMap(({ counts }) => [...counts.keys()]);
  const from = Math.min(...starts);
  const to = Math.max(...starts) + 1;

  return charted.map(({ indicator, counts }) => ({
    id: indicator.id,
    label: indicator.name,
    description: indicator.description,
    from,
    to,
    bars: Array.from({ length: to - from }, (_, index) => {
      const start = from + index;

      return {
        season: `${start}-${start + 1}`,
        start,
        end: start + 1,
        count: counts.get(start) ?? 0,
      };
    }),
  }));
}

/** The parcel's elements for a list column, matched like any column: whatever its case. */
function listOf(parcel: AnalysisParcel, id: string): string[] {
  const key = id.toLowerCase();
  const column = Object.keys(parcel.lists ?? {}).find((name) => name.toLowerCase() === key);

  return column === undefined ? [] : (parcel.lists?.[column] ?? []);
}

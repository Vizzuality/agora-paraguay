import type { AnalysisParcel, ParcelValue } from '@/lib/api/analysis/schemas';

/** A parcel's reading of an indicator: a number or a text, once "no reading" is filtered out. */
export type Reading = string | number;

/**
 * The spellings of "no reading" seen from the backend, compared trimmed and case-blind:
 * the spec's "NA", plus the variants pandas and the backend's serialisers produce.
 */
const NO_READING_VALUES = new Set(['', 'na', 'n/a', 'nan', 'null', 'none', '-']);

/** Whether a wire value means the parcel has no reading (missing, null, blank, "NA" and kin). */
export function isNoReading(value: ParcelValue | undefined): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'number') return Number.isNaN(value);

  return NO_READING_VALUES.has(value.trim().toLowerCase());
}

/** The wire value as a reading, or `undefined` when it means there is none. */
export function asReading(value: ParcelValue | undefined): Reading | undefined {
  return value === null || value === undefined || isNoReading(value) ? undefined : value;
}

/**
 * A parcel's reading under a column, matched by id ignoring case — the backend answers
 * `Asian_rust` to a request for `asian_rust`. `undefined` when the parcel has no reading
 * (`isNoReading`).
 */
export function readingOf(parcel: AnalysisParcel, id: string): Reading | undefined {
  const value = parcel.properties[id] ?? columnIgnoringCase(parcel, id);

  return asReading(value);
}

/** The reading as a number, whether it came as one or as digits in a string; `undefined` otherwise. */
export function numberOf(parcel: AnalysisParcel, id: string): number | undefined {
  const value = readingOf(parcel, id);

  if (value === undefined) return undefined;

  const number = typeof value === 'number' ? value : Number(value);

  return Number.isNaN(number) ? undefined : number;
}

/** Whether the answer carries the column for this parcel at all, whatever it holds (NA and unreadable included). */
export function hasColumn(parcel: AnalysisParcel, id: string): boolean {
  return columnKey(parcel, id) !== undefined || isUnreadable(parcel, id);
}

/** Whether the backend answered the column with a value no reading can come from (an array). */
export function isUnreadable(parcel: AnalysisParcel, id: string): boolean {
  const wanted = id.toLowerCase();

  return (parcel.unreadable ?? []).some((column) => column.toLowerCase() === wanted);
}

function columnIgnoringCase(parcel: AnalysisParcel, id: string): ParcelValue | undefined {
  const key = columnKey(parcel, id);

  return key === undefined ? undefined : parcel.properties[key];
}

// Each parcel's columns by lower-cased name, built on the first lookup: the widgets read
// every indicator of every parcel on each render, and scanning the keys each time added up.
const columnIndexes = new WeakMap<AnalysisParcel['properties'], Map<string, string>>();

/** The parcel's own spelling of a column, matched ignoring case; the first one when two collide. */
function columnKey(parcel: AnalysisParcel, id: string): string | undefined {
  let index = columnIndexes.get(parcel.properties);

  if (index === undefined) {
    index = new Map();
    for (const column of Object.keys(parcel.properties)) {
      const lower = column.toLowerCase();
      if (!index.has(lower)) index.set(lower, column);
    }
    columnIndexes.set(parcel.properties, index);
  }

  return index.get(id.toLowerCase());
}

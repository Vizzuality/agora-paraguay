import type { AnalysisParcel, ParcelValue } from '@/lib/api/analysis/schemas';

/**
 * The spellings of "no reading" seen from the backend, compared trimmed and case-blind:
 * the spec's "NA", plus the variants pandas and Django serialisers produce.
 */
const NO_READING_VALUES = new Set(['', 'na', 'n/a', 'nan', 'null', 'none', '-']);

/** Whether a wire value means the parcel has no reading (missing, null, blank, "NA" and kin). */
export function isNoReading(value: ParcelValue | undefined): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'number') return Number.isNaN(value);

  return NO_READING_VALUES.has(value.trim().toLowerCase());
}

/** The wire value as a reading, or `undefined` when it means there is none. */
export function asReading(value: ParcelValue | undefined): string | number | undefined {
  return value === null || value === undefined || isNoReading(value) ? undefined : value;
}

/**
 * A parcel's reading under a column, matched by id ignoring case — the backend answers
 * `Asian_rust` to a request for `asian_rust`. `undefined` when the parcel has no reading
 * (`isNoReading`).
 */
export function readingOf(parcel: AnalysisParcel, id: string): string | number | undefined {
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

/** Whether the answer carries the column for this parcel at all, whatever it holds (NA included). */
export function hasColumn(parcel: AnalysisParcel, id: string): boolean {
  const wanted = id.toLowerCase();

  return Object.keys(parcel.properties).some((column) => column.toLowerCase() === wanted);
}

function columnIgnoringCase(parcel: AnalysisParcel, id: string): ParcelValue | undefined {
  const wanted = id.toLowerCase();
  const key = Object.keys(parcel.properties).find((column) => column.toLowerCase() === wanted);

  return key === undefined ? undefined : parcel.properties[key];
}

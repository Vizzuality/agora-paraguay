import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicator } from '@/lib/api/metadata/schemas';

/* Indicators and parcels the analysis specs share; each spec keeps the ones only it reads. */

/** A short productivo range: the seasons detected, 0–8 in steps of 1. */
export const seasons: Indicator = {
  id: 'N_soja',
  name: 'Contador de zafras de soja detectadas',
  indicator_type: { type: 'range', min: 0, max: 8, step: 1 },
};

/** A long productivo range: a 0–100 % index. */
export const stability: Indicator = {
  id: 'IEP_H5_soja',
  name: 'Índice de estabilidad productiva',
  unit: '%',
  indicator_type: { type: 'range', min: 0, max: 100, step: 1 },
};

/** One analysed parcel with the given columns. */
export function parcel(id: string, properties: AnalysisParcel['properties']): AnalysisParcel {
  return { parcel_id: id, properties };
}

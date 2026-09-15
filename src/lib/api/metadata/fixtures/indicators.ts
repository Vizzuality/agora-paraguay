import type { Indicators } from '@/lib/api/metadata/schemas';

/**
 * TODO(mock-indicators): served for every riesgo while `GET /api/indicators/` is not
 * reachable. Delete with the mock branch in `client.ts`.
 *
 * Sanitario is the backend's `disease_indices` (endpoint2front-end_20260909.py), verbatim
 * — ids are the property columns of the public analysis response. Productivo keeps the
 * spec's `resiliencia` example until its response shape lands. Split by riesgo so the mock
 * honours the `riesgo` query parameter the way the endpoint does.
 */
export const sanitarioIndicatorsFixture: Indicators = [
  {
    id: 'weather_station',
    name: 'Nombre de la estación meteorológica más cercana',
    description:
      'Estación meteorológica usada para analizar los datos observados en las últimas 72 horas previas a la fecha proporcionada.',
    default: true,
    indicator_type: { type: 'text' },
  },
  {
    id: 'data_quality',
    name: 'Calidad de los datos observados en la estación meteorológica usada',
    description: 'Compara los registros medidos con la frecuencia esperada de la estación.',
    unit: '%',
    default: true,
    indicator_type: { type: 'range', min: 0, max: 100, step: 1 },
  },
  {
    id: 'crop_type',
    name: 'Tipo de cultivo',
    description: 'Cultivo a evaluar.',
    default: true,
    indicator_type: { type: 'text' },
  },
  {
    id: 'phenology_stage',
    name: 'Nombre del momento fenológico estimado',
    description:
      'Momento fenológico estimado a partir de la fecha de siembra y la fecha de referencia.',
    default: true,
    indicator_type: { type: 'text' },
  },
  {
    id: 'asian_rust',
    name: 'Phakopsora pachyrhizi',
    description:
      'Enfermedad que puede aparecer con períodos prolongados de elevada humedad y altas temperaturas.',
    default: true,
    indicator_type: { type: 'range', min: 1, max: 3, step: 1 },
  },
  {
    id: 'brown_spot',
    name: 'Septoria glycines',
    description: 'Enfermedad que puede aparecer con lluvias frecuentes y altos niveles de humedad.',
    default: true,
    indicator_type: { type: 'range', min: 1, max: 3, step: 1 },
  },
];

export const productivoIndicatorsFixture: Indicators = [
  {
    id: 'resiliencia',
    name: 'Resiliencia',
    description: 'Lorem ipsum',
    default: true,
    indicator_type: {
      type: 'category',
      value: null,
      categories: ['muy bajo', 'bajo', 'medio', 'alto'],
    },
  },
];

/** Every indicator, the answer to `GET /api/indicators/` without a `riesgo`. */
export const indicatorsFixture: Indicators = [
  ...sanitarioIndicatorsFixture,
  ...productivoIndicatorsFixture,
];

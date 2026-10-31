import { formatNumber } from '@/lib/analysis/number-scale';

/** A feature clicked on one of the Capas reference layers. */
export type LayerFeature = {
  layerId: number;
  /** The layer's legend label ("Soja"). */
  layer: string;
  properties: Record<string, unknown>;
};

export type LayerFeatureFact = {
  id: string;
  label: string;
  description?: string;
  value: string;
};

type IndicatorLabel = { id: string; name: string; description?: string };

/** The district key and the panel's heading fields: not repeated as facts. */
const HIDDEN = new Set(['clave', 'dist_desc_', 'dpto_desc']);

/**
 * A layer feature's properties as label/value facts, in the layer's order. A property
 * the indicator metadata knows takes its name and description; any other shows its key.
 * Empty and non-scalar values are left out.
 */
export function layerFeatureFacts(
  properties: Record<string, unknown>,
  indicators: readonly IndicatorLabel[] = [],
): LayerFeatureFact[] {
  const byId = new Map(indicators.map((indicator) => [indicator.id.toLowerCase(), indicator]));
  const facts: LayerFeatureFact[] = [];

  for (const [key, value] of Object.entries(properties)) {
    if (HIDDEN.has(key.toLowerCase())) continue;

    const text = factValue(value);
    if (text === null) continue;

    const indicator = byId.get(key.toLowerCase());
    facts.push({
      id: key,
      label: indicator?.name ?? key,
      description: indicator?.description,
      value: text,
    });
  }

  return facts;
}

function factValue(value: unknown): string | null {
  if (typeof value === 'number') return Number.isFinite(value) ? formatNumber(value) : null;
  if (typeof value === 'string') return value.trim() === '' ? null : value;
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return null;
}

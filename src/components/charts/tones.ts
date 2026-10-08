import type { RiskTone } from '@/lib/analysis/widget-config';

/** The hue a class paints its bar with: the same tokens the ruler's bands use. */
export const TONE_COLOR: Record<RiskTone, string> = {
  none: 'var(--risk-none)',
  low: 'var(--risk-low)',
  medium: 'var(--risk-neutral)',
  elevated: 'var(--risk-medium)',
  high: 'var(--risk-high)',
};

export const TONES = Object.keys(TONE_COLOR) as RiskTone[];

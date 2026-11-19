import type { LinkProps } from '@tanstack/react-router';
import { Bug, ChartPie, ThermometerSun, type LucideIcon } from 'lucide-react';

import type { Riesgo } from '@/lib/api/metadata/schemas';

export type NavLink = {
  label: string;
  to: LinkProps['to'];
  replace?: boolean;
};

/**
 * Way back to the parcel selection, shared by the top nav and the footer. Not `/`: home is
 * Exposición climática, which selects districts, not parcels.
 */
export const SELECTION_LINK: NavLink = {
  label: 'Personalización del análisis',
  to: '/analisis/sanitario',
};

/** The two risk views, in display order, each its own route under `/analisis`. */
export const RISK_TABS: {
  label: string;
  riesgo: Riesgo;
  to: LinkProps['to'];
  icon: LucideIcon;
  /** Private: choosing it signed out asks for the login first. */
  requiresLogin?: boolean;
}[] = [
  { label: 'Riesgo sanitario', riesgo: 'sanitario', to: '/analisis/sanitario', icon: Bug },
  {
    label: 'Riesgo productivo',
    riesgo: 'productivo',
    to: '/analisis/productivo',
    icon: ChartPie,
    requiresLogin: true,
  },
];

/** Exposición climática: by district, no parcel selection. */
export const EXPOSURE_TAB = {
  label: 'Exposición climática',
  to: '/analisis/exposicion-climatica',
  icon: ThermometerSun,
} satisfies { label: string; to: LinkProps['to']; icon: LucideIcon };

/** The top nav's tabs: Exposición climática, then the risk views. The footer keeps `RISK_LINKS`. */
export const HEADER_TABS: { label: string; to: LinkProps['to'] }[] = [EXPOSURE_TAB, ...RISK_TABS];

/**
 * `RISK_TABS` as plain router links (for the footer). Switching risk views must
 * not stack history entries, or the browser's Back stops leaving the page —
 * same rule as the top nav's tabs.
 */
export const RISK_LINKS: NavLink[] = RISK_TABS.map(({ label, to }) => ({
  label,
  to,
  replace: true,
}));

/** The analysis types, in display order, each its own route under `/analisis`. */
export const ANALYSIS_TYPES: {
  label: string;
  to: LinkProps['to'];
  icon: LucideIcon;
  /** The riesgo a parcel analysis runs; Exposición climática works by district instead. */
  riesgo?: Riesgo;
  /** Private: choosing it signed out asks for the login first. */
  requiresLogin?: boolean;
}[] = [EXPOSURE_TAB, ...RISK_TABS];

/** What each analysis type is for, as the landing's cards say it. */
const ANALYSIS_DESCRIPTIONS: Record<string, string> = {
  [EXPOSURE_TAB.label]:
    'Consulte la exposición de cada distrito a la sequía y la inundación, y la superficie de cultivo expuesta.',
  'Riesgo sanitario':
    'Evalúe el riesgo de enfermedades en las parcelas que seleccione, según las condiciones climáticas recientes.',
  'Riesgo productivo':
    'Analice la producción histórica y proyectada de sus parcelas, su tendencia y su resiliencia.',
};

/** The landing's entries: every analysis type with its description, linking to its page. */
export const LANDING_ENTRIES = ANALYSIS_TYPES.map((type) => ({
  ...type,
  description: ANALYSIS_DESCRIPTIONS[type.label] ?? '',
}));

export type LandingEntry = (typeof LANDING_ENTRIES)[number];

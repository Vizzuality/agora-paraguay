import type { LinkProps } from '@tanstack/react-router';

import {
  ExposureIcon,
  ProductiveRiskIcon,
  SanitaryRiskIcon,
  type IconComponent,
} from '@/components/icons/analysis-icons';
import { analysisDescription } from '@/lib/analysis-texts';
import type { Riesgo } from '@/lib/api/metadata/schemas';

/** The two risk views, in display order, each its own route under `/analisis`. */
export const RISK_TABS: {
  label: string;
  riesgo: Riesgo;
  to: LinkProps['to'];
  icon: IconComponent;
  /** Private: choosing it signed out asks for the login first. */
  requiresLogin?: boolean;
}[] = [
  {
    label: 'Riesgo sanitario',
    riesgo: 'sanitario',
    to: '/analisis/sanitario',
    icon: SanitaryRiskIcon,
  },
  {
    label: 'Riesgo productivo',
    riesgo: 'productivo',
    to: '/analisis/productivo',
    icon: ProductiveRiskIcon,
    requiresLogin: true,
  },
];

/** Exposición climática: by district, no parcel selection. */
export const EXPOSURE_TAB = {
  label: 'Exposición climática',
  to: '/analisis/exposicion-climatica',
  icon: ExposureIcon,
} satisfies { label: string; to: LinkProps['to']; icon: IconComponent };

/** The top nav's tabs: Exposición climática, then the risk views. */
export const HEADER_TABS: { label: string; to: LinkProps['to'] }[] = [EXPOSURE_TAB, ...RISK_TABS];

/** The analysis types, in display order, each its own route under `/analisis`. */
export const ANALYSIS_TYPES: {
  label: string;
  to: LinkProps['to'];
  icon: IconComponent;
  /** The riesgo a parcel analysis runs; Exposición climática works by district instead. */
  riesgo?: Riesgo;
  /** Private: choosing it signed out asks for the login first. */
  requiresLogin?: boolean;
}[] = [EXPOSURE_TAB, ...RISK_TABS];

/** The landing's entries: every analysis type with its description, linking to its page. */
export const LANDING_ENTRIES = ANALYSIS_TYPES.map((type) => ({
  ...type,
  description: analysisDescription(String(type.to)) ?? '',
}));

export type LandingEntry = (typeof LANDING_ENTRIES)[number];

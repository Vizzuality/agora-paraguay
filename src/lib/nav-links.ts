import type { LinkProps } from '@tanstack/react-router';

import {
  ExposureIcon,
  ProductiveRiskIcon,
  SanitaryRiskIcon,
  type IconComponent,
} from '@/components/icons/analysis-icons';
import type { Riesgo } from '@/lib/api/metadata/schemas';
import { analysisTypeMetadata } from '@/lib/platform-metadata';

/**
 * An analysis type's link. Its label, description and whether it needs a login come from
 * `platform-metadata.json` (`analysisTypeMetadata`); route and icon are the front end's.
 */
type AnalysisLink = {
  label: string;
  description: string;
  to: LinkProps['to'];
  icon: IconComponent;
  /** Private: choosing it signed out asks for the login first. */
  requiresLogin: boolean;
};

/** The two risk views, in display order, each its own route under `/analisis`. */
export const RISK_TABS: (AnalysisLink & { riesgo: Riesgo })[] = [
  {
    ...analysisTypeMetadata('sanitario'),
    riesgo: 'sanitario',
    to: '/analisis/sanitario',
    icon: SanitaryRiskIcon,
  },
  {
    ...analysisTypeMetadata('productivo'),
    riesgo: 'productivo',
    to: '/analisis/productivo',
    icon: ProductiveRiskIcon,
  },
];

/** Exposición climática: by district, no parcel selection. */
export const EXPOSURE_TAB: AnalysisLink = {
  ...analysisTypeMetadata('exposicion_climatica'),
  to: '/analisis/exposicion-climatica',
  icon: ExposureIcon,
};

/** The top nav's tabs: Exposición climática, then the risk views. */
export const HEADER_TABS: { label: string; to: LinkProps['to'] }[] = [EXPOSURE_TAB, ...RISK_TABS];

/** The analysis types, in display order, each its own route under `/analisis`. */
export const ANALYSIS_TYPES: (AnalysisLink & {
  /** The riesgo a parcel analysis runs; Exposición climática works by district instead. */
  riesgo?: Riesgo;
})[] = [EXPOSURE_TAB, ...RISK_TABS];

/** The landing's entries: every analysis type with its description, linking to its page. */
export const LANDING_ENTRIES = ANALYSIS_TYPES;

export type LandingEntry = (typeof LANDING_ENTRIES)[number];

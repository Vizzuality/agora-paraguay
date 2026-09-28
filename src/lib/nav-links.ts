import type { LinkProps } from '@tanstack/react-router';

import type { Riesgo } from '@/lib/api/metadata/schemas';

export type NavLink = {
  label: string;
  to: LinkProps['to'];
  replace?: boolean;
};

/** Way back to the selection screen, shared by the top nav and the footer. */
export const SELECTION_LINK: NavLink = { label: 'Selección de parcelas', to: '/' };

/**
 * The two risk views, in display order, each its own route under `/analisis`. The top
 * nav renders them as tabs; the pages take their title from here.
 */
export const RISK_TABS: { label: string; riesgo: Riesgo; to: LinkProps['to'] }[] = [
  { label: 'Riesgo sanitario', riesgo: 'sanitario', to: '/analisis/sanitario' },
  { label: 'Riesgo productivo', riesgo: 'productivo', to: '/analisis/productivo' },
];

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

import type { LinkProps } from '@tanstack/react-router';

import type { RiesgoTab } from '@/routes/analisis';

export type NavLink = {
  label: string;
  to: LinkProps['to'];
  search?: LinkProps['search'];
  replace?: boolean;
};

/** Way back to the selection screen, shared by the top nav and the footer. */
export const SELECTION_LINK: NavLink = { label: 'Selección de parcelas', to: '/' };

/** The two risk views, in display order. The top nav renders them as tabs. */
export const RISK_TABS: { label: string; riesgo: RiesgoTab }[] = [
  { label: 'Riesgo sanitario', riesgo: 'sanitario' },
  { label: 'Riesgo productivo', riesgo: 'productivo' },
];

/**
 * `RISK_TABS` as plain router links (for the footer). Switching risk views must
 * not stack history entries, or the browser's Back stops leaving the page —
 * same rule as the top nav's tabs.
 */
export const RISK_LINKS: NavLink[] = RISK_TABS.map(({ label, riesgo }) => ({
  label,
  to: '/analisis',
  search: { riesgo },
  replace: true,
}));

import { Link, type LinkProps } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { SELECTION_LINK } from '@/lib/nav-links';

/**
 * "Personalización del análisis" link (the analysis card's Editar, the footer): goes back to `/` and resumes the
 * selection, like the browser's Back — the areas and parcels are still in the store,
 * the panel lands on step 3 with the user's flips kept, the map framed on the areas
 * (`useFitToAreas`). Starting over is Reiniciar's job.
 */
export function SelectionLink({
  className,
  'aria-label': ariaLabel,
  children,
}: Readonly<{ className?: string; 'aria-label'?: string; children: ReactNode }> &
  Omit<LinkProps, 'to' | 'onClick' | 'children'>) {
  return (
    <Link to={SELECTION_LINK.to} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

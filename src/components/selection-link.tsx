import { Link, type LinkProps } from '@tanstack/react-router';
import { useSetAtom } from 'jotai';
import type { ReactNode } from 'react';

import { SELECTION_LINK } from '@/lib/nav-links';
import { restartSelectionAtom } from '@/store/draw';

/**
 * "Selección de parcelas" link (header and footer): goes to `/` and starts a new
 * selection — areas, parcels and analysis cleared, map empty on step 1. Renders outside
 * `<ClientOnly>` on purpose: `useSetAtom` only hands back a setter; the store is untouched
 * until the click.
 */
export function SelectionLink({
  className,
  children,
}: Readonly<{ className?: string; children: ReactNode }> &
  Omit<LinkProps, 'to' | 'onClick' | 'children'>) {
  const restart = useSetAtom(restartSelectionAtom);

  return (
    <Link to={SELECTION_LINK.to} onClick={() => restart()} className={className}>
      {children}
    </Link>
  );
}

import { Link, type LinkProps } from '@tanstack/react-router';
import { useSetAtom } from 'jotai';
import type { ReactNode } from 'react';

import { SELECTION_LINK } from '@/lib/nav-links';
import { restartSelectionAtom } from '@/store/draw';

/**
 * "Selección de parcelas", the way back from the analysis page — shared by the header
 * and the footer. Unlike the browser's Back, it starts a new selection: the areas, the
 * parcels and the previous analysis are cleared before `/` mounts, so the map comes back
 * empty on step 1. Renders outside `<ClientOnly>` on purpose: `useSetAtom` only hands
 * back a setter, nothing reads or writes the module store until the click.
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

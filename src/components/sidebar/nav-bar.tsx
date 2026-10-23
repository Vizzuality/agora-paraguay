import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { Logo } from '@/components/logo';

/**
 * Top bar of the sidebar: brand logo on the left, page-specific content (nav items,
 * actions) passed as children into the right-hand slot the design reserves
 * (node 5146:2382). On a mobile device the padding shrinks, and `below` is a row the
 * bar cannot hold beside the logo, rendered under it inside the same landmark.
 */
export function NavBar({ children, below }: Readonly<{ children?: ReactNode; below?: ReactNode }>) {
  return (
    <header className="flex w-full flex-col print:hidden">
      <div className="flex w-full items-center justify-between p-2 md:p-10">
        <Link to="/" aria-label="Inicio">
          <Logo className="h-[30px] w-auto text-primary" />
        </Link>
        {children && <nav className="flex items-center gap-2">{children}</nav>}
      </div>
      {below}
    </header>
  );
}

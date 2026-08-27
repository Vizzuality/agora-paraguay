import { Link } from '@tanstack/react-router';

import { Logo } from '@/components/logo';

/**
 * Top bar of the sidebar: brand logo on the left, page-specific content (nav items,
 * actions) passed as children into the right-hand slot the design reserves
 * (node 5146:2382).
 */
export function NavBar({ children }: Readonly<{ children?: React.ReactNode }>) {
  return (
    <header className="flex w-full items-center justify-between p-10">
      <Link to="/" aria-label="Ágora — inicio">
        <Logo className="h-[30px] w-auto text-primary" />
      </Link>
      {children && <nav className="flex items-center gap-2">{children}</nav>}
    </header>
  );
}

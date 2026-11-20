import { Link } from '@tanstack/react-router';

import { Logo } from '@/components/logo';
import { ANALYSIS_TYPES } from '@/lib/nav-links';

const LINK_CLASS =
  'flex h-11 items-center justify-center rounded-2xl px-8 text-sm text-primary-foreground';

/**
 * Bottom bar: brand logo on the left, a link to each analysis type on the right, restyled
 * for the navy band. Stacked and centred on a mobile device.
 */
export function Footer() {
  return (
    // The band spans the window; its content stops at the page frame's 1440px.
    <footer className="w-full bg-primary print:hidden">
      <div className="mx-auto flex w-full max-w-360 flex-col items-center gap-10 p-10 md:flex-row md:justify-between">
        <Link to="/" aria-label="AGORA, inicio">
          <Logo className="h-[30px] w-auto text-primary-foreground" />
        </Link>

        <nav
          aria-label="Tipos de análisis"
          className="flex flex-col items-center gap-2 md:flex-row"
        >
          {ANALYSIS_TYPES.map(({ label, to }) => (
            <Link key={label} to={to} className={LINK_CLASS}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

import { Link } from '@tanstack/react-router';

import { Logo } from '@/components/logo';
import { SelectionLink } from '@/components/selection-link';
import { RISK_LINKS, SELECTION_LINK } from '@/lib/nav-links';

const LINK_CLASS =
  'flex h-11 items-center justify-center rounded-2xl px-8 text-sm text-primary-foreground';

/**
 * Bottom bar of the analysis screen: brand logo on the
 * left, the three navigation links on the right. Same destinations as the top
 * `AnalysisNav`, restyled for the navy band. Stacked and centred on a mobile device.
 */
export function Footer() {
  return (
    // The band spans the window; its content stops at the page frame's 1440px.
    <footer className="w-full bg-primary print:hidden">
      <div className="mx-auto flex w-full max-w-360 flex-col items-center gap-10 p-10 md:flex-row md:justify-between">
        <Link to="/" aria-label="AGORA, inicio">
          <Logo className="h-[30px] w-auto text-primary-foreground" />
        </Link>

        <nav className="flex flex-col items-center gap-2 md:flex-row">
          <SelectionLink className={LINK_CLASS}>{SELECTION_LINK.label}</SelectionLink>
          {RISK_LINKS.map(({ label, to, replace }) => (
            <Link key={label} to={to} replace={replace} className={LINK_CLASS}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

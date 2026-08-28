import { Link } from '@tanstack/react-router';

import { Logo } from '@/components/logo';
import { RISK_LINKS, SELECTION_LINK } from '@/lib/nav-links';

const FOOTER_LINKS = [SELECTION_LINK, ...RISK_LINKS];

/**
 * Bottom bar of the analysis screen (Figma node 5180:11421): brand logo on the
 * left, the three navigation links on the right. Same destinations as the top
 * `AnalysisNav`, restyled for the navy band.
 */
export function Footer() {
  return (
    <footer className="flex w-full items-center justify-between bg-primary p-10">
      <Link to="/" aria-label="Ágora — inicio">
        <Logo className="h-[30px] w-auto text-primary-foreground" />
      </Link>

      <nav className="flex items-center gap-2">
        {FOOTER_LINKS.map(({ label, to, search, replace }) => (
          <Link
            key={label}
            to={to}
            search={search}
            replace={replace}
            className="flex h-11 items-center justify-center rounded-2xl px-8 text-sm text-primary-foreground"
          >
            {label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}

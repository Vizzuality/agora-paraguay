import { Link } from '@tanstack/react-router';
import { useSetAtom } from 'jotai';
import { ChevronRight } from 'lucide-react';

import { SettingCardIcon } from '@/components/settings/setting-card';
import { useSession } from '@/lib/auth/use-session';
import type { LandingEntry } from '@/lib/nav-links';
import { requestLoginForAtom } from '@/store/auth';

/**
 * One analysis type on the landing: icon, name, what it is for, the whole card a link to
 * its page. A private type chosen signed out opens the login modal instead, and signing
 * in goes on to it, as in Tipo de análisis. Reads atoms: render inside `<ClientOnly>`.
 */
export function AnalysisEntryCard({
  label,
  description,
  to,
  icon,
  requiresLogin,
}: Readonly<LandingEntry>) {
  const session = useSession();
  const requestLogin = useSetAtom(requestLoginForAtom);
  const gated = requiresLogin && !session;

  return (
    <Link
      to={to}
      onClick={(event) => {
        if (!gated) return;
        event.preventDefault();
        requestLogin(to);
      }}
      className="flex items-start gap-6 rounded-2xl bg-secondary py-8 pr-4 pl-6 text-primary transition-colors outline-none hover:bg-secondary-hover focus-visible:ring-2 focus-visible:ring-ring"
    >
      <SettingCardIcon icon={icon} />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <h2 className="text-base leading-[20.3px] tracking-[0.28px] text-foreground">{label}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <span aria-hidden className="flex size-8 shrink-0 items-center justify-center">
        <ChevronRight className="size-4" />
      </span>
    </Link>
  );
}

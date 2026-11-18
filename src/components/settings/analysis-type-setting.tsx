import { Link, useMatchRoute } from '@tanstack/react-router';
import { useSetAtom } from 'jotai';

import { SettingCardIcon, settingCardClass } from '@/components/settings/setting-card';
import { useSession } from '@/lib/auth/use-session';
import { ANALYSIS_TYPES } from '@/lib/nav-links';
import { requestLoginForAtom } from '@/store/auth';

/** The analysis type the open route shows, or `undefined` off the analysis routes. */
export function useCurrentAnalysisType() {
  const matchRoute = useMatchRoute();

  return ANALYSIS_TYPES.find(({ to }) => matchRoute({ to }) !== false);
}

/**
 * Tipo de análisis: one card per type, each a link to its route, the open one outlined.
 * The type stays the route, so a shared link lands on it. A private type chosen signed
 * out opens the login modal instead, and signing in goes on to it. Reads atoms: render
 * inside `<ClientOnly>`.
 */
export function AnalysisTypeSetting({ onChoose }: Readonly<{ onChoose?: () => void }>) {
  const current = useCurrentAnalysisType();
  const session = useSession();
  const requestLogin = useSetAtom(requestLoginForAtom);

  return (
    <nav aria-label="Tipo de análisis" className="grid grid-cols-3 gap-1.5 max-md:grid-cols-1">
      {ANALYSIS_TYPES.map(({ label, to, icon: Icon, requiresLogin }) => {
        const active = current?.to === to;
        const gated = requiresLogin && !session;

        return (
          <Link
            key={label}
            to={to}
            // Switching types must not stack history entries, like the old header tabs.
            replace
            onClick={(event) => {
              if (gated) {
                event.preventDefault();
                requestLogin(to);
                return;
              }
              onChoose?.();
            }}
            aria-current={active ? 'page' : undefined}
            className={settingCardClass({ active })}
          >
            <SettingCardIcon icon={Icon} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

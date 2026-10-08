import { useState } from 'react';

import { LoginCard } from '@/components/auth/login-card';
import { ResetPasswordCard } from '@/components/auth/reset-password-card';

/** Which card the gate shows. Local: leaving the page or logging in resets it. */
export type AuthView = 'login' | 'reset';

/**
 * The private-content gate: empty widget frames around the login
 * card, or around the reset card once the user asks to reset the password. On a
 * mobile device the card stands alone, full width.
 *
 * As the server-rendered fallback (`hydrating`) the card is inert, fields and button: a
 * submit before React takes over would be a native one, reloading the page with the
 * credentials in the URL, and anything typed into the fallback is lost when the client
 * gate replaces it. The real gate enables them once the client renders.
 */
export function LoginGate({ hydrating = false }: Readonly<{ hydrating?: boolean }>) {
  const [view, setView] = useState<AuthView>('login');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-stretch gap-4">
        <WidgetPlaceholder />
        {view === 'login' ? (
          <LoginCard disabled={hydrating} onReset={() => setView('reset')} />
        ) : (
          <ResetPasswordCard onBackToLogin={() => setView('login')} />
        )}
        <WidgetPlaceholder />
      </div>
      <div className="flex h-28 gap-4 max-md:hidden">
        <WidgetPlaceholder />
        <WidgetPlaceholder />
      </div>
    </div>
  );
}

/** Empty card used as placeholder. */
function WidgetPlaceholder() {
  return (
    <div aria-hidden className="min-w-50 flex-1 rounded-3xl border-3 border-border max-md:hidden" />
  );
}

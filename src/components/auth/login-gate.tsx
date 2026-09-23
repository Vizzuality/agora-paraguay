import { useState } from 'react';

import { LoginCard } from '@/components/auth/login-card';
import { ResetPasswordCard } from '@/components/auth/reset-password-card';

/** Which card the gate shows. Local: leaving the page or logging in resets it. */
export type AuthView = 'login' | 'reset';

/**
 * The private-content gate (Figma 5180:12021): empty widget frames around the login
 * card, or around the reset card once the user asks to reset the password.
 */
export function LoginGate() {
  const [view, setView] = useState<AuthView>('login');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-stretch gap-4">
        <WidgetPlaceholder />
        {view === 'login' ? (
          <LoginCard onReset={() => setView('reset')} />
        ) : (
          <ResetPasswordCard onBackToLogin={() => setView('login')} />
        )}
        <WidgetPlaceholder />
      </div>
      <div className="flex h-28 gap-4">
        <WidgetPlaceholder />
        <WidgetPlaceholder />
      </div>
    </div>
  );
}

/** Empty widget frame behind the gate (Figma 5180:11125). */
function WidgetPlaceholder() {
  return <div aria-hidden className="min-w-50 flex-1 rounded-3xl border-3 border-border" />;
}

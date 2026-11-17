import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { useSetAtom } from 'jotai';

import {
  AUTH_PAGE_CARD_CLASS,
  AuthCardPending,
  AuthPageFrame,
} from '@/components/auth/auth-page-frame';
import { ResetPasswordCard } from '@/components/auth/reset-password-card';
import { loginOpenAtom } from '@/store/auth';

/**
 * Restablecer contraseña, reached from the login modal: the request, then its
 * confirmation. Iniciar sesión on either card opens the login modal over the page.
 */
export const Route = createFileRoute('/restablecer-contrasena/')({
  component: ResetRequestPage,
});

function ResetRequestPage() {
  return (
    <AuthPageFrame title="Restablecer contraseña">
      {/* Inert until hydration: a submit before it would be a native one. */}
      <ClientOnly fallback={<AuthCardPending />}>
        <ResetRequest />
      </ClientOnly>
    </AuthPageFrame>
  );
}

function ResetRequest() {
  const openLogin = useSetAtom(loginOpenAtom);

  return (
    <ResetPasswordCard className={AUTH_PAGE_CARD_CLASS} onBackToLogin={() => openLogin(true)} />
  );
}

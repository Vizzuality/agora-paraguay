import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { User } from 'lucide-react';
import { useState } from 'react';

import { LoginCard } from '@/components/auth/login-card';
import type { AuthView } from '@/components/auth/login-gate';
import { ResetPasswordCard } from '@/components/auth/reset-password-card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { authMutations } from '@/lib/api/auth/queries';
import type { Session } from '@/lib/api/auth/schemas';
import { useSession, useSessionActions } from '@/lib/auth/use-session';

export function UserButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="secondary"
      className="size-12 rounded-full text-accent-foreground [&_svg:not([class*='size-'])]:size-6"
      aria-label="Iniciar sesión"
      {...props}
    >
      <User aria-hidden />
    </Button>
  );
}

/** The header's user button: the login popover while anonymous, the account menu once signed in. */
export function LoginDialog() {
  const session = useSession();

  return session ? <UserMenu session={session} /> : <LoginPopover />;
}

function LoginPopover() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AuthView>('login');

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Reopening always starts at the login form.
        if (!next) setView('login');
      }}
    >
      <PopoverTrigger asChild>
        <UserButton />
      </PopoverTrigger>
      {open && (
        <div
          aria-hidden
          data-slot="login-backdrop"
          className="fixed inset-0 z-40 animate-in bg-black/50 fade-in-0"
        />
      )}
      <PopoverContent
        align="end"
        sideOffset={20}
        // Radix gives the content role="dialog"; the label names it for AT.
        aria-label="Iniciar sesión"
        className="w-[411px] rounded-3xl border-0 p-0 shadow-lg"
        // Not modal, and only the backdrop dismisses: a modal popover disables pointer
        // events on the page and closes on any pointer-down or focus outside its content —
        // which is what a password manager's inline suggestion is, so it could never be
        // picked. Escape still closes.
        onInteractOutside={(event) => {
          const target = event.target instanceof Element ? event.target : null;

          if (!target?.closest('[data-slot="login-backdrop"]')) event.preventDefault();
        }}
      >
        {view === 'login' ? (
          <LoginCard
            className="w-full"
            onSuccess={() => setOpen(false)}
            onReset={() => setView('reset')}
          />
        ) : (
          <ResetPasswordCard className="w-full" onBackToLogin={() => setView('login')} />
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * The signed-in user's menu (Figma node 5653:1665). Restablecer contraseña is listed
 * but always disabled: resetting the password from inside a session is out of scope.
 * Staff get Administrar usuarios in between.
 */
function UserMenu({ session }: Readonly<{ session: Session }>) {
  const { clear } = useSessionActions();
  const mutation = useMutation({
    ...authMutations.logout(),
    // Success or failure, the client session ends: the cookie is HttpOnly, so nothing
    // more is possible from here.
    onSettled: clear,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <UserButton aria-label="Cuenta" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={20} className="w-56">
        <DropdownMenuItem disabled className="data-[disabled]:opacity-20">
          Restablecer contraseña
        </DropdownMenuItem>
        {session.isStaff && (
          <DropdownMenuItem asChild>
            <Link to="/usuarios">Administrar usuarios</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem disabled={mutation.isPending} onSelect={() => mutation.mutate()}>
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

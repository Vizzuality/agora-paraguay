import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
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
import { sessionAtom } from '@/store/auth';

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
  const session = useAtomValue(sessionAtom);

  return session ? <UserMenu /> : <LoginPopover />;
}

function LoginPopover() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AuthView>('login');

  return (
    <Popover
      modal
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
      {open && <div aria-hidden className="fixed inset-0 z-40 animate-in bg-black/50 fade-in-0" />}
      <PopoverContent
        align="end"
        sideOffset={20}
        // Radix gives the content role="dialog"; the label names it for AT.
        aria-label="Iniciar sesión"
        className="w-[411px] rounded-3xl border-0 p-0 shadow-lg"
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
 */
function UserMenu() {
  const setSession = useSetAtom(sessionAtom);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    ...authMutations.logout(),
    // Success or failure, the client session ends: the cookie is HttpOnly, so nothing
    // more is possible from here — and the private answers must not outlive the identity
    // that fetched them.
    onSettled: () => {
      queryClient.removeQueries({ queryKey: ['analysis', 'private'] });
      setSession(null);
    },
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
        <DropdownMenuItem disabled={mutation.isPending} onSelect={() => mutation.mutate()}>
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

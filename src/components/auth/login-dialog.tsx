import { Link, useNavigate } from '@tanstack/react-router';
import { useAtom, useSetAtom } from 'jotai';
import { User } from 'lucide-react';
import { useEffect } from 'react';

import { LoginCard } from '@/components/auth/login-card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Session } from '@/lib/api/auth/schemas';
import { useLogout, useSession } from '@/lib/auth/use-session';
import { loginOpenAtom } from '@/store/auth';

export function UserButton(props: Readonly<React.ComponentProps<typeof Button>>) {
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

/** The header's user button: the login modal while anonymous, the account menu once signed in. */
export function LoginDialog() {
  const session = useSession();

  return session ? <UserMenu session={session} /> : <LoginModal />;
}

/**
 * The user button that opens the login form in a modal, centred over a backdrop. The
 * gated pages open it too (`LoginRequired`); Restablecer contraseña leaves it for its own
 * page. Reads atoms: render inside `<ClientOnly>`.
 */
export function LoginModal() {
  const [open, setOpen] = useAtom(loginOpenAtom);
  const navigate = useNavigate();

  return (
    // Not modal, and only the backdrop dismisses: a modal dialog disables pointer events
    // on the page and closes on any pointer-down or focus outside its content, which is
    // what a password manager's inline suggestion is, so it could never be picked. Being
    // non-modal, Radix renders no overlay: the backdrop is ours. Escape still closes.
    <Dialog modal={false} open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <UserButton />
      </DialogTrigger>
      {open && (
        <div
          aria-hidden
          data-slot="login-backdrop"
          className="fixed inset-0 z-40 animate-in bg-black/50 fade-in-0"
        />
      )}
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="w-[411px] max-w-[calc(100%-1rem)] gap-0 rounded-3xl border-0 bg-transparent p-0 shadow-lg sm:max-w-[411px]"
        onInteractOutside={(event) => {
          const target = event.target instanceof Element ? event.target : null;

          if (!target?.closest('[data-slot="login-backdrop"]')) event.preventDefault();
        }}
      >
        {/* The card's own heading is visual; this names the dialog. */}
        <DialogTitle className="sr-only">Área privada</DialogTitle>
        <LoginCard
          className="w-full"
          onSuccess={() => setOpen(false)}
          onReset={() => {
            setOpen(false);
            void navigate({ to: '/restablecer-contrasena' });
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * What a page shows a signed-out user where its content goes: nothing, with the login
 * modal opened over it. Closing the modal leaves the page empty; the header's user
 * button opens it again. Render inside `<ClientOnly>`.
 */
export function LoginRequired() {
  const openLogin = useSetAtom(loginOpenAtom);

  useEffect(() => {
    openLogin(true);
  }, [openLogin]);

  return null;
}

/**
 * The signed-in user's menu. Restablecer contraseña is listed
 * but always disabled: resetting the password from inside a session is out of scope.
 * Staff get Administrar usuarios in between.
 */
function UserMenu({ session }: Readonly<{ session: Session }>) {
  const mutation = useLogout();

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

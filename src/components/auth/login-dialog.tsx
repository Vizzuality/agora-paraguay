import { useAtomValue } from 'jotai';
import { User } from 'lucide-react';
import { useState } from 'react';

import { LoginCard } from '@/components/auth/login-card';
import type { AuthView } from '@/components/auth/login-gate';
import { ResetPasswordCard } from '@/components/auth/reset-password-card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

export function LoginDialog() {
  const session = useAtomValue(sessionAtom);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AuthView>('login');

  return (
    <Popover
      modal
      open={session ? false : open}
      onOpenChange={(next) => {
        setOpen(next);
        // Reopening always starts at the login form.
        if (!next) setView('login');
      }}
    >
      <PopoverTrigger asChild>
        <UserButton />
      </PopoverTrigger>
      {open && !session && (
        <div aria-hidden className="fixed inset-0 z-40 animate-in bg-black/50 fade-in-0" />
      )}
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

import { useAtomValue } from 'jotai';
import { User } from 'lucide-react';
import { useState } from 'react';

import { LoginCard } from '@/components/login-card';
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

  return (
    // Gating `open` on the session makes the logged-in button a no-op and closes the
    // dialog the moment any login succeeds (e.g. through the in-page gate).
    // A popover, not a centered dialog, so the card anchors to the button (right
    // edges aligned, 20px below); `modal` plus the backdrop div make it behave like
    // one — dimmed page, no interaction behind.
    <Popover modal open={session ? false : open} onOpenChange={setOpen}>
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
        <LoginCard className="w-full" onSuccess={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

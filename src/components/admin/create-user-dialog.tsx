import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { useId, useState } from 'react';
import { ZodError } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { FLOATING_FIELD_CLASS, FloatingLabel } from '@/components/ui/floating-label';
import { Input } from '@/components/ui/input';
import { authMutations, authQueries } from '@/lib/api/auth/queries';
import type { CreatedUser } from '@/lib/api/auth/schemas';
import { ApiError } from '@/lib/api/http';
import { cn } from '@/lib/utils';

/** The "Añadir usuario" call to action (Figma 5575:3998): primary, 44 px, icon left. */
export function AddUserButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button className={cn('h-11 gap-2.5 rounded-2xl px-8 font-normal', className)} {...props}>
      <UserPlus className="size-6" aria-hidden />
      Añadir usuario
    </Button>
  );
}

function failureMessage(error: unknown): string {
  if (error instanceof ZodError) return 'Revise el nombre de usuario y el email.';
  if (error instanceof ApiError && error.detail !== null) return error.detail;

  return 'No se pudo crear el usuario. Inténtalo de nuevo en unos minutos.';
}

/**
 * The create-user card (Figma 5597:5302) as a modal: username and email, Añadir and
 * Cancelar. The account is created inactive; the answer carries the one-time link the
 * administrator hands the user to set a password, which the success view shows, since
 * there is no mail server to send it. Creating refreshes the list behind the dialog.
 */
export function CreateUserDialog({
  open,
  onOpenChange,
}: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void }>) {
  const [created, setCreated] = useState<CreatedUser | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        // Reopening always starts on an empty form.
        if (!next) setCreated(null);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="w-[411px] max-w-none gap-0 rounded-3xl border-0 bg-card p-0 text-card-foreground shadow-none"
      >
        {created ? <CreatedView created={created} /> : <CreateUserForm onCreated={setCreated} />}
      </DialogContent>
    </Dialog>
  );
}

function CreateUserForm({ onCreated }: Readonly<{ onCreated: (created: CreatedUser) => void }>) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const queryClient = useQueryClient();
  const mutation = useMutation({
    ...authMutations.createUser(),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: authQueries.users().queryKey });
      onCreated(created);
    },
  });

  return (
    <form
      className="flex flex-col gap-6 py-10"
      onSubmit={(event) => {
        event.preventDefault();

        const data = new FormData(event.currentTarget);
        const text = (name: string) => {
          const value = data.get(name);

          return typeof value === 'string' ? value : '';
        };

        mutation.mutate({ username: text('username'), email: text('email') });
      }}
    >
      <div className="flex flex-col gap-1.5 px-10">
        <DialogTitle className="text-4xl font-light tracking-[-0.015em]">
          Añadir usuario
        </DialogTitle>
        <DialogDescription>
          Rellene los campos para crear un nuevo usuario. Una vez creado, seleccione Restablecer
          contraseña para enviar un enlace al usuario para que defina su contraseña.
        </DialogDescription>
      </div>

      <div className="flex flex-col gap-4 px-10">
        <div className="relative">
          <Input
            id={`${fieldId}-username`}
            name="username"
            type="text"
            required
            autoComplete="off"
            placeholder=" "
            aria-invalid={mutation.isError || undefined}
            aria-describedby={mutation.isError ? errorId : undefined}
            className={FLOATING_FIELD_CLASS}
          />
          <FloatingLabel htmlFor={`${fieldId}-username`}>Nombre de usuario</FloatingLabel>
        </div>
        <div className="relative">
          <Input
            id={`${fieldId}-email`}
            name="email"
            type="email"
            required
            autoComplete="off"
            placeholder=" "
            aria-invalid={mutation.isError || undefined}
            aria-describedby={mutation.isError ? errorId : undefined}
            className={FLOATING_FIELD_CLASS}
          />
          <FloatingLabel htmlFor={`${fieldId}-email`}>Email</FloatingLabel>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-10">
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="h-11 w-full rounded-2xl font-normal"
        >
          {mutation.isPending ? 'Añadiendo…' : 'Añadir'}
        </Button>
        <DialogClose asChild>
          <Button type="button" variant="secondary" className="h-11 w-full rounded-2xl font-normal">
            Cancelar
          </Button>
        </DialogClose>

        {mutation.isError && (
          <p id={errorId} role="alert" className="text-sm text-destructive">
            {failureMessage(mutation.error)}
          </p>
        )}
      </div>
    </form>
  );
}

/** The created account and the link it needs, for the administrator to pass on. */
function CreatedView({ created }: Readonly<{ created: CreatedUser }>) {
  const [copied, setCopied] = useState(false);
  const expires = new Intl.DateTimeFormat('es-PY', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(created.expires_at));

  return (
    <div className="flex flex-col gap-6 py-10">
      <div className="flex flex-col gap-1.5 px-10">
        <DialogTitle className="text-4xl font-light tracking-[-0.015em]">
          Usuario creado
        </DialogTitle>
        <DialogDescription>
          {created.user.username} ya aparece en la lista. Envíele este enlace para que defina su
          contraseña; caduca el {expires}.
        </DialogDescription>
      </div>

      <p className="px-10 text-sm break-all">
        <a href={created.reset_link} className="text-primary underline underline-offset-4">
          {created.reset_link}
        </a>
      </p>

      <div className="flex flex-col gap-6 px-10">
        <Button
          type="button"
          className="h-11 w-full rounded-2xl font-normal"
          onClick={() => {
            void navigator.clipboard.writeText(created.reset_link).then(() => setCopied(true));
          }}
        >
          {copied ? 'Enlace copiado' : 'Copiar enlace'}
        </Button>
        <DialogClose asChild>
          <Button type="button" variant="secondary" className="h-11 w-full rounded-2xl font-normal">
            Cerrar
          </Button>
        </DialogClose>
      </div>
    </div>
  );
}

import { useMutation } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { ZodError } from 'zod';

import { AuthCard } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FLOATING_FIELD_CLASS, FloatingLabel } from '@/components/ui/floating-label';
import { Input } from '@/components/ui/input';
import { authMutations } from '@/lib/api/auth/queries';
import { ApiError } from '@/lib/api/http';
import { passwordErrors } from '@/lib/auth/password';

/** What the card tells the user when saving fails, from the most specific source it has. */
function failureMessage(error: unknown): string {
  // The schema's own refinement: Django's validators, run client-side, in Spanish.
  if (error instanceof ZodError) return error.issues.map((issue) => issue.message).join(' ');
  // The server's reason — a spent link, or a validator only it runs (common passwords).
  if (error instanceof ApiError && error.detail !== null) return error.detail;

  return 'No se pudo guardar la contraseña. Inténtalo de nuevo en unos minutos.';
}

/**
 * The new-password card behind a reset link (Figma 5596:1446): the password twice and
 * Guardar. Mismatch and Django's client-side validators are reported before the round
 * trip; whatever the server refuses is quoted as it said it. `onUpdated` swaps in the
 * confirmation.
 */
export function NewPasswordCard({
  token,
  className,
  onUpdated,
}: Readonly<{ token: string; className?: string; onUpdated: () => void }>) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const [localError, setLocalError] = useState<string | null>(null);
  const mutation = useMutation({ ...authMutations.confirmResetPassword(), onSuccess: onUpdated });

  const error = localError ?? (mutation.isError ? failureMessage(mutation.error) : null);

  return (
    <AuthCard className={className}>
      <form
        className="flex flex-col gap-6 py-10"
        onSubmit={(event) => {
          event.preventDefault();

          const data = new FormData(event.currentTarget);
          const text = (name: string) => {
            const value = data.get(name);

            return typeof value === 'string' ? value : '';
          };
          const password = text('password');

          if (password !== text('confirmation')) {
            setLocalError('Las contraseñas no coinciden.');

            return;
          }

          const invalid = passwordErrors(password);

          if (invalid.length > 0) {
            setLocalError(invalid.map((issue) => issue.message).join(' '));

            return;
          }

          setLocalError(null);
          mutation.mutate({ token, new_password: password });
        }}
      >
        <CardHeader className="gap-1.5 px-10">
          <CardTitle className="text-4xl font-semibold tracking-[-0.015em]">
            <h2>Nueva contraseña</h2>
          </CardTitle>
          <CardDescription>
            Introduzca su nueva contraseña para reemplazar la actual.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 px-10">
          <div className="relative">
            <Input
              id={`${fieldId}-password`}
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder=" "
              aria-invalid={error !== null || undefined}
              aria-describedby={error !== null ? errorId : undefined}
              className={FLOATING_FIELD_CLASS}
            />
            <FloatingLabel htmlFor={`${fieldId}-password`}>Nueva contraseña</FloatingLabel>
          </div>
          <div className="relative">
            <Input
              id={`${fieldId}-confirmation`}
              name="confirmation"
              type="password"
              required
              autoComplete="new-password"
              placeholder=" "
              aria-invalid={error !== null || undefined}
              aria-describedby={error !== null ? errorId : undefined}
              className={FLOATING_FIELD_CLASS}
            />
            <FloatingLabel htmlFor={`${fieldId}-confirmation`}>
              Repetir nueva contraseña
            </FloatingLabel>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-6 px-10">
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="h-11 w-full rounded-2xl font-normal"
          >
            {mutation.isPending ? 'Guardando…' : 'Guardar contraseña'}
          </Button>

          {error !== null && (
            <p id={errorId} role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </CardFooter>
      </form>
    </AuthCard>
  );
}

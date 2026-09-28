import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { authMutations } from '@/lib/api/auth/queries';

/**
 * TEMP(AGP-50): manual probe for `POST /api/auth/admin/users/create/` from the selection
 * panel. Needs an admin session in the browser. Remove once the admin screen exists.
 */
export function TempCreateUserButton() {
  const mutation = useMutation(authMutations.createUser());

  function create() {
    const stamp = Date.now().toString(36);

    mutation.mutate({
      username: `temp-${stamp}`,
      email: `temp-${stamp}@example.com`,
      first_name: 'Temp',
      last_name: 'User',
    });
  }

  return (
    <section
      aria-label="Crear usuario (temporal)"
      className="flex flex-col gap-2 px-6 py-4 text-sm"
    >
      <Button type="button" variant="secondary" onClick={create} disabled={mutation.isPending}>
        {mutation.isPending ? 'Creando usuario…' : 'Crear usuario (temporal)'}
      </Button>

      {mutation.isError && (
        <p role="alert" className="text-destructive">
          {mutation.error.message}
        </p>
      )}

      {mutation.isSuccess && (
        <pre className="overflow-x-auto rounded-md bg-secondary p-3 text-xs">
          {JSON.stringify(mutation.data, null, 2)}
        </pre>
      )}
    </section>
  );
}

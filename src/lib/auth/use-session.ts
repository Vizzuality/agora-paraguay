import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { authQueries } from '@/lib/api/auth/queries';
import type { Session } from '@/lib/api/auth/schemas';

/**
 * The session behind the Django cookie (`authQueries.me`), the one record of who is
 * signed in: the header and riesgo productivo swap the login gate for the identified
 * state on it, and a reload asks the cookie again instead of forgetting the user.
 * `null` while the first answer is pending or on an outage — private content stays
 * gated until the API says otherwise.
 */
export function useSession(): Session | null {
  const { data } = useQuery(authQueries.me());

  return data ?? null;
}

/**
 * How login and logout write the session: login asks `/me` again (the login answer
 * names the user, `/me` says whether they are staff) and resolves once it landed, so the
 * caller closes its dialog on a settled state; logout clears it and drops the private
 * analysis answers, which must not outlive the identity that fetched them.
 */
export function useSessionActions() {
  const queryClient = useQueryClient();

  return useMemo(() => {
    const { queryKey } = authQueries.me();

    return {
      refresh: () => queryClient.invalidateQueries({ queryKey, refetchType: 'all' }),
      clear: () => {
        queryClient.setQueryData(queryKey, null);
        queryClient.removeQueries({ queryKey: ['analysis', 'private'] });
      },
    };
  }, [queryClient]);
}

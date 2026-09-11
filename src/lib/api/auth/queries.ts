import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { fetchMe, login } from './client';
import type { Credentials } from './schemas';

// TO-DO - check with API if we can get this from the session
export const authQueries = {
  /** The session behind the cookie, `null` when anonymous. */
  me: () =>
    queryOptions({
      queryKey: ['auth', 'me'] as const,
      queryFn: fetchMe,
    }),
};

/** Login mutation. The resulting session is client state (`src/store/auth.ts`). */
export const authMutations = {
  login: () =>
    mutationOptions({
      mutationKey: ['auth', 'login'] as const,
      mutationFn: (credentials: Credentials) => login(credentials),
    }),
};

import { mutationOptions } from '@tanstack/react-query';

import { createUser, login, logout } from './client';
import type { CreateUserRequest, Credentials } from './schemas';

/*
 * TODO(auth-me): `GET /api/auth/me/` is parked. The session is client state set by
 * login (`src/store/auth.ts`); nothing reads this query yet, and the endpoint currently
 * answers an anonymous visitor with `400 {"isAuthenticated": false}` — a status
 * `fetchMe` reads as an API error, and a field name it does not know. Re-enable, with
 * `fetchMe` in `client.ts`, once the contract is settled with the backend.
 */
// export const authQueries = {
//   /** The session behind the cookie, `null` when anonymous. */
//   me: () =>
//     queryOptions({
//       queryKey: ['auth', 'me'] as const,
//       queryFn: fetchMe,
//     }),
// };

/** Auth mutations. Login's resulting session is client state (`src/store/auth.ts`). */
export const authMutations = {
  login: () =>
    mutationOptions({
      mutationKey: ['auth', 'login'] as const,
      mutationFn: (credentials: Credentials) => login(credentials),
    }),
  /** Ends the Django session; the client session (`sessionAtom`) is the caller's to clear. */
  logout: () =>
    mutationOptions({
      mutationKey: ['auth', 'logout'] as const,
      mutationFn: () => logout(),
    }),
  /** Admin only: creates an account and returns its one-time password setup link. */
  createUser: () =>
    mutationOptions({
      mutationKey: ['auth', 'admin', 'users', 'create'] as const,
      mutationFn: (request: CreateUserRequest) => createUser(request),
    }),
};

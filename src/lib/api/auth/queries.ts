import { mutationOptions, queryOptions } from '@tanstack/react-query';

import {
  checkResetToken,
  confirmResetPassword,
  createUser,
  deleteUser,
  fetchMe,
  getUsers,
  login,
  logout,
} from './client';
import type { CreateUserRequest, Credentials, ResetPasswordConfirmRequest } from './schemas';

export const authQueries = {
  /**
   * The session behind the cookie, `null` when anonymous. Asked once per page load and
   * then written by login and logout (`useSessionActions`). No retries: on an outage the
   * private content should gate at once, not after three back-offs.
   */
  me: () =>
    queryOptions({
      queryKey: ['auth', 'me'] as const,
      queryFn: fetchMe,
      staleTime: Infinity,
      retry: false,
    }),
  /**
   * Every account, for the administration page. No retries: a 403 is an answer, not a
   * hiccup. Mutations that change accounts invalidate `['auth', 'admin', 'users']`.
   */
  users: () =>
    queryOptions({
      queryKey: ['auth', 'admin', 'users'] as const,
      queryFn: getUsers,
      retry: false,
    }),
  /** Whether a reset link is still good. Asked once when its page opens; the answer does not age. */
  resetToken: (token: string) =>
    queryOptions({
      queryKey: ['auth', 'reset-password', 'check', token] as const,
      queryFn: () => checkResetToken(token),
      staleTime: Infinity,
      retry: false,
    }),
};

/** Auth mutations. Neither writes the session itself: `useSessionActions` refreshes or clears `authQueries.me`. */
export const authMutations = {
  login: () =>
    mutationOptions({
      mutationKey: ['auth', 'login'] as const,
      mutationFn: (credentials: Credentials) => login(credentials),
    }),
  /** Ends the Django session; the cached one is the caller's to clear. */
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
  /** Admin only: removes an account. The caller invalidates `authQueries.users()`. */
  deleteUser: () =>
    mutationOptions({
      mutationKey: ['auth', 'admin', 'users', 'delete'] as const,
      mutationFn: (id: number) => deleteUser(id),
    }),
  /** Sets the password behind a reset link. Anonymous; the user logs in afterwards. */
  confirmResetPassword: () =>
    mutationOptions({
      mutationKey: ['auth', 'reset-password', 'confirm'] as const,
      mutationFn: (request: ResetPasswordConfirmRequest) => confirmResetPassword(request),
    }),
};

import { z } from 'zod';

import { passwordErrors } from '@/lib/auth/password';

/**
 * Auth contract, against the Django session endpoints (`/api/auth/csrf/` then
 * `/api/auth/login/`, plus `/api/auth/me/`). The login body carries `identifier`, the
 * account's email: accounts have no username.
 */
export const credentialsSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
});

export type Credentials = z.infer<typeof credentialsSchema>;

/**
 * What the CSRF endpoint returns. Django's `ensure_csrf_cookie` views answer with a
 * bare `detail` and put the token in the `csrftoken` cookie only; some hand it back as
 * `csrfToken` too, so both are accepted and the cookie is the fallback (`client.ts`).
 */
export const csrfResponseSchema = z.looseObject({ csrfToken: z.string().min(1).optional() });

/**
 * The login body is not contractually fixed yet, so only the one field the UI can use
 * is declared and anything else passes through. Session state itself is the cookie.
 */
export const loginResponseSchema = z.looseObject({ email: z.string().min(1).optional() });

/**
 * `GET /api/auth/me/` — the user behind the session cookie. Anonymous is a 400 with
 * `isAuthenticated: false` and nothing else, hence every field optional.
 */
export const meResponseSchema = z.looseObject({
  id: z.number().optional(),
  email: z.string().min(1).optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  is_active: z.boolean().optional(),
  is_staff: z.boolean().optional(),
  isAuthenticated: z.boolean().optional(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;

/**
 * Password reset, as the backend serves it (there is no reset mail — an administrator
 * generates the link, `POST /api/auth/admin/users/{id}/generate-reset-link/`, and hands
 * it to the user; the link points at our `/restablecer-contrasena/{token}` page):
 *
 *  - `GET /api/auth/reset-password/check/{token}/` → `{ valid }`, always 200. Whether the
 *    page shows the form or "link expired".
 *  - `POST /api/auth/reset-password/confirm/` with `{ token, new_password }` → 200
 *    `{ detail }`; 400 `{ detail: 'Enlace inválido o expirado.' }` for a bad token, 400
 *    `{ new_password: [...] }` for Django's validators. Anonymous: no session needed.
 */
export const resetTokenSchema = z.uuid();

export const resetTokenCheckSchema = z.looseObject({ valid: z.boolean() });

/**
 * The client-side half of Django's `AUTH_PASSWORD_VALIDATORS` (length, numeric) runs in
 * the parse; similarity needs the user's attributes, which the reset page does not have.
 * The server checks all of them, plus the common-password list, and answers 400.
 */
export const resetPasswordConfirmSchema = z
  .object({
    token: resetTokenSchema,
    new_password: z.string().min(1),
  })
  .superRefine((body, context) => {
    for (const error of passwordErrors(body.new_password)) {
      context.addIssue({ code: 'custom', path: ['new_password'], message: error.message });
    }
  });

export type ResetPasswordConfirmRequest = z.infer<typeof resetPasswordConfirmSchema>;

/**
 * The identified user, in app vocabulary: the email is the account. `isStaff` opens the
 * administration (Administrar usuarios); the names are for the header/session UI.
 */
export const sessionSchema = z.object({
  email: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  isStaff: z.boolean().default(false),
});

export type Session = z.infer<typeof sessionSchema>;

/** The `/me` answer as a session, or `null` when it names nobody or says so itself. */
export function toSession(me: MeResponse): Session | null {
  if (me.isAuthenticated === false || me.email === undefined) return null;

  return sessionSchema.parse({
    email: me.email,
    firstName: me.first_name,
    lastName: me.last_name,
    isStaff: me.is_staff ?? false,
  });
}

/**
 * `POST /api/auth/admin/users/create/` — an administrator creates an account, inactive
 * until its password is set through the one-time link the answer carries. The spec
 * excerpt shows only the answer; the body is assumed to be the user's writable fields.
 */
export const createUserRequestSchema = z.object({
  email: z.email(),
  first_name: z.string().trim().optional(),
  last_name: z.string().trim().optional(),
});

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

/** A user as the admin endpoints return it — the same shape in the list and in a creation's answer. */
const adminUserSchema = z.looseObject({
  id: z.number().int(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  is_active: z.boolean(),
  is_staff: z.boolean(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;

/** `GET /api/auth/admin/users/` — every account, ordered by email. Administrators only (403 otherwise). */
export const adminUsersSchema = z.array(adminUserSchema);

/**
 * `POST /api/auth/admin/users/create/`'s answer. The live API echoes the user with its
 * names only — no `id`, `is_active` or `is_staff` — so the list is re-read, not patched
 * from this. `reset_link` is the one-time link as the backend builds it; the front end
 * hands it on untouched.
 */
export const createdUserSchema = z.looseObject({
  user: z.looseObject({
    email: z.string(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
  }),
  reset_link: z.url(),
  token: z.string().min(1),
  expires_at: z.iso.datetime(),
});

export type CreatedUser = z.infer<typeof createdUserSchema>;

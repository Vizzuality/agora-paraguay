import { z } from 'zod';

import { passwordErrors } from '@/lib/auth/password';

/**
 * Auth contract, against the Django session endpoints (`/api/auth/csrf/` then
 * `/api/auth/login/`, plus `/api/auth/me/`). The login body carries `identifier`, which
 * the API resolves as a username or an email.
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
export const loginResponseSchema = z.looseObject({ username: z.string().min(1).optional() });

/**
 * `GET /api/auth/me/` — the user behind the session cookie. Anonymous is a 400 with
 * `isAuthenticated: false` and nothing else, hence every field optional.
 */
export const meResponseSchema = z.looseObject({
  id: z.number().optional(),
  username: z.string().min(1).optional(),
  email: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  is_active: z.boolean().optional(),
  is_staff: z.boolean().optional(),
  isAuthenticated: z.boolean().optional(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;

/**
 * Setting a password goes through `POST /api/auth/password/reset/` in both cases the
 * platform has — there is no reset mail (no SMTP):
 *
 *  - An admin creates the account without a password and hands the user a one-time
 *    link, `/configurar-cuenta?uid=…&token=…`. The page posts those two with the
 *    password. A forgotten password is the same flow, with a new link from the admin.
 *  - A logged-in user changing their password posts the password alone; the session
 *    cookie identifies them.
 */
export const ACCOUNT_SETUP_PATH = '/configurar-cuenta';

/** The one-time link's search parameters, for the route to validate. */
export const accountSetupSearchSchema = z.object({
  uid: z.string().min(1),
  token: z.string().min(1),
});

export type AccountSetupSearch = z.infer<typeof accountSetupSearchSchema>;

/**
 * Runs the client-side half of Django's `AUTH_PASSWORD_VALIDATORS` (length, numeric).
 * Similarity needs the user's attributes, which only the logged-in form knows — it
 * calls `passwordErrors(password, { username })` itself; the server checks all of
 * them, plus the common-password list, and answers 400.
 */
export const setPasswordSchema = z
  .object({
    uid: z.string().min(1).optional(),
    token: z.string().min(1).optional(),
    password: z.string().min(1),
  })
  .superRefine((body, context) => {
    if ((body.uid === undefined) !== (body.token === undefined)) {
      context.addIssue({
        code: 'custom',
        path: ['token'],
        message: 'A one-time link carries both uid and token.',
      });
    }

    for (const error of passwordErrors(body.password)) {
      context.addIssue({ code: 'custom', path: ['password'], message: error.message });
    }
  });

export type SetPasswordRequest = z.infer<typeof setPasswordSchema>;

/**
 * The identified user, in app vocabulary. `isStaff` opens the administration
 * (Administrar usuarios); the names are for the header/session UI.
 */
export const sessionSchema = z.object({
  username: z.string().min(1),
  email: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  isStaff: z.boolean().default(false),
});

export type Session = z.infer<typeof sessionSchema>;

/** The `/me` answer as a session, or `null` when it names nobody or says so itself. */
export function toSession(me: MeResponse): Session | null {
  if (me.isAuthenticated === false || me.username === undefined) return null;

  return sessionSchema.parse({
    username: me.username,
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
  username: z.string().trim().min(1),
  email: z.email(),
  first_name: z.string().trim().optional(),
  last_name: z.string().trim().optional(),
});

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

/** A user as the admin endpoints return it — the same shape in the list and in a creation's answer. */
const adminUserSchema = z.looseObject({
  id: z.number().int(),
  username: z.string().min(1),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  is_active: z.boolean(),
  is_staff: z.boolean(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;

/** `GET /api/auth/admin/users/` — every account, ordered by username. Administrators only (403 otherwise). */
export const adminUsersSchema = z.array(adminUserSchema);

export const createdUserSchema = z.looseObject({
  user: adminUserSchema,
  reset_link: z.url(),
  token: z.string().min(1),
  expires_at: z.iso.datetime(),
});

export type CreatedUser = z.infer<typeof createdUserSchema>;

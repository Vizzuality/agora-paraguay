import { z } from 'zod';

import { passwordErrors } from '@/lib/auth/password';

/**
 * Auth contract, against the Django session endpoints (`/api/auth/csrf/` then
 * `/api/auth/login/`, plus `/api/auth/me/`). Django identifies users by `username`,
 * not email.
 */
export const credentialsSchema = z.object({
  username: z.string().trim().min(1),
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
 * `GET /api/auth/me/` — whether the session cookie is still valid. The body is not
 * fixed by the spec beyond that question, so both shapes a Django view would plausibly
 * answer with are accepted: an explicit `authenticated` flag, or the user's fields.
 */
export const meResponseSchema = z.looseObject({
  authenticated: z.boolean().optional(),
  username: z.string().min(1).optional(),
});

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

/** The session carries only what the UI needs to show an identified state. */
export const sessionSchema = z.object({
  username: z.string().min(1),
});

export type Session = z.infer<typeof sessionSchema>;

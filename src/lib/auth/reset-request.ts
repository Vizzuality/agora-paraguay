/**
 * Password resets are handled by hand: there is no mail server behind the API, so
 * "Solicitar" opens the user's mail client with a message to the platform admin, who
 * then issues a one-time link (`ACCOUNT_SETUP_PATH`). Pure, so the mailto is unit-tested.
 */

/** TODO(auth-admin-email): placeholder until the client names the real inbox. */
export const ADMIN_EMAIL = 'admin@admin.org';

export const RESET_REQUEST_SUBJECT = 'Recuperación de contraseña';

export function resetRequestBody(email: string): string {
  return [
    'Hola,',
    '',
    `Solicito restablecer la contraseña de mi cuenta de Ágora Paraguay asociada al email ${email}.`,
    '',
    'Gracias.',
  ].join('\n');
}

/** The `mailto:` the Solicitar button opens, with subject and body percent-encoded. */
export function resetRequestMailto(email: string): string {
  return mailtoHref(ADMIN_EMAIL, RESET_REQUEST_SUBJECT, resetRequestBody(email));
}

/** A `mailto:` with subject and body percent-encoded the way mail clients read them. */
export function mailtoHref(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({ subject, body });

  // URLSearchParams encodes spaces as "+", which mail clients read literally.
  return `mailto:${to}?${params.toString().replaceAll('+', '%20')}`;
}

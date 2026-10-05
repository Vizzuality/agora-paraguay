import { mailtoHref } from '@/lib/auth/reset-request';

/*
 * The mail an administrator sends a new user with the one-time link: there is no mail
 * server behind the API, so "Enviar por email" opens the admin's mail client addressed to
 * the account's email, the link and its expiry in the body. Pure, so the mailto is
 * unit-tested.
 */

export const SETUP_LINK_SUBJECT = 'Acceso a Ágora Paraguay';

export type SetupLinkMail = {
  username: string;
  email: string;
  /** The one-time link as the API answered it. */
  link: string;
  /** The expiry as printed ("7 de octubre de 2026, 9:45"). */
  expires: string;
};

export function setupLinkBody({ username, link, expires }: Omit<SetupLinkMail, 'email'>): string {
  return [
    `Hola, ${username}:`,
    '',
    'Se ha creado su cuenta de acceso a Ágora Paraguay. Defina su contraseña en este enlace:',
    link,
    '',
    `El enlace caduca el ${expires}.`,
    '',
    'Saludos.',
  ].join('\n');
}

/** The `mailto:` the Enviar por email button opens, addressed to the new user. */
export function setupLinkMailto(mail: SetupLinkMail): string {
  return mailtoHref(mail.email, SETUP_LINK_SUBJECT, setupLinkBody(mail));
}

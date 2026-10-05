import { describe, expect, it } from 'vitest';

import { SETUP_LINK_SUBJECT, setupLinkBody, setupLinkMailto } from '@/lib/auth/setup-link-mail';

const mail = {
  username: 'Paule',
  email: 'paule@example.org',
  link: 'http://api.example.org/api/auth/reset-password/ecb687e7-324c-4e9c-a03c-5e52218d77d7/',
  expires: '7 de octubre de 2026, 9:45',
};

describe('setupLinkMailto', () => {
  it('addresses the new user, with the subject and a body carrying the link and its expiry', () => {
    const url = new URL(setupLinkMailto(mail));

    expect(url.protocol).toBe('mailto:');
    expect(url.pathname).toBe('paule@example.org');
    expect(url.searchParams.get('subject')).toBe(SETUP_LINK_SUBJECT);
    expect(url.searchParams.get('body')).toBe(setupLinkBody(mail));
    expect(url.searchParams.get('body')).toContain(mail.link);
    expect(url.searchParams.get('body')).toContain('caduca el 7 de octubre de 2026, 9:45');
    expect(url.searchParams.get('body')).toContain('Hola, Paule:');
  });

  it('percent-encodes spaces and newlines so mail clients read them literally', () => {
    const href = setupLinkMailto(mail);

    expect(href).not.toContain('+');
    expect(href).not.toContain(' ');
    expect(href).toContain('%0A');
  });
});

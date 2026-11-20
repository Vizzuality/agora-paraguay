import { describe, expect, it } from 'vitest';

import {
  SETUP_LINK_SUBJECT,
  setupLinkBody,
  setupLinkMailto,
  setupLink,
} from '@/lib/auth/setup-link-mail';

const mail = {
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
    expect(url.searchParams.get('body')).toContain('Hola:');
  });

  it('percent-encodes spaces and newlines so mail clients read them literally', () => {
    const href = setupLinkMailto(mail);

    expect(href).not.toContain('+');
    expect(href).not.toContain(' ');
    expect(href).toContain('%0A');
  });
});

describe('setupLink', () => {
  it("puts the token on this app's own address, whatever host the backend used", () => {
    expect(setupLink('https://agora.example.org', 'abc-123')).toBe(
      'https://agora.example.org/restablecer-contrasena/abc-123',
    );
  });

  it('escapes a token that is not URL-safe', () => {
    expect(setupLink('http://localhost:3000', 'a/b c')).toBe(
      'http://localhost:3000/restablecer-contrasena/a%2Fb%20c',
    );
  });
});

import { describe, expect, it } from 'vitest';

import {
  mailtoHref,
  RESET_REQUEST_SUBJECT,
  resetRequestBody,
  resetRequestMailto,
} from '@/lib/auth/reset-request';

describe('mailtoHref', () => {
  it('comma-separates several recipients', () => {
    expect(mailtoHref(['a@x.org', 'b@x.org'], 's', 'b')).toMatch(/^mailto:a@x\.org,b@x\.org\?/);
  });
});

describe('resetRequestMailto', () => {
  const admins = ['a@x.org', 'b@x.org'];

  it('addresses every admin with the subject and a body naming the account email', () => {
    const href = resetRequestMailto('ana@example.org', admins);
    const url = new URL(href);

    expect(url.protocol).toBe('mailto:');
    expect(url.pathname).toBe(admins.join(','));
    expect(url.searchParams.get('subject')).toBe(RESET_REQUEST_SUBJECT);
    expect(url.searchParams.get('body')).toBe(resetRequestBody('ana@example.org'));
    expect(url.searchParams.get('body')).toContain('ana@example.org');
  });

  it('percent-encodes spaces and newlines so mail clients read them literally', () => {
    const href = resetRequestMailto('ana@example.org', admins);

    expect(href).not.toContain('+');
    expect(href).not.toContain(' ');
    expect(href).toContain('%0A');
  });
});

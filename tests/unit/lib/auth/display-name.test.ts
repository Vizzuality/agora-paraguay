import { describe, expect, it } from 'vitest';

import { sessionDisplayName } from '@/lib/auth/display-name';

const session = { email: 'ana@example.com', isStaff: false };

describe('sessionDisplayName', () => {
  it('joins first and last name', () => {
    expect(sessionDisplayName({ ...session, firstName: 'Ana', lastName: 'Lista' })).toBe(
      'Ana Lista',
    );
  });

  it('uses whichever name part exists', () => {
    expect(sessionDisplayName({ ...session, lastName: 'Lista' })).toBe('Lista');
  });

  it('falls back to the email when the names are missing or blank', () => {
    expect(sessionDisplayName(session)).toBe('ana@example.com');
    expect(sessionDisplayName({ ...session, firstName: '', lastName: '  ' })).toBe(
      'ana@example.com',
    );
  });
});

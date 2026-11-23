import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { clearSession } from '@/lib/auth/use-session';

describe('clearSession', () => {
  it('signs out and drops every answer only a signed-in user could fetch', () => {
    const client = new QueryClient();
    client.setQueryData(['auth', 'me'], { email: 'admin@example.com', isStaff: true });
    client.setQueryData(['auth', 'admin', 'users'], [{ email: 'someone@example.com' }]);
    client.setQueryData(['analysis', 'private', 'production'], { parcels: [] });
    client.setQueryData(['analysis', 'public', 'diseases'], { parcels: [] });

    clearSession(client);

    expect(client.getQueryData(['auth', 'me'])).toBeNull();
    expect(client.getQueryData(['auth', 'admin', 'users'])).toBeUndefined();
    expect(client.getQueryData(['analysis', 'private', 'production'])).toBeUndefined();
    // Public answers are anyone's: they stay.
    expect(client.getQueryData(['analysis', 'public', 'diseases'])).toEqual({ parcels: [] });
  });
});

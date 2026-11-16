import type { Session } from '@/lib/api/auth/schemas';

/** The name the account menu shows: first and last name when the backend has them, else the email. */
export function sessionDisplayName({ email, firstName, lastName }: Session): string {
  const name = [firstName, lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');

  return name || email;
}

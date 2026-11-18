import type { LinkProps } from '@tanstack/react-router';
import { atom } from 'jotai';

/** Whether the login modal is open: the header's user button and the gated pages open it. */
export const loginOpenAtom = atom(false);

/** The gated page the user asked for while signed out, reached once the login succeeds. */
export const loginRedirectAtom = atom<LinkProps['to'] | null>(null);

/** Opens the login modal on the way to a gated page: signing in goes on there. */
export const requestLoginForAtom = atom(null, (_get, set, to: LinkProps['to']) => {
  set(loginRedirectAtom, to);
  set(loginOpenAtom, true);
});

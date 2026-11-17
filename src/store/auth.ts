import { atom } from 'jotai';

/** Whether the login modal is open: the header's user button and the gated pages open it. */
export const loginOpenAtom = atom(false);

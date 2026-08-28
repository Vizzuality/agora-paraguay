import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * The root path only forwards to the selection page, so the pathname names the page
 * the way `/analisis` does. The search is carried along: old bookmarks with camera
 * params (`/?lng=…&lat=…&zoom=…`) keep their viewport.
 */
export const Route = createFileRoute('/')({
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/seleccion', search, replace: true });
  },
});

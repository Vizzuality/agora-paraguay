import { setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

/**
 * MapLibre v6 locates its render worker with `new URL("maplibre-gl-worker.mjs",
 * import.meta.url)` at runtime — a URL no bundler can rewrite: Vite's dev pre-bundle
 * and the production build both leave it pointing at a file that is never served, the
 * worker request 404s, the style never finishes loading and the map renders blank
 * (the v6 upgrade was reverted once over exactly this, in 875e865).
 *
 * `?worker&url` makes Vite compile the worker and its imports into a chunk of its own
 * and hand back its URL, in dev and build alike; `setWorkerUrl` points MapLibre at it.
 *
 * A module of its own so every component that creates a map (`index.tsx`,
 * `mini-map.tsx`) shares the one setup by importing it for its side effect.
 */
setWorkerUrl(maplibreWorkerUrl);

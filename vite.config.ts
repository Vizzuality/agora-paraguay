import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  /**
   * Where `/api` is forwarded, in dev and in the built server alike. The Django backend
   * sets a session cookie, and a cookie from another origin over plain http never sticks
   * in a browser — so the app talks to itself and relays: Vite in dev, Nitro in
   * production (Vercel, the container). Defaults to a local Django; set
   * `API_PROXY_TARGET` (shell, `.env`, or the Vercel project's build env) to reach a
   * shared backend. Read at build time: the rule is baked into the output.
   */
  const API_PROXY_TARGET =
    loadEnv(mode, process.cwd(), '').API_PROXY_TARGET ?? 'http://localhost:8000';

  /**
   * Django's CSRF check compares Origin/Referer against the host it serves; make the
   * relayed request look like it came from there. Same trick for both proxies.
   */
  const API_PROXY_HEADERS = { origin: API_PROXY_TARGET, referer: `${API_PROXY_TARGET}/` };

  return {
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: API_PROXY_TARGET,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              for (const [name, value] of Object.entries(API_PROXY_HEADERS)) {
                proxyReq.setHeader(name, value);
              }
            });
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
    },
    plugins: [
      tailwindcss(),
      tanstackStart(),
      nitroV2Plugin({
        compatibilityDate: '2026-08-11',
        // Unset locally and in Docker -> Nitro's default `node-server`, which emits
        // .output/server/index.mjs (the container entrypoint). Vercel sets
        // NITRO_PRESET=vercel so the target is chosen explicitly rather than sniffed.
        preset: process.env.NITRO_PRESET,
        // The production counterpart of `server.proxy` above: the deployed server relays
        // `/api` to the backend so the session cookie stays first-party and an https page
        // never calls the plain-http API directly (mixed content). The header override
        // makes Nitro run it in the function rather than as a CDN rewrite — intended.
        routeRules: {
          '/api/**': {
            proxy: { to: `${API_PROXY_TARGET}/api/**`, headers: API_PROXY_HEADERS },
          },
        },
      }),
      // react's vite plugin must come after start's vite plugin
      viteReact(),
    ],
  };
});

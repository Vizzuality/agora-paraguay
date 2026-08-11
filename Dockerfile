FROM node:24.19.0-alpine AS base

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public build-time configuration. Vite inlines VITE_* vars at build time, so they
# must be present here rather than at container start.
ARG VITE_USE_MOCK_API=true
ENV VITE_USE_MOCK_API=$VITE_USE_MOCK_API

RUN corepack enable pnpm && pnpm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 tanstack

COPY --from=builder --chown=tanstack:nodejs /app/.output ./.output

USER tanstack

EXPOSE 3000

ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]

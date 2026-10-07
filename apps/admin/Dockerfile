# syntax=docker/dockerfile:1.7
# Build from the monorepo root: docker build -f apps/admin/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://api.velkin.com -t velkin-admin .
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && apk add --no-cache libc6-compat
WORKDIR /repo

FROM base AS build
# NEXT_PUBLIC_* values are inlined at build time
ARG NEXT_PUBLIC_API_URL=https://api.velkin.com
ARG NEXT_PUBLIC_LOCALES=en,es
ARG NEXT_PUBLIC_ANALYTICS_URL=https://analytics.velkin.com
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_PUBLIC_LOCALES=$NEXT_PUBLIC_LOCALES NEXT_PUBLIC_ANALYTICS_URL=$NEXT_PUBLIC_ANALYTICS_URL
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/admin/package.json apps/admin/
COPY packages/ui/package.json packages/ui/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter @velkin/admin...
COPY packages/ui packages/ui
COPY apps/admin apps/admin
RUN pnpm --filter @velkin/admin build

FROM node:22-alpine AS runtime
RUN apk add --no-cache tini && addgroup -S app && adduser -S app -G app
ENV NODE_ENV=production PORT=3001 HOSTNAME=0.0.0.0 TZ=UTC NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build --chown=app:app /repo/apps/admin/.next/standalone ./
COPY --from=build --chown=app:app /repo/apps/admin/.next/static ./apps/admin/.next/static
USER app
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=3s --start-period=15s CMD wget -qO- http://127.0.0.1:3001/login >/dev/null || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/admin/server.js"]

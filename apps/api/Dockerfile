# syntax=docker/dockerfile:1.7
# Build from the monorepo root:  docker build -f apps/api/Dockerfile -t velkin-api .
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && apk add --no-cache openssl libc6-compat
WORKDIR /repo

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter @velkin/api...
COPY apps/api apps/api
RUN pnpm --filter @velkin/api build
RUN pnpm --filter @velkin/api deploy --legacy --prod /out \
 && rm -rf /out/dist && cp -r apps/api/dist /out/dist \
 && rm -rf /out/prisma && cp -r apps/api/prisma /out/prisma \
 && cp apps/api/prisma/seed-data.json /out/dist/prisma/seed-data.json \
 && cd /out && npx prisma generate --schema=./prisma/schema.prisma

FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl tini && addgroup -S app && adduser -S app -G app
ENV NODE_ENV=production TZ=UTC PORT=4000
WORKDIR /app
COPY --from=build --chown=app:app /out ./
USER app
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health >/dev/null || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/src/main.js"]

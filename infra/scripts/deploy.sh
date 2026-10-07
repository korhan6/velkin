#!/usr/bin/env bash
# Zero-downtime rollout of one service:  ./deploy.sh <service> <image-tag> [--migrate]
#   e.g. ./deploy.sh site-api 3f2c1ab --migrate
# Strategy: start a second container with the new image next to the old one, wait until Docker
# reports it healthy (Traefik only routes to healthy containers), then remove the old one.
set -euo pipefail
cd "$(dirname "$0")/.."

SERVICE="${1:?service}"
TAG="${2:?tag}"
MIGRATE="${3:-}"
VAR="$(echo "${SERVICE}" | tr 'a-z-' 'A-Z_')_TAG"   # site-api → SITE_API_TAG

# Persist the tag so reboots / later deploys keep the deployed version
touch .env.tags
if grep -q "^${VAR}=" .env.tags; then sed -i "s/^${VAR}=.*/${VAR}=${TAG}/" .env.tags; else echo "${VAR}=${TAG}" >>.env.tags; fi
./scripts/fetch-secrets.sh >/dev/null

set -a; source .env; set +a
if [ -n "${GHCR_TOKEN:-}" ]; then echo "$GHCR_TOKEN" | docker login ghcr.io -u "${GHCR_USER:-deploy}" --password-stdin >/dev/null; fi

echo "== pull ${SERVICE}:${TAG}"
docker compose pull "$SERVICE"

if [ "$MIGRATE" = "--migrate" ]; then
  echo "== database migrations (expand/contract: must be backward compatible with the running version)"
  docker compose run --rm --no-deps "$SERVICE" npx prisma migrate deploy --schema=./prisma/schema.prisma
fi

OLD=$(docker compose ps -q "$SERVICE" || true)
if [ -z "$OLD" ]; then
  docker compose up -d "$SERVICE"
  exit 0
fi

echo "== starting new container alongside the old one"
docker compose up -d --no-deps --no-recreate --scale "${SERVICE}=2" "$SERVICE"
NEW=$(docker compose ps -q "$SERVICE" | grep -v "$OLD" | head -n1)

for i in $(seq 1 60); do
  STATUS=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}running{{end}}' "$NEW")
  [ "$STATUS" = "healthy" ] && break
  if [ "$STATUS" = "unhealthy" ] || [ "$i" = 60 ]; then
    echo "✗ new container failed health checks — rolling back"
    docker logs --tail 80 "$NEW" || true
    docker rm -f "$NEW"
    exit 1
  fi
  sleep 2
done

echo "== draining old container"
sleep 5   # let Traefik pick up the new backend
docker stop -t 25 "$OLD" && docker rm "$OLD"
docker compose up -d --no-deps --no-recreate --scale "${SERVICE}=1" "$SERVICE"
docker image prune -f >/dev/null
echo "✓ ${SERVICE} now at ${TAG}"

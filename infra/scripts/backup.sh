#!/usr/bin/env bash
# Daily logical backups of EVERY project database → S3 bucket in ANOTHER region.
# Bucket setup (once): versioning ON, SSE-KMS or SSE-S3, lifecycle: Glacier IR after 30 d, expire after 365 d.
set -euo pipefail
cd "$(dirname "$0")/.."
source .env

BUCKET="${BACKUP_BUCKET:?set BACKUP_BUCKET in SSM /velkin/core}"
BUCKET_REGION="${BACKUP_REGION:-us-west-2}"
STAMP=$(date -u +%Y-%m-%dT%H%MZ)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

DBS=$(docker compose exec -T postgres psql -U postgres -At -c "SELECT datname FROM pg_database WHERE NOT datistemplate AND datname <> 'postgres'")
for db in $DBS; do
  echo "→ $db"
  docker compose exec -T postgres pg_dump -U postgres -Fc --no-owner "$db" >"$TMP/$db.dump"
  aws s3 cp "$TMP/$db.dump" "s3://$BUCKET/postgres/$db/$STAMP.dump" --region "$BUCKET_REGION" --sse AES256 --only-show-errors
done
docker compose exec -T postgres pg_dumpall -U postgres --globals-only >"$TMP/globals.sql"
aws s3 cp "$TMP/globals.sql" "s3://$BUCKET/postgres/_globals/$STAMP.sql" --region "$BUCKET_REGION" --sse AES256 --only-show-errors
echo "✓ backup $STAMP uploaded to s3://$BUCKET ($BUCKET_REGION)"

# Restore one DB:
#   aws s3 cp s3://$BUCKET/postgres/velkin_site/<stamp>.dump - | docker compose exec -T postgres pg_restore -U postgres -d velkin_site --clean --if-exists

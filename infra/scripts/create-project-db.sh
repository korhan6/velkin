#!/usr/bin/env bash
# Adds a database + role for a new project on the running Postgres and stores its password in SSM.
#   ./create-project-db.sh myproj
set -euo pipefail
cd "$(dirname "$0")/.."
NAME="${1:?project name}"
DB="${NAME//-/_}"
PASS=$(openssl rand -hex 24)
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres <<SQL
CREATE ROLE "$DB" LOGIN PASSWORD '$PASS';
CREATE DATABASE "$DB" OWNER "$DB";
REVOKE ALL ON DATABASE "$DB" FROM PUBLIC;
SQL
aws ssm put-parameter --region "${AWS_REGION:-us-east-1}" --type SecureString --overwrite \
  --name "/velkin/$NAME/DATABASE_URL" --value "postgresql://$DB:$PASS@postgres:5432/$DB?schema=public"
echo "✓ database $DB created; DATABASE_URL stored at /velkin/$NAME/DATABASE_URL"

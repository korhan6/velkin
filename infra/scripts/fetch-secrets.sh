#!/usr/bin/env bash
# Renders env files from AWS SSM Parameter Store (SecureString) using the instance role.
#   /velkin/core/<KEY>       → infra/.env
#   /velkin/site-api/<KEY>   → infra/env/site-api.env
#   /velkin/<project>/<KEY>  → infra/env/<project>.env
set -euo pipefail
cd "$(dirname "$0")/.."
REGION="${AWS_REGION:-us-east-1}"
umask 077
mkdir -p env

render() {
  local path="$1" out="$2"
  aws ssm get-parameters-by-path --region "$REGION" --path "$path" --with-decryption --recursive \
    --query 'Parameters[*].[Name,Value]' --output text |
    while IFS=$'\t' read -r name value; do
      printf '%s=%s\n' "${name##*/}" "$value"
    done >"$out.tmp"
  mv "$out.tmp" "$out"
  echo "✓ $out ($(wc -l <"$out") keys)"
}

render /velkin/core .env.ssm
# .env = committed defaults (.env.base) + secrets (SSM) + deployed image tags (.env.tags, written by deploy.sh)
touch .env.tags
# PROJECT_DATABASES references other keys (${SITE_DB_PASSWORD}…), so it must come last
{ cat .env.base; grep -v '^PROJECT_DATABASES=' .env.ssm; grep '^PROJECT_DATABASES=' .env.ssm || true; cat .env.tags; } >.env
rm -f .env.ssm

for dir in $(aws ssm get-parameters-by-path --region "$REGION" --path /velkin --recursive --query 'Parameters[*].Name' --output text | tr '\t' '\n' | awk -F/ '{print $3}' | sort -u); do
  [ "$dir" = "core" ] && continue
  render "/velkin/$dir" "env/$dir.env"
done

#!/usr/bin/env bash
# Restricts the instance Security Group so ports 80/443 accept ONLY Cloudflare IPs.
# This makes the origin unreachable except through the CDN/WAF and keeps CF-Connecting-IP trustworthy.
#   SG_ID=sg-0123 ./sync-cloudflare-sg.sh       (run from a workstation with EC2 permissions; re-run monthly)
set -euo pipefail
SG_ID="${SG_ID:?set SG_ID}"
REGION="${AWS_REGION:-us-east-1}"
V4=$(curl -fsSL https://www.cloudflare.com/ips-v4)
V6=$(curl -fsSL https://www.cloudflare.com/ips-v6)

perms() {
  local port=$1
  jq -n --argjson p "$port" --arg v4 "$V4" --arg v6 "$V6" '{
    IpProtocol:"tcp", FromPort:$p, ToPort:$p,
    IpRanges: ($v4 | split("\n") | map(select(length>0)) | map({CidrIp:., Description:"Cloudflare"})),
    Ipv6Ranges: ($v6 | split("\n") | map(select(length>0)) | map({CidrIpv6:., Description:"Cloudflare"}))
  }'
}

# Remove existing 80/443 rules, then add Cloudflare ranges
CURRENT=$(aws ec2 describe-security-groups --region "$REGION" --group-ids "$SG_ID" --query 'SecurityGroups[0].IpPermissions[?FromPort==`80`||FromPort==`443`]')
[ "$CURRENT" != "[]" ] && aws ec2 revoke-security-group-ingress --region "$REGION" --group-id "$SG_ID" --ip-permissions "$CURRENT" >/dev/null
aws ec2 authorize-security-group-ingress --region "$REGION" --group-id "$SG_ID" --ip-permissions "[$(perms 80),$(perms 443)]" >/dev/null
echo "✓ $SG_ID: 80/443 open to Cloudflare only (no SSH rule — use SSM Session Manager)"

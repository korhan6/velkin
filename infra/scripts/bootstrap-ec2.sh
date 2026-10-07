#!/usr/bin/env bash
# One-time hardening + Docker setup for Ubuntu 24.04 LTS (arm64/Graviton or x86_64).
# Run as root via SSM Session Manager:  sudo bash bootstrap-ec2.sh
set -euo pipefail

DEPLOY_USER=deploy
APP_DIR=/opt/velkin
export DEBIAN_FRONTEND=noninteractive

echo "== System update & base packages"
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg unzip jq git fail2ban unattended-upgrades apt-listchanges chrony

echo "== Automatic security updates (reboot at 04:30 UTC if required)"
cat >/etc/apt/apt.conf.d/52velkin-unattended <<'EOF'
Unattended-Upgrade::Allowed-Origins { "${distro_id}:${distro_codename}-security"; "${distro_id}ESMApps:${distro_codename}-apps-security"; };
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:30";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
EOF
cat >/etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF

echo "== Time in UTC"
timedatectl set-timezone UTC
systemctl enable --now chrony

echo "== Docker Engine + Compose plugin"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" >/etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
cat >/etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "20m", "max-file": "5" },
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true
}
EOF
systemctl enable --now docker
systemctl restart docker

echo "== AWS CLI v2"
if ! command -v aws >/dev/null; then
  ARCH=$(uname -m); [ "$ARCH" = "aarch64" ] && PKG=awscli-exe-linux-aarch64.zip || PKG=awscli-exe-linux-x86_64.zip
  curl -fsSL "https://awscli.amazonaws.com/$PKG" -o /tmp/awscli.zip && unzip -q /tmp/awscli.zip -d /tmp && /tmp/aws/install && rm -rf /tmp/aws /tmp/awscli.zip
fi

echo "== SSM agent (preinstalled on Ubuntu AMIs via snap)"
snap list amazon-ssm-agent >/dev/null 2>&1 || snap install amazon-ssm-agent --classic
systemctl enable --now snap.amazon-ssm-agent.amazon-ssm-agent.service || true

echo "== Non-root deploy user"
id -u "$DEPLOY_USER" >/dev/null 2>&1 || useradd -m -s /bin/bash "$DEPLOY_USER"
usermod -aG docker "$DEPLOY_USER"
mkdir -p "$APP_DIR" && chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

echo "== SSH hardening (access is via SSM; SSH port should be closed in the Security Group)"
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/; s/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl reload ssh || true

echo "== fail2ban (sshd, in case SSH is ever opened)"
cat >/etc/fail2ban/jail.d/velkin.local <<'EOF'
[sshd]
enabled = true
maxretry = 5
bantime = 1h
findtime = 10m
EOF
systemctl enable --now fail2ban

echo "== Kernel / network tuning"
cat >/etc/sysctl.d/99-velkin.conf <<'EOF'
net.core.somaxconn = 4096
net.ipv4.tcp_fin_timeout = 15
net.ipv4.ip_local_port_range = 10240 65000
vm.swappiness = 10
vm.overcommit_memory = 1
EOF
sysctl --system >/dev/null

echo "== 2 GB swap (safety net for builds/spikes)"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi

echo "== Backup timer"
install -m 0644 "$(dirname "$0")/../systemd/velkin-backup.service" /etc/systemd/system/ 2>/dev/null || true
install -m 0644 "$(dirname "$0")/../systemd/velkin-backup.timer" /etc/systemd/system/ 2>/dev/null || true
systemctl daemon-reload
systemctl enable --now velkin-backup.timer 2>/dev/null || echo "   (copy repo to $APP_DIR then re-run to enable backups)"

echo "✓ Bootstrap complete. Next: clone the repo to $APP_DIR as $DEPLOY_USER and follow infra/README.md"

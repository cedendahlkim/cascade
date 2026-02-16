#!/bin/bash
# Gracestack AI Lab — Server setup script
# Run on fresh Ubuntu 24.04 VPS

set -euo pipefail

echo "=== Gracestack AI Lab — Server Setup ==="

# 1. Update system
echo "[1/5] Updating system..."
apt-get update -qq && apt-get upgrade -y -qq

# 2. Install Docker
echo "[2/5] Installing Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

# 3. Install Docker Compose plugin
echo "[3/5] Installing Docker Compose..."
if ! docker compose version &> /dev/null; then
  apt-get install -y -qq docker-compose-plugin
fi

# 4. Setup firewall
echo "[4/5] Configuring firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

# 5. Create app directory
echo "[5/5] Creating app directory..."
mkdir -p /opt/gracestack
cd /opt/gracestack

echo ""
echo "=== Server ready! ==="
echo "Next: upload project files to /opt/gracestack and run docker compose up -d"

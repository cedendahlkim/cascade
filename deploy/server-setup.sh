#!/bin/bash
set -e

echo "=== Gracestack Server Setup ==="

# Fix Docker repo if broken
rm -f /etc/apt/sources.list.d/docker.list

# Install Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

ARCH=$(dpkg --print-architecture)
CODENAME=$(. /etc/os-release && echo "$VERSION_CODENAME")
echo "deb [arch=${ARCH} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${CODENAME} stable" > /etc/apt/sources.list.d/docker.list

apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
docker --version
docker compose version
echo "=== Docker OK ==="

# Create user kim
if ! id kim &>/dev/null; then
    useradd -m -s /bin/bash -G docker kim
    echo "Created user kim"
else
    usermod -aG docker kim
    echo "User kim exists, added to docker group"
fi

# Setup SSH for kim
mkdir -p /home/kim/.ssh
cp /root/.ssh/authorized_keys /home/kim/.ssh/
chown -R kim:kim /home/kim/.ssh
chmod 700 /home/kim/.ssh
chmod 600 /home/kim/.ssh/authorized_keys

# Clone repo
if [ ! -d /home/kim/cascade-remote ]; then
    cd /home/kim
    sudo -u kim git clone https://github.com/cedendahlkim/cascade.git cascade-remote
    echo "=== Repo cloned ==="
else
    cd /home/kim/cascade-remote
    sudo -u kim git pull
    echo "=== Repo updated ==="
fi

# Create landing page dir
mkdir -p /home/kim/cascade-remote/landing
if [ -d /home/kim/cascade-remote/deploy/landing ]; then
    cp -r /home/kim/cascade-remote/deploy/landing/* /home/kim/cascade-remote/landing/ 2>/dev/null || true
fi

echo "=== Setup complete ==="

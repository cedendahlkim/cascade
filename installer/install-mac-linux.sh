#!/bin/bash
# Cascade Remote — Computer Agent Installer (Mac/Linux)

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║   Cascade Remote — Computer Agent    ║"
echo "  ║   One-Click Installer (Mac/Linux)    ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[!] Node.js not found. Installing..."
    if command -v brew &> /dev/null; then
        brew install node
    elif command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y nodejs
    else
        echo "[!] Could not auto-install Node.js."
        echo "[!] Please install from: https://nodejs.org"
        exit 1
    fi
fi

echo "[OK] Node.js $(node --version)"

# Setup directory
AGENT_DIR="$HOME/cascade-agent"
mkdir -p "$AGENT_DIR"

# Copy agent.mjs from same directory as this script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cp "$SCRIPT_DIR/agent.mjs" "$AGENT_DIR/agent.mjs"

# Create package.json
cat > "$AGENT_DIR/package.json" << 'EOF'
{"name":"cascade-agent","type":"module","dependencies":{"socket.io-client":"^4.7.0"}}
EOF

# Install dependencies
echo "[*] Installing dependencies..."
cd "$AGENT_DIR"
npm install --silent 2>/dev/null
echo "[OK] Ready!"

# Ask for URL
echo ""
read -p "  Enter bridge URL (or press Enter for localhost): " BRIDGE
BRIDGE=${BRIDGE:-http://localhost:3031}

echo ""
node agent.mjs "$BRIDGE"

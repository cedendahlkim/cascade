FROM node:22-slim

WORKDIR /app

# Install Python 3 for Frankenstein AI training + docker CLI for Kali toolbox exec
RUN apt-get update -qq && apt-get install -y -qq python3 python3-pip python3-venv git docker.io && \
    rm -rf /var/lib/apt/lists/*

# Install ALL dependencies (including devDeps for build)
COPY bridge/package*.json ./bridge/
RUN cd bridge && npm ci

COPY web/package*.json ./web/
RUN cd web && npm ci

# Copy source
COPY bridge/ ./bridge/
COPY web/ ./web/

# Copy Frankenstein AI source and install Python deps
COPY frankenstein-ai/ ./frankenstein-ai/
RUN pip3 install --no-cache-dir --break-system-packages rich numpy google-genai openai anthropic requests && \
    pip3 install --no-cache-dir --break-system-packages torch --index-url https://download.pytorch.org/whl/cpu

# Build bridge (needs typescript from devDeps)
RUN cd bridge && chmod +x node_modules/.bin/* 2>/dev/null; npx tsc

# Build web (needs env vars at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
RUN cd web && chmod +x node_modules/.bin/* 2>/dev/null; VITE_SUPABASE_URL=$VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY npm run build

# Prune devDependencies for smaller image
RUN cd bridge && npm prune --omit=dev && cd ../web && rm -rf node_modules

# Bridge serves the web dist
EXPOSE 3031

WORKDIR /app/bridge
CMD ["node", "dist/index.js"]

# Cascade Remote

Mobile/web remote access for **Windsurf Cascade** — inspired by [Happy Coder](https://github.com/slopus/happy) and [MCP Bridge API](https://github.com/INQUIRELAB/mcp-bridge-api).

## Architecture

```
Windsurf/Cascade ←→ MCP Server (stdio) ←→ Bridge Server (Express+Socket.IO) ←→ PWA (mobile/web)
```

### Components

| Package | Description |
|---|---|
| `mcp-server/` | MCP server (stdio) with tools: `send_to_mobile`, `read_mobile_messages`, `ask_mobile`, `mobile_status` |
| `bridge/` | Express + Socket.IO relay server (port 3031) |
| `web/` | React + Vite + Tailwind PWA for mobile access |

## Quick Start

### 1. Install dependencies

```bash
npm run install:all
npm install
```

### 2. Start bridge + web dev servers

```bash
npm run dev
```

- **Web app:** http://localhost:5173
- **Bridge server:** http://localhost:3031

### 3. Add MCP server to Windsurf

Add to your Windsurf MCP config (`~/.codeium/windsurf/mcp_config.json`):

```json
{
  "mcpServers": {
    "cascade-remote": {
      "command": "npx",
      "args": ["tsx", "C:/Users/kim/CascadeProjects/cascade-remote/mcp-server/src/index.ts"]
    }
  }
}
```

### 4. Open on your phone

Open `http://<your-local-ip>:5173` on your phone (same network).

## Features

- 📱 **Mobile chat** — Send messages to Cascade from your phone
- 🔔 **Notifications** — Cascade can notify you when it needs attention
- ❓ **Ask & approve** — Cascade can ask questions, you answer from mobile
- ⚡ **Real-time** — Socket.IO for instant message delivery
- 📲 **PWA** — Install as app on your phone

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `CASCADE_REMOTE_BRIDGE_URL` | `http://localhost:3031` | Bridge URL (for MCP server) |
| `PORT` | `3031` | Bridge server port |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3031` | CORS origins |
| `VITE_BRIDGE_URL` | (auto) | Bridge URL (for web client) |

## License

MIT

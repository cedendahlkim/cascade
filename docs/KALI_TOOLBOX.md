# Kali Toolbox (server)

Goal: run the full Kali CLI toolset on the server so Frankenstein + all other agents can use it via CLI.

This repo adds a `kali` service in `docker-compose.yml` (builds from `deploy/kali/Dockerfile`) and enables:
- Agent tool: `run_command` with `runner: "kali"`
- Bridge endpoint: `POST /api/workspace/ai/terminal` with `runner: "kali"`
- Autopilot mission endpoint: `POST /api/workspace/ai/mission` supports `runner` + `verify.runner`

## Environment variables

- `KALI_METAPACKAGE` (default: `kali-linux-large`)
  - Examples: `kali-tools-top10`, `kali-linux-default`, `kali-linux-large`, `kali-linux-everything` (VERY large)
- `KALI_CONTAINER_NAME` (default: `gracestack-kali`)
- `KALI_WORKSPACE_ROOT` (default: same as Bridge workspace root)

Example:

```env
KALI_METAPACKAGE=kali-linux-large
KALI_CONTAINER_NAME=gracestack-kali
```

## Start

```bash
docker compose up -d --build
```

## Usage

### Bridge API (workspace terminal)

`POST /api/workspace/ai/terminal`

```json
{
  "command": "nmap -sV -Pn example.com",
  "runner": "kali"
}
```

### Agent tool (run_command)

```json
{
  "command": "sqlmap --help",
  "runner": "kali"
}
```

## Security / risk

`runner: "kali"` requires mounting the Docker socket into the Bridge container (`/var/run/docker.sock`).
That effectively gives the Bridge process high control over Docker on the host.

Only run this on infrastructure you control, and restrict access (firewall/VPN/Zero Trust).

---
description: Deploy Gracestack AI Lab to server (Docker Compose)
---

# Deploy to server (Ubuntu VPS)

## Preconditions

- Server has Docker + Docker Compose plugin installed.
- Repo is cloned to: `/home/kim/cascade-remote`
- Required env files exist on the server:
  - `/home/kim/cascade-remote/bridge/.env` (runtime secrets / API keys)
  - `/home/kim/cascade-remote/.env` (build args like `SUPABASE_URL`, `SUPABASE_ANON_KEY`)
  - Optional: `/home/kim/cascade-remote/frankenstein-ai/.env.local` (trading config; never commit keys)

## Steps

1. Pull latest code

   ```bash
   cd /home/kim/cascade-remote
   git pull
   ```

   No-`cd` variant:

   ```bash
   git -C /home/kim/cascade-remote pull
   ```

2. Rebuild + restart services

   ```bash
   docker compose up -d --build
   ```

   No-`cd` variant:

   ```bash
   docker compose -f /home/kim/cascade-remote/docker-compose.yml \
     --project-directory /home/kim/cascade-remote \
     up -d --build
   ```

3. Verify health/logs

   ```bash
   docker compose ps
   # Bridge logs (websocket + api)
   docker compose logs -f bridge
   ```

4. If nginx/certbot is enabled

   - Ensure DNS points to the server.
   - Validate that ports 80/443 are open.
   - Then restart nginx:

     ```bash
     docker compose restart nginx
     ```

## Rollback (quick)

```bash
cd /home/kim/cascade-remote
git log --oneline -n 10
# pick a previous SHA
git checkout <sha>
docker compose up -d --build
```

# Deploying junkyardgold.com

Push to `main` → GitHub Actions (`.github/workflows/deploy.yml`):

1. **Quality check**: lint, typecheck, and a full build that applies the database migrations to a throwaway Postgres.
2. **Build**: Docker image → `ghcr.io/doreactnow/junkyard_gold:latest` and `:<commit sha>`.
3. **Deploy** (only when the repo variable `DEPLOY_ENABLED` is `true`): over SSH to the VPS, in `/opt/junkyard_gold`:
   back up the database → (first time only) move v1's files into `_v1_archive_<date>/` → write `.env` from
   GitHub secrets → pull the image → `docker compose -f docker-compose.prod.yml up -d --remove-orphans` →
   wait for `/api/health`.

The app container runs `prisma migrate deploy` on start, then the site. It also sends queued texts every
minute and keeps the RingCentral webhook alive, so there is no separate worker or cron.

## How it replaces v1

| | v1 | v2 |
|---|---|---|
| Containers | `web` (nginx) + `api` (Express) + `db` | `app` (Next.js) + the **same** `db` |
| Database | Postgres 16, db `junkyard`, volume `junkyard_gold_pgdata` | same container, volume and password; v2's tables live in schema `app`, v1's old tables stay untouched in `public` |
| Traefik | network `root_default`, entrypoint `websecure`, resolver `mytlschallenge`, www → apex | identical (router `jg-app`) |
| Opt-outs | `public.optouts` | copied into v2 automatically by a migration |

`--remove-orphans` stops and removes v1's `web` and `api` containers in the same step that starts v2, so
the switch takes a few seconds. v1's files are **moved**, never deleted, into `/opt/junkyard_gold/_v1_archive_<date>/`.

## GitHub settings (Settings → Secrets and variables → Actions)

**Secrets**

| Secret | Required | Value |
|---|---|---|
| `VPS_HOST` | yes | server IP or hostname |
| `VPS_USER` | yes | SSH user that can run `docker` and write `/opt/junkyard_gold` |
| `VPS_SSH_KEY` | yes | private key of a deploy key (public half in that user's `~/.ssh/authorized_keys`) |
| `GHCR_TOKEN` | yes | GitHub token with `write:packages` + `read:packages` (same as JD CRM) |
| `DB_PASSWORD` | yes | **the same `DB_PASSWORD` as v1's `/opt/junkyard_gold/.env`** — the existing database was created with it |
| `ADMIN_PASSWORD` | yes | staff inbox login at `/admin` |
| `SESSION_SECRET` | yes | `openssl rand -hex 32` |
| `ANTHROPIC_API_KEY` | for AI drafts | console.anthropic.com |
| `RINGCENTRAL_CLIENT_ID` | for texting | RingCentral app (see below) |
| `RINGCENTRAL_CLIENT_SECRET` | for texting | |
| `RINGCENTRAL_JWT` | for texting | JWT credential of the user that owns 847-929-8737 |
| `RINGCENTRAL_WEBHOOK_TOKEN` | for texting | `openssl rand -hex 24` |
| `SMTP_PASS` | for email alerts | Zoho app password for support@junkyardgold.com |
| `STRIPE_SECRET_KEY` | for online payments | |
| `STRIPE_WEBHOOK_SECRET` | for online payments | |
| `STAFF_ALERT_PHONE` | optional | staff cell for a text on every new lead, e.g. `+19045550100` |

Anything optional left empty runs in demo mode (texts show as "simulated" in the inbox, template drafts,
"Buy Now" asks the customer to text/call). Fixed settings (domain, Traefik names, texting number, Zoho host)
are written by the workflow itself.

Use secrets made of letters, numbers, `-` and `_` (what `openssl rand -hex` gives you). Avoid `$`,
quotes and backticks: they can break the shell that writes `.env`.

**Variable**: `DEPLOY_ENABLED` = `true` — add it when you're ready for the first switch.

## First switch, step by step

1. On the VPS, note v1's database password: `grep DB_PASSWORD /opt/junkyard_gold/.env` → save it as the `DB_PASSWORD` secret.
2. Add the deploy key: generate `ssh-keygen -t ed25519 -f jg_deploy -N ""`, append `jg_deploy.pub` to
   `~/.ssh/authorized_keys` of `VPS_USER`, paste `jg_deploy` (private) into `VPS_SSH_KEY`.
3. Add the other secrets above, then the variable `DEPLOY_ENABLED=true`.
4. Actions → "Build & Deploy Junkyard Gold" → **Run workflow** (or push to `main`).
5. When it's green, open https://junkyardgold.com/admin, sign in, and upload the sales sheet at
   `/admin/parts` (the listings are not in the repo, on purpose).

**Rollback**: on the VPS set `IMAGE_TAG=<older commit sha>` in `.env` and run
`docker compose -f docker-compose.prod.yml up -d app`. Database backups are in `/opt/junkyard_gold/backups/`.
To go back to v1 entirely: `docker compose -f docker-compose.prod.yml down` (keeps the volume), then
`docker compose up -d --build` inside the `_v1_archive_*` folder.

## RingCentral setup (once)

1. developers.ringcentral.com → Console → **Create App** → REST API App, server-side, **JWT auth flow**.
   Permissions: **SMS**, **Read Messages**, **Webhook Subscriptions**.
2. In the same console create a **JWT credential** for the RingCentral user that owns 847-929-8737.
3. Check that 847-929-8737 is SMS-enabled for that user (phone number features include "SmsSender").
4. In the RingCentral Admin Portal, register the number for business texting (TCR / 10DLC). Use the
   site's `/terms` and `/privacy` pages; the consent checkbox wording is in `src/lib/consent.ts`.
5. Put the client ID, secret, JWT and a webhook token in GitHub secrets and deploy. Within a minute of
   starting, the app creates the webhook subscription for incoming texts (log line `[ringcentral] subscription … created`)
   and renews it automatically.

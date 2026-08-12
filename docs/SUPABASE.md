# career-os — Supabase Runtime (VS1)

The project architecture targets **Supabase**, not plain PostgreSQL. This file
documents the cloud resources used for VS1 and how to (re)provision them.
All connection config is **externalized** to env files (never committed).

## Cloud resources

| Resource | Value | Notes |
|---|---|---|
| Organization | **new isolated career-os account** (separate from Saloniqa's `hbhykforgzgepdhkcgkc`) | org name not queryable — the in-app MCP stayed bound to the old account, so provisioning ran over the Session pooler |
| Project ref / ID | **`zixgyokdlfktgjnrnvzh`** | the only project touched |
| Project URL | `https://zixgyokdlfktgjnrnvzh.supabase.co` | dashboard reads here |
| DB pooler host | `aws-1-eu-west-1.pooler.supabase.com:5432` (Session, IPv4) | direct host is IPv6-only |
| Region | `eu-west-1` | |
| Postgres | **17.6** | migrations verified on PG15, PG17 local, and this project |
| Applied migrations | `000`–`013` (14) via psql over the pooler | `db push` from the Windows host failed to connect (TLS/hang); psql applied cleanly |

> Secrets (DB password, keys) live only in the git-ignored `.env` / `dashboard/.env` — never in this doc or any committed file.

> ⚠️ Do NOT confuse with the two pre-existing Saloniqa projects in the same org
> (`gnaevysydgxkxtmethoe` = prod, `snbkyqhqrrwpwgfqjfip` = staging). career-os
> must never touch those.

## Environment variables (externalized — fill after creation)

`dashboard/.env` (Vite, client-side — anon key only):
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

Root `.env` (server-side psql for validate_db.sh / vs1_gates.sh):
```
DATABASE_URL=postgresql://postgres:<db-password>@db.<project-ref>.supabase.co:5432/postgres
```
The DB password is set at project creation; the anon key comes from
Project Settings → API. Neither is committed (see `.gitignore`).

## Provision + push VS1 (once a project slot is free)

1. Create project `career-os-vs1` in region `eu-west-1` (free tier).
2. Apply migrations `000` … `013` in order (Supabase `apply_migration`, one per file).
3. Enable the connector flag:
   `UPDATE feature_flags SET is_enabled = true WHERE name = 'jobbank_connector_enabled';`
4. Seed one discovery run: `node scripts/vs1_run_once.js` → apply the emitted SQL.
5. Fill `.env` (DATABASE_URL) and run against Supabase:
   - `./scripts/validate_db.sh` → all pass
   - `./scripts/vs1_gates.sh`   → exit 0
6. Fill `dashboard/.env`, then `cd dashboard && npm install && npm run dev` (port 3000).

## Verified locally (Docker Postgres, PG15 + PG17)

- All 13 migrations apply cleanly on a fresh DB.
- `validate_db.sh` → ALL PASSED (exit 0).
- `vs1_gates.sh` → 6/6 VS1 gates pass (exit 0).
- Tests: `test_schemas` 11/11, `test_canonical_output` 20/20, `test_vs1` 59/59.

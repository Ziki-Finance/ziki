# Change Log

## CR-000 — Point DATABASE_URL at Supabase session pooler and apply migrations
- **Date:** 2026-11-16 · **Approval:** User request ("run migration") · **Implementation:** COMPLETED · **Verification:** VERIFIED
- **BEFORE:** `.env` DATABASE_URL used `db.nsdgkigavaqbxlasfans.supabase.co:5432` (IPv6-only, unreachable) → P1001.
- **AFTER:** DATABASE_URL uses `postgres.nsdgkigavaqbxlasfans@aws-1-eu-west-1.pooler.supabase.com:5432`. Backup of the old `.env` kept outside the repo for this session only.
- **Verification:** `prisma migrate deploy` → "All migrations have been successfully applied"; `prisma migrate status` → "Database schema is up to date!" (235 migrations).
- **Files:** `.env` (gitignored, not committed).

## CR-002 — Deploy to Cloudflare
- **Date:** 2026-11-16 · **Approval:** APPROVED (user, 2026-11-16: "Complete the Cloudflare part"; do not push until it is ready; avoid repeated check runs) · **Implementation:** IN PROGRESS · **Verification:** —
- **BEFORE:** Deploy targets are Coolify (Dockerfile) and a `vercel.json`; no Cloudflare config.
- **PROPOSED AFTER (Workers + Supabase, D-013):**
  1. Add `@opennextjs/cloudflare` + `wrangler.jsonc` (nodejs_compat), build/preview/deploy scripts.
  2. Prisma: enable driver adapters + `@prisma/adapter-pg`, so no Rust engine binary; connect through Cloudflare Hyperdrive (or the Supabase transaction pooler, port 6543).
  3. Replace the in-process minute cron (`instrumentation.ts` → `lib/cron/scheduler.ts`) and the `vercel.json` crons with Workers Cron Triggers calling the existing sweep code; skip start-up timers on Workers.
  4. Run migrations from CI or locally (`prisma migrate deploy`), not at server start.
  5. Fix the security-report PDF fonts (loaded from disk) or move that route out; size limit is 64 MiB on both plans, so not a concern. Must fit the Workers Free plan (I-004): 10 ms CPU per request.
  6. Set secrets with `wrangler secret put`.
- **Acceptance criteria:** `/api/health` responds from the Cloudflare URL; login works; cron sweeps run every minute.
- 2026-11-16: User approved the proposed defaults (D-012..D-010) for the PRD. Drafted `docs/plans/finance-prd.md` v0.1. No app code changed.
- 2026-11-16: D-011 (hidden /finance route, no nav tab). PRD updated to v0.2 (§6.1, §12 phase 0, §13 criterion 1a, §16). Wireframes added: `docs/plans/finance-wireframes.html`. No app code changed.

## CR-003 — Replace bcrypt with PBKDF2 for new password hashes
- **Date:** 2026-11-16 · **Approval:** APPROVED (user, 2026-11-16) · **Implementation:** IN PROGRESS · **Verification:** —
- **BEFORE:** `bcryptjs` cost 10 (`hash`/`compare`) in `auth.ts`, `lib/two-factor.ts`, `app/actions/auth.ts`, `app/actions/settings.ts`; cost 12 in `prisma/seed.ts`.
- **PROPOSED AFTER:** `lib/password-hash.ts` provides `hashPassword` and `verifyPassword`. New hashes look like `pbkdf2-sha256$<iterations>$<salt>$<hash>` (base64), with `PASSWORD_PBKDF2_ITERATIONS` (default 20000) and an optional `PASSWORD_PEPPER`. Legacy `$2a$`/`$2b$` hashes still verify through bcryptjs, loaded only when needed, and are re-hashed on successful sign-in.
- **Acceptance:** unit tests for round-trip, wrong password, legacy bcrypt verify, pepper, and needs-rehash; typecheck passes.
- **Files:** lib/password-hash.ts (new), tests, auth.ts, lib/two-factor.ts, app/actions/auth.ts, app/actions/settings.ts, prisma/seed.ts, .env.example.
- 2026-11-16: User approved PRD v0.2 and wireframes. Phase 0 implementation plan written (CR-002, PROPOSED): `docs/plans/finance-phase0-plan.md`.
- 2026-11-16: The Phase 0 technical plan was replaced by the v1 plan written as 17 ideas (`docs/plans/finance-ideas.md`), at the user's request. "Phase 0" = PRD §12 release step 0 (Foundations).

### CR-002 ACTUAL AFTER (2026-11-16, in progress)
- `next` 16.4.1 → 16.4.6 and `eslint-config-next` → 16.4.6 (OpenNext 1.20.17 needs ≥16.4.5). Added `@opennextjs/cloudflare` 1.20.17, `@prisma/adapter-pg` 6.19.3, dev `wrangler` 4.162.0. `pnpm.onlyBuiltDependencies: ["workerd"]`.
- `prisma/schema.prisma`: `previewFeatures = ["driverAdapters"]`.
- `lib/prisma.ts`: on Node, the same shared client as before. On Workers, one client per request (keyed on the ExecutionContext) over `PrismaPg` (`maxUses: 1`), through `HYPERDRIVE` when bound, otherwise `DATABASE_URL`. `prisma` is now a Proxy.
- `lib/runtime.ts`: `isCloudflareWorkers()`.
- `instrumentation.ts`: no in-process cron, backfill or super-admin promotion on Workers.
- `cloudflare/worker.ts`: custom entry. `fetch` = the OpenNext handler; `scheduled` (every minute) POSTs `/api/internal/cron`, then `/api/v1/webhooks/dispatch`, with `Bearer CRON_SECRET`.
- `wrangler.jsonc` (name `ziki-finance`, nodejs_compat, assets, cron `* * * * *`, Hyperdrive binding commented out until created), `open-next.config.ts` (static-assets incremental cache: no R2/KV on Free), `public/_headers`, `.gitignore` (.open-next, .wrangler, .dev.vars).
- `package.json` scripts: `cf:build`, `cf:preview`, `cf:deploy`, `cf:typegen`.
- Security report PDF: in Cloudflare builds (`CLOUDFLARE_BUILD=1`, set by `scripts/cloudflare/build.mjs`) `next.config.ts` swaps `components/security-checks/report-pdf` for `cloudflare/stubs/report-pdf.ts`, which always fails, and drops the pdfkit tracing include. The first OpenNext build failed bundling pdfkit (`@noble/hashes/utils`, `@noble/ciphers/aes` unresolved). D-015.
- Hyperdrive `ziki-supabase` created by the user (id `af185b3bb2ba4be39bd8cfcb886bd042`) and bound as `HYPERDRIVE` in `wrangler.jsonc`.
- `scripts/cloudflare/create-hyperdrive.mjs` and `upload-secrets.mjs` read `.env` and pass values to Wrangler without printing them. A random `PASSWORD_PEPPER` was added to the local `.env`.
- `.github/workflows/deploy.yml` now deploys to Cloudflare (D-016) instead of calling Coolify.
- Version 0.1.203 → 0.1.204 (CI requires a bump on every PR).
- **Verification so far:** `next build` compiled locally (first attempt). The OpenNext bundle has NOT yet built successfully: the second local attempt ran out of disk space (drive C: had 0.22 GB free). Local builds were then dropped in favour of the GitHub Actions build (user, 2026-11-16). Not yet deployed or tested on Workers.

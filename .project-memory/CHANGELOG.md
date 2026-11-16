# Change log

> IDs carry a workstream prefix (`FIN-`, `INF-`); see `README.md`. Add to your own entries only.

# FIN: Ziki Finance product

## FIN-CR-001 — Ziki Finance PRD
- **Date:** 2026-11-16 · **Approval:** APPROVED as a document (user approved PRD v0.2 and the wireframes, 2026-11-16). This is not approval to implement. · **Implementation:** document only; no app code changed.
- **History:**
  - 2026-11-16: The user approved the proposed defaults (FIN-D-001..FIN-D-010) for the PRD. Drafted `docs/plans/finance-prd.md` v0.1.
  - 2026-11-16: FIN-D-011 (hidden /finance route, no nav tab). PRD updated to v0.2 (§6.1, §12 phase 0, §13 criterion 1a, §16). Wireframes added: `docs/plans/finance-wireframes.html`.
  - 2026-11-16: The user approved PRD v0.2 and the wireframes.
- **Files:** `docs/plans/finance-prd.md`, `docs/plans/finance-wireframes.html` (not yet committed to git).

## FIN-CR-002 — Ziki Finance v1 plan, written as ideas
- **Date:** 2026-11-16 · **Approval:** PROPOSED, awaiting user approval · **Implementation:** NOT STARTED
- **History:** first drafted as a technical Phase 0 plan (`docs/plans/finance-phase0-plan.md`, PROPOSED). Replaced the same day, at the user's request, by the v1 plan written as 17 ideas (`docs/plans/finance-ideas.md`). "Phase 0" = PRD §12 release step 0 (Foundations). The Phase 0 file was removed.
- **Files:** `docs/plans/finance-ideas.md` (not yet committed to git).

# INF: Infrastructure and deployment

## INF-CR-001 — Point DATABASE_URL at Supabase session pooler and apply migrations
- **Date:** 2026-11-16 · **Approval:** User request ("run migration") · **Implementation:** COMPLETED · **Verification:** VERIFIED
- **BEFORE:** `.env` DATABASE_URL used `db.nsdgkigavaqbxlasfans.supabase.co:5432` (IPv6-only, unreachable) → P1001.
- **AFTER:** DATABASE_URL uses `postgres.nsdgkigavaqbxlasfans@aws-1-eu-west-1.pooler.supabase.com:5432`. Backup of the old `.env` kept outside the repo for this session only.
- **Verification:** `prisma migrate deploy` → "All migrations have been successfully applied"; `prisma migrate status` → "Database schema is up to date!" (235 migrations).
- **Files:** `.env` (gitignored, not committed).

## INF-CR-002 — Deploy to Cloudflare
- **Date:** 2026-11-16 · **Approval:** APPROVED (user, 2026-11-16: "Complete the Cloudflare part"; do not push until it is ready; avoid repeated check runs) · **Implementation:** IN PROGRESS · **Verification:** —
- **BEFORE:** Deploy targets are Coolify (Dockerfile) and a `vercel.json`; no Cloudflare config.
- **PROPOSED AFTER (Workers + Supabase, INF-D-002):**
  1. Add `@opennextjs/cloudflare` + `wrangler.jsonc` (nodejs_compat), build/preview/deploy scripts.
  2. Prisma: enable driver adapters + `@prisma/adapter-pg`, so no Rust engine binary; connect through Cloudflare Hyperdrive (or the Supabase transaction pooler, port 6543).
  3. Replace the in-process minute cron (`instrumentation.ts` → `lib/cron/scheduler.ts`) and the `vercel.json` crons with Workers Cron Triggers calling the existing sweep code; skip start-up timers on Workers.
  4. Run migrations from CI or locally (`prisma migrate deploy`), not at server start.
  5. Fix the security-report PDF fonts (loaded from disk) or move that route out; size limit is 64 MiB on both plans, so not a concern. Must fit the Workers Free plan (INF-I-004): 10 ms CPU per request.
  6. Set secrets with `wrangler secret put`.
- **Acceptance criteria:** `/api/health` responds from the Cloudflare URL; login works; cron sweeps run every minute.

### INF-CR-002 ACTUAL AFTER (2026-11-16)
- `next` 16.4.1 → 16.4.6 and `eslint-config-next` → 16.4.6 (OpenNext 1.20.17 needs ≥16.4.5). Added `@opennextjs/cloudflare` 1.20.17, `@prisma/adapter-pg` 6.19.3, dev `wrangler` 4.162.0. `pnpm.onlyBuiltDependencies: ["workerd"]`.
- `prisma/schema.prisma`: `previewFeatures = ["driverAdapters"]`.
- `lib/prisma.ts`: on Node, the same shared client as before. On Workers, one client per request (keyed on the ExecutionContext) over `PrismaPg` (`maxUses: 1`), through `HYPERDRIVE` when bound, otherwise `DATABASE_URL`. `prisma` is now a Proxy.
- `lib/runtime.ts`: `isCloudflareWorkers()`.
- `instrumentation.ts`: no in-process cron, backfill or super-admin promotion on Workers.
- `cloudflare/worker.ts`: custom entry. `fetch` = the OpenNext handler; `scheduled` (every minute) POSTs `/api/internal/cron`, then `/api/v1/webhooks/dispatch`, with `Bearer CRON_SECRET`.
- `wrangler.jsonc` (name `ziki-finance`, nodejs_compat, assets, cron `* * * * *`, Hyperdrive binding commented out until created), `open-next.config.ts` (static-assets incremental cache: no R2/KV on Free), `public/_headers`, `.gitignore` (.open-next, .wrangler, .dev.vars).
- `package.json` scripts: `cf:build`, `cf:preview`, `cf:deploy`, `cf:typegen`.
- Security report PDF: in Cloudflare builds (`CLOUDFLARE_BUILD=1`, set by `scripts/cloudflare/build.mjs`) `next.config.ts` swaps `components/security-checks/report-pdf` for `cloudflare/stubs/report-pdf.ts`, which always fails, and drops the pdfkit tracing include. The first OpenNext build failed bundling pdfkit (`@noble/hashes/utils`, `@noble/ciphers/aes` unresolved). INF-D-004.
- Hyperdrive `ziki-supabase` created by the user (id `af185b3bb2ba4be39bd8cfcb886bd042`) and bound as `HYPERDRIVE` in `wrangler.jsonc`.
- `scripts/cloudflare/create-hyperdrive.mjs` and `upload-secrets.mjs` read `.env` and pass values to Wrangler without printing them. A random `PASSWORD_PEPPER` was added to the local `.env`.
- `.github/workflows/deploy.yml` now deploys to Cloudflare (INF-D-005) instead of calling Coolify.
- Version 0.1.203 → 0.1.204 (CI requires a bump on every PR).
- `ci.yml` job "Cloudflare Workers build" builds the OpenNext bundle on every PR. `wrangler.jsonc` var `AUTH_URL` = `https://ziki-finance.ibuild-ai.workers.dev`.
- GitHub repo settings (2026-11-16): secrets CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and DATABASE_URL, and variable APP_URL = `https://ziki-finance.ibuild-ai.workers.dev`.
- **Verification so far:** the local OpenNext build ran out of disk space (INF-I-006), so builds moved to GitHub Actions (user, 2026-11-16). On PR #1 all 5 checks pass, including "Cloudflare Workers build". Not yet deployed or tested on Workers.
- 2026-11-16: PR #1 merged (`42b7fb34`). The first deploy (Actions run 43792124930) applied migrations and built the bundle, then failed at `opennextjs-cloudflare deploy`: Wrangler's local platform proxy requires a local connection string for the `HYPERDRIVE` binding. Fix: the deploy step sets `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` to a placeholder (PR #2). Local `pnpm cf:preview` needs the same variable, pointing at a real local or dev Postgres.

## INF-CR-003 — Replace bcrypt with PBKDF2 for new password hashes
- **Date:** 2026-11-16 · **Approval:** APPROVED (user, 2026-11-16) · **Implementation:** COMPLETED · **Verification:** VERIFIED locally: 6 new unit tests pass; 432 security/auth tests pass (2 timed out under load, then passed on re-run); `tsc --noEmit` exit 0. CI green on PR #1.
- **BEFORE:** `bcryptjs` cost 10 (`hash`/`compare`) in `auth.ts`, `lib/two-factor.ts`, `app/actions/auth.ts`, `app/actions/settings.ts`; cost 12 in `prisma/seed.ts`.
- **PROPOSED AFTER:** `lib/password-hash.ts` provides `hashPassword` and `verifyPassword`. New hashes look like `pbkdf2-sha256$<iterations>$<salt>$<hash>` (base64), with `PASSWORD_PBKDF2_ITERATIONS` (default 20000) and an optional `PASSWORD_PEPPER`. Legacy `$2a$`/`$2b$` hashes still verify through bcryptjs, loaded only when needed, and are re-hashed on successful sign-in.
- **Acceptance:** unit tests for round-trip, wrong password, legacy bcrypt verify, pepper, and needs-rehash; typecheck passes.
- **Files:** lib/password-hash.ts (new), tests, auth.ts, lib/two-factor.ts, app/actions/auth.ts, app/actions/settings.ts, prisma/seed.ts, .env.example.

## INF-CR-004 — Repair the project memory after two sessions clashed
- **Date:** 2026-11-16 · **Approval:** APPROVED (user: "Yes, fix records") · **Implementation:** COMPLETED · **Verification:** see below
- **BEFORE:** Two sessions in the same folder used the same unprefixed IDs. The Finance session's edits overwrote the infrastructure decisions (pooler, Workers choice), the issues I-001 to I-003 and the task list. The infrastructure session's renumbering (D-001→D-012, D-002→D-013, CR-001→CR-002) altered the Finance records.
- **AFTER:** Prefixed IDs (`FIN-`, `INF-`) in every memory file and in the references in `docs/plans/*.md`. Lost infrastructure records rebuilt from the session that made them. Rules for concurrent work in `.project-memory/README.md`.
- **Not recoverable:** the Finance session's original task list (only FIN-CR-002 survived; a "T-004 legal review" was referenced) and the text of FIN-R-001..FIN-R-005. Marked unknown.
- **Verification:** no unprefixed record IDs remain in `.project-memory/` or `docs/plans/` (grep).

## INF-CR-005 — Make the database and security-check routes work on Workers
- **Date:** 2026-11-16 · **Approval:** APPROVED (user reported "api health still fails" after the deploy; fixing the deploy is within INF-CR-002's approved scope) · **Implementation:** COMPLETED · **Verification:** PENDING (CI on the PR, then `/api/health` after the deploy)
- **BEFORE:** The second deploy (run 43812836444) went live, and the runtime secrets were uploaded, but `/api/health` returned 503 `{"status":"degraded"}`. The Worker logs (`wrangler tail`) showed two errors. (1) Every query failed with `prisma:error b2 is not a constructor`: webpack bundled `pg` with Node conditions, so `pg-cloudflare` resolved to its empty module and `new CloudflareSocket()` was undefined. (2) `lib/security-checks/ownership.ts` called `dns.Resolver.setServers` at import time, which Workers does not implement ("Not implemented"), so `/api/internal/cron` returned 500 on every run.
- **AFTER:** `next.config.ts` adds `@prisma/adapter-pg` to `serverExternalPackages`, so OpenNext's bundler resolves `pg` with the `workerd` condition and includes the real socket. The public DNS resolver in `ownership.ts` is created on first use. The CI job "Cloudflare Workers build" now fails if `class CloudflareSocket` is missing from the bundle.
- **Acceptance:** CI green; after the deploy, `/api/health` returns 200 and the cron log no longer shows "Not implemented".
- **Files:** next.config.ts, lib/security-checks/ownership.ts, .github/workflows/ci.yml, package.json (0.1.205 → 0.1.207; 0.1.206 is taken by the unmerged Finance commit FIN-CR-003).

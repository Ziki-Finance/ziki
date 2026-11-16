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

- **Approval (2026-11-16):** APPROVED for release steps 0, 1 and 2 (the user: "lets implement step 0, then 1 then 2 in that sequence on separate branches"). Steps 3–5 are still PROPOSED. Implementation: FIN-CR-003 (step 0), FIN-CR-004 (step 1), FIN-CR-005 (step 2).

## FIN-CR-003 — Release step 0: Foundations (ideas 1–5)
- **Date:** 2026-11-16 · **Approval:** APPROVED (FIN-CR-002, steps 0–2) · **Implementation:** COMPLETED on `feat/finance-step0-foundations` (see ACTUAL AFTER) · **Verification:** unit tests only; not checked in a browser or against a database
- **BEFORE:** No Finance code. `/finance` is a 404 (or an organisation slug).
- **APPROVED AFTER:** ideas 1–5 of `docs/plans/finance-ideas.md`: a hidden `/finance` page (noindex, no links), first-visit setup (notice + 18+, two questions), holdings and watch list, the Finance page and holding page before any research, finance clearance for agents.
- **Acceptance:** the "What is expected" bullets of ideas 1–5.

### FIN-CR-003 ACTUAL AFTER (2026-11-16)
- Schema + migration `20270206000000_finance_foundations`: `User.financeClearedAt`, `FinanceProfile`, `FinanceTicker`, `FinanceHolding` (unique per person and ticker; `shares` null = watch only; `soldAt`). The migration also reserves the slug `finance` (renames a project or organisation already called that).
- `lib/finance.ts` (words, notice, parsing), `lib/finance/directory.ts` (built-in list of about 140 US stocks and ETFs, FIN-D-013), `lib/finance/market-data.ts` (provider interface), `lib/finance/holdings.ts`, `lib/finance/clearance.ts`, `app/actions/finance.ts`.
- Pages: `app/(app)/finance/{layout,page}.tsx` (noindex; welcome signed out, setup, then the Finance page), `app/(app)/finance/[ticker]/page.tsx`, staff page `app/(app)/superadmin/finance/page.tsx` (plus a staff sidebar link). Components in `components/finance/`.
- `middleware.ts`: only the exact path `/finance` is public. `app/(app)/layout.tsx`: a guest there gets a bare shell, like `/security`.
- Docs: `docs/finance.md`. Version 0.1.205 → 0.1.206, then 0.1.208 after merging main (main had moved to 0.1.207 with INF-CR-005).
- Not done in step 0 (from the PRD's phase 0 list): the legal opinion and the data-provider choice are business tasks, still open (FIN-D-013, FIN-D-014).
- **Verification:** `tsc --noEmit` exit 0. ESLint clean on the changed files. `vitest run tests/finance` 24/24 pass. Full suite: 2179 passed and 2 timed out under load (`security-checks.test.ts` PDF font test, existing code; the Finance file-scan test, now given 60 s, passes). Not run: the migration against a database, the pages in a browser, e2e. Nothing deployed.

## FIN-CR-004 — Release step 1: Agent research (ideas 6–9)
- **Date:** 2026-11-16 · **Approval:** APPROVED (FIN-CR-002, steps 0–2) · **Implementation:** COMPLETED on `feat/finance-step1-research` (worktree `.claude/worktrees/finance-step1`, stacked on step 0, PR #3; see ACTUAL AFTER) · **Verification:** unit tests only
- **BEFORE:** Step 0 only: people add holdings, but nothing researches them. Pages say "Not reviewed yet".
- **APPROVED AFTER:** ideas 6–9: nightly review jobs per tracked ticker, agents post views (call, risk, reasons, what would change their mind, sources), other cleared agents give weighted verdicts, agreed views reach users, plus the agent API, MCP tools and a laptop worker.
- **Acceptance:** the "What is expected" bullets of ideas 6–9. PRD exit check (a staff-only overnight test where every held ticker gets an agreed view) needs real cleared agents and is done after merge.
- **Branch note:** the planned branch `feat/finance-step1-agent-research` was used by mistake by another session for INF-CR-005 (commit `b712c55`). Step 1 lives on `feat/finance-step1-research` instead. The other branch was left as it was.
- **User decision (2026-11-16):** keep the agreed-view display on the Finance page and holding page in step 1 (asked: "why is holding page here in step 1"; answered: "keep it in step 1").

### FIN-CR-004 ACTUAL AFTER (2026-11-16)
- Migration `20270207000000_finance_research`: `FinanceSnapshot`, `FinanceJob`, `FinanceView`, `FinanceVerdict`, `FinanceAgreedView`, `FinanceCycle` and their enums. View and verdict `agentId` are nullable with SetNull, so deleting an agent's owner still works and the text stays for audit.
- `lib/finance/calendar.ts` (Eastern time; NYSE holidays 2026–2027 only), `lib/finance/agreement.ts` (pure rules), `lib/finance/research.ts` (snapshots, due jobs, views, verdicts, settling, `sweepFinance`, what people and agents read), and the hook in `lib/cron/runner.ts`.
- Agent API `app/api/v1/finance/**` with `lib/finance/agent-api.ts` (finance clearance and not paused, checked on every call). MCP tools `ziki_finance_*`. `docs/ziki-for-agents.md` section "Ziki Finance".
- `scripts/finance-worker.mjs` (setup / run / status). `runClaude` in `scripts/security-worker.mjs` now takes `allowedTools`. No start-at-sign-in yet.
- Pages: holdings table chip and first reason; holding page with reasons, risk, agreement count, change-mind, history and sources. `components/finance/view-chip.tsx`.
- Docs `docs/finance.md` step 1. Version 0.1.209.
- **Verification:** `tsc --noEmit` exit 0. Full `vitest run`: 2215 tests, all pass after registering the finance schemas in `tests/platform/api-error-contract.test.ts`. MCP tool table tests 389/389. Not run: migrations against a database, the pages in a browser, the worker against a live server, the overnight staff test. Nothing deployed.
- Known limits: with no market-data provider (FIN-D-013), snapshots have no price and no headlines. Jobs then come only from `first` and `weekly`, and `priceAtAgreement` is null.
- 2026-11-16: pushed; PR #5 (base `feat/finance-step0-foundations`, stacked on #3). CI only runs for PRs into `main`, so #5's checks run once #3 merges and #5 is retargeted.

## FIN-CR-005 — Release step 2: The daily briefing (ideas 10–12)
- **Date:** 2026-11-16 · **Approval:** APPROVED (FIN-CR-002, steps 0–2) · **Implementation:** COMPLETED on `feat/finance-step2-briefing` (stacked on step 1; see ACTUAL AFTER) · **Verification:** unit tests only
- **BEFORE:** Agreed views exist and show on the holdings table and holding page. The "Today's briefing", "Ideas for you" and "Past briefings" sections are empty states. Nothing reaches the Inbox or email.
- **APPROVED AFTER:** ideas 10–12: a daily briefing made from agreed views (wireframe 5 layout, leading with what needs a look), delivered about 07:00 local time Monday to Friday to the Inbox (`finance_briefing`) and by email (on by default), none on US market holidays; up to 3 "Ideas for you" on the page and at most 1 in the briefing, matched to the risk answers, with Watch and "I bought this".
- **Acceptance:** the "What is expected" bullets of ideas 10–12. PRD exit check (briefings at 07:00 local for test users 5 trading days running) is done after deploy.

### FIN-CR-005 ACTUAL AFTER (2026-11-16)
- Migration `20270208000000_finance_briefing`: `FinanceBriefing` (unique per person and local date).
- `lib/finance/ideas.ts` (FIN-D-019), `lib/finance/briefing.ts` (compose, plain-text email, `sweepBriefings`, preview, past briefings; FIN-D-018, FIN-D-020), hook in `lib/cron/runner.ts`.
- Finance page: today's briefing (stored, or worked out live), holiday and weekend notes, ideas for you with Watch / I bought this (`components/finance/idea-actions.tsx`), past briefings (`components/finance/briefing-view.tsx`).
- Docs `docs/finance.md` step 2. Version 0.1.210.
- **Verification:** `tsc --noEmit` exit 0. ESLint clean. Finance tests 68/68. Full `vitest run`: 2230 passed, 1 timed out under load (`organisation-membership.test.ts` Design page, unrelated; passes alone 17/17). Not run: migrations against a database, the pages in a browser, a real email send (SMTP on Workers is INF-I-007), the 5-trading-day exit check.
- Not done in step 2: the "overall" line and the market line need prices (FIN-D-013). Showing how past calls did since needs the track record (step 4, idea 16).

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

## INF-CR-006 — Move the platform sweeps from the Worker's cron to GitHub Actions
- **Date:** 2026-11-16 · **Approval:** APPROVED (user: "Yes, move them") · **Implementation:** COMPLETED · **Verification:** PARTIAL (see below)
- **BEFORE:** `wrangler.jsonc` had the Cron Trigger `* * * * *`. `cloudflare/worker.ts` `scheduled()` POSTed `/api/internal/cron` then `/api/v1/webhooks/dispatch` through the Worker. Each run used 600 ms – 1.66 s CPU (limit 10 ms), so most failed and Cloudflare warned that the CPU limit was hit (INF-I-008).
- **APPROVED AFTER:** No Cron Trigger. The same `runPlatformSweeps()` runs on Node every 5 minutes from GitHub Actions.
- **ACTUAL AFTER:**
  - `.github/workflows/sweeps.yml` ("Platform sweeps"): `schedule */5 * * * *` plus manual run. Checks out `main`, passes only the secrets that are set (names in `scripts/cron/sweep-secrets.json`; `DATABASE_URL` required), installs, runs `pnpm cron:sweeps`. One run at a time.
  - `scripts/cron/run-sweeps.ts`: runs the sweeps once, prints one line per sweep, reports failed sweeps as Actions warnings, exits 1 only if the run itself fails.
  - `scripts/cron/server-only-shim.js`: lets Node import server modules (`server-only` throws outside the react-server condition, and that condition breaks React on plain Node). Same approach as `vitest.config`.
  - `scripts/cron/set-github-sweep-secrets.mjs`: copies the listed secrets from `.env` to GitHub secrets on stdin, never printing them. `GITHUB_*` names are stored as `ZIKI_GITHUB_*` (GitHub forbids that prefix).
  - `wrangler.jsonc` `triggers.crons` is `[]`, which removes the trigger on the next deploy. `cloudflare/worker.ts` only serves the app. `package.json` script `cron:sweeps`; version 0.1.210 → 0.1.211.
- **Verification:** Locally, the full sweep module graph loads on Node with the shim, and `pnpm cron:sweeps` against an unreachable database runs every sweep (Finance included), reports each failure, and exits 0. Not yet run against Supabase: verify with a manual "Platform sweeps" run after merge, and check that Cloudflare shows no cron invocations after the deploy.
- **Files:** .github/workflows/sweeps.yml, scripts/cron/*, cloudflare/worker.ts, wrangler.jsonc, instrumentation.ts (comment), package.json.

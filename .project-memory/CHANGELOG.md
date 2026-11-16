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
- 2026-11-16: Review of release steps 0–1 against the PRD and wireframes (read-only; 58/58 Finance tests pass on `feat/finance-step1-research`). New decisions FIN-D-021..FIN-D-024, recommendations FIN-R-010 and FIN-R-011, issues FIN-I-001..FIN-I-003. No code changed.

## FIN-CR-006 — Step 2b: fixes after the review of steps 0–2 (ideas 18–25)
- **Date:** 2026-11-16 · **Approval:** PROPOSED, awaiting user approval · **Implementation:** NOT STARTED · **Verification:** —
- **BEFORE:** Steps 0–2 built on `feat/finance-step2-briefing`; 68/68 Finance unit tests pass. Gaps: no market data (about 140-stock list, no prices, sparkline or price at agreement); agreement numbers in env vars and code; ideas come only from stocks other users hold; the briefing has no Overall or market line; no "Just watch" button; the step 0 migration silently renames a `finance` slug; a missed 07:00 hour skips the day; nothing run on a database or in a browser.
- **PROPOSED AFTER:** ideas 18–25 in `docs/plans/finance-step2b-review.md`, done before step 3.
- **Also on 2026-11-16:** FIN-R-010 (two-layer research) deferred by the user to a future date, and moved to the idea backlog.
- **FIN-CR-006 update (2026-11-16):** idea 20 revised. The staff-picked list is replaced by code that scans every stock and an agent-researched rotating shortlist (default 100 a week), because researching all ~9,000 stocks with agents is impractical. Idea 26 added: optional industry interests, a multi-select of tags with ×, in setup and the ⋯ menu; they shape each person's ideas and weight the shortlist by how many people chose each industry (counts only). Idea 23 dropped (no organisation is called "finance", so FIN-I-001 is resolved). Still PROPOSED.
- **FIN-CR-006 update (2026-11-16):** idea 26's industry field is a fixed-list dropdown with type-to-filter. Idea 27 (user decision) replaces "More" with three layers: the price on the day added (automatic), the price paid (optional), and the date bought (optional, using that day's close). Profit is shown as information only, never as a reason to sell. Idea 18: the coding agent asks the user for their existing Finnhub key and has them store it as the `FINNHUB_API_KEY` secret (in `.env` and on Cloudflare), never in chat, logs or git. Personal price alerts added to the backlog. Still PROPOSED.
- **FIN-CR-006 APPROVED (2026-11-16):** the user approved step 2b ("Yes, mark approved"). The scope is ideas 18–22 and 24–27 in `docs/plans/finance-step2b-review.md`; idea 23 is dropped. Implementation is NOT STARTED and belongs to the coding agent, who must ask the user for the Finnhub key (idea 18). Step 3 waits until step 2b is done and verified (idea 25).
- **FIN-CR-006 scope added (2026-11-16, at the user's request):** idea 28, a "Watch how it works" time-lapse demo on the Finance page, the welcome page and the ⋯ menu. It uses made-up companies and agents only, never real tickers. It is browser-only and writes nothing, and is clearly labelled as a demo. It is part of the approved step 2b scope.
- **FIN-CR-006 PR A IMPLEMENTED (2026-11-16):** the user said "go ahead with 2b in its own worktree". Branch `feat/finance-step2b-a`, worktree `.claude/worktrees/finance-step2b-a`, based on `33d71335`.
  - Idea 19: `FinanceSettings` (one row, id `default`: agreement needed 3, manager weight 3, Sell bar 4) and `FinanceSettingsChange` (who, when, before and after per change) with migration `20270209000000_finance_settings`; `lib/finance/settings.ts` reads and saves them and validates whole numbers ≥ 1 and Sell bar ≥ agreement needed; a form and a recent-changes list on `/superadmin/finance`; `settleJob` and `giveVerdict` read them. `FINANCE_AGREEMENT_NEEDED`, `FINANCE_SELL_AGREEMENT_NEEDED` and `FINANCE_MANAGER_VOTE_WEIGHT` are gone.
  - Idea 22: "Just watch instead" beside the ticker box in setup adds the typed stock with no shares.
  - Idea 24: `isBriefingTime` accepts 07:00–09:59 local (`BRIEFING_WINDOW_HOURS = 3`); after 10:00 the day is skipped, and `FinanceBriefing.inboxAt` records when it went out.
  - Idea 27 part 1: the "More" link and the average-price field are gone from setup and "+ Add".
  - Tests updated and added: `tests/finance/finance-agreement.test.ts` (staff-set numbers), `tests/finance/finance-settings.test.ts` (validation), `tests/finance/finance-briefing.test.ts` (window). Version 0.1.210 → 0.1.211. Docs: `docs/finance.md`, `docs/plans/finance-prd.md`.
  - **Verification (2026-11-16):**
    - **Full run (first):** `pnpm verify:ready`, revision `e84c26d0` + uncommitted changes, input state `3bf9ee4c8ef8`, Node 24.10.0, 8 CPUs. lint passed (0 errors, 33 warnings, none in a file this change touches). typecheck failed (exit 134) — an out-of-memory crash at the end with "no errors" printed, so it proved nothing. unit failed 5 of 2236: 4 in `tests/finance/finance-research.test.ts` (the fake db had no `financeSettings.findUnique`, so `settleJob` and `giveVerdict` threw) and 1 in `tests/security/security-checks.test.ts` (the PDF/Inter font test, 14.5 s, a load timeout; it is not in this area and passed in earlier runs).
    - **Repairs:** added `financeSettings.findUnique → null` (the defaults) to the fake db in `tests/finance/finance-research.test.ts`. Ran `tsc --noEmit` with a 6 GB heap for the one question the OOM left open, which showed 2 real type errors: `saveFinanceSettings` took `Db` (which includes `TransactionClient`, with no `$transaction`) and now takes `PrismaClient`, as `undoAuditEvent` already does.
    - **Recheck (became a full run, and said why):** "the environment changed (env)" — `NODE_OPTIONS` (heap raised, because the default heap OOM'd on this 8-CPU box) is hashed into the input state, and `prisma/schema.prisma` and `package.json` had also changed. Input state `5db0f3a570db`: **lint passed** (0 errors, 33 warnings), **typecheck passed** (0 errors), **unit: 2235 of 2236 passed, 1 failed** — `tests/security/organisation-membership.test.ts` "the Design area belongs to the project's organisation", timed out at 5354 ms against the 5000 ms limit. It passes alone (17/17, 5.45 s). It does not import any finance file, so it is the same load timeout as before, not a break in this change. It is **not** counted as a pass.
    - **Targeted recheck on `c5f55b44`:** only the three `.project-memory` files differed from the full run, so it reran the previously failing file: `tests/security/organisation-membership.test.ts`, 17 of 17 passed in 9.1 s. That confirms the failure was load, not this change.
    - Not run: the migration against a database, and the pages in a browser.

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

## INF-CR-006 — Track the project continuity protocol and load it from AGENTS.md
- **Date:** 2026-11-16 · **Approval:** APPROVED (user: "track claude.md and fix then commit") · **Implementation:** COMPLETED · **Verification:** see below
- **BEFORE:** `CLAUDE.md` (the project continuity protocol) was untracked, so it existed in one checkout only and no agent was told to read it. Every Markdown marker in it was backslash-escaped (`\#`, `\-`, `\*\*`), so it rendered as literal backslashes.
- **AFTER:** `CLAUDE.md` is tracked and reads as normal Markdown (escapes removed, runs of blank lines collapsed). `AGENTS.md` points at it directly under the CONTRIBUTING.md line and says it applies in full, including that a harness may not load it on its own.
- **Why:** continuity rules must reach every agent and every checkout, not just the one that created the file.
- **Files:** `CLAUDE.md` (new), `AGENTS.md`.
- **Verification:** no backslash-escaped markers remain in `CLAUDE.md` (grep); the wording is unchanged apart from the escaping and blank lines. No code, so no test run.

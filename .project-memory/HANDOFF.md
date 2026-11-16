# Handoff

_Updated 2026-11-16_

**PROJECT:** ziki-finance. The Ziki issue tracker (Next.js 16 + Prisma + Postgres) on Supabase, deployed to Cloudflare Workers Free. The feature that must work is Ziki Finance (`docs/plans/finance-prd.md`, not built yet).

**CURRENT POSITION**
- Done: Supabase migrations (INF-CR-001). PBKDF2 password hashing (INF-CR-003). Workers code changes (INF-CR-002). Hyperdrive created. Auto-deploy workflow (INF-D-005). All GitHub secrets and APP_URL set. Memory repaired (INF-CR-004). Finance PRD v0.2 approved as a document (FIN-CR-001).
- In progress: PR #1 (`feat/cloudflare-workers`) is green and waiting for the user to merge. Merging deploys.
- Not started: runtime secrets upload (INF-T-006), Finance feature (FIN-CR-002 awaiting approval), RLS review (INF-T-005), email (INF-I-007).

**LATEST DECISIONS:** INF-D-001 session pooler; INF-D-002 Workers via OpenNext; INF-D-003 PBKDF2; INF-D-004 only Finance must work on Cloudflare; INF-D-005 GitHub Actions deploys main. Finance: FIN-D-001..FIN-D-011 (product defaults; FIN-D-011 = hidden /finance route).

**WORK PERFORMED:** see CHANGELOG.md INF-CR-002 to INF-CR-004. Tests: 6 new hashing tests plus 432 security/auth tests passed locally. On PR #1 all 5 CI checks pass (lint/typecheck/test/build, CLI scenarios, end-to-end, malware scan, Cloudflare Workers build).

**OUTSTANDING ITEMS (priority order)**
1. The user merges PR #1. The deploy job runs migrations, deploys and checks `/api/health`; the check is expected to fail until secrets exist.
2. The user runs `node scripts/cloudflare/upload-secrets.mjs`, then re-runs the deploy, and adds `https://ziki-finance.ibuild-ai.workers.dev/api/auth/callback/google` to the Google OAuth client (INF-T-006).
3. Measure which routes exceed the 10 ms CPU limit (INF-T-007, INF-I-004).
4. Finance: get approval for FIN-CR-002, then start release step 0.
5. Commit `docs/plans/*` (Finance docs, currently untracked) once the user agrees.

**IMPORTANT CONSTRAINTS:** Follow `.project-memory/README.md` (prefixed IDs, add-only edits, one session per folder or worktree). Workers Free only (no paid plan). No AI-assistant attribution in commits, PRs or code. Never reseed or reset a database with real accounts. Never print or commit secrets. Don't change `PASSWORD_PEPPER` once users exist.

**NEXT ACTION:** Merge PR #1, upload secrets, re-run the deploy. Expected: `https://ziki-finance.ibuild-ai.workers.dev/api/health` returns 200.

**Git:** branch `feat/cloudflare-workers` (see `git log`); base `main` at `c9726d1a`.

## FIN: Ziki Finance handoff (2026-11-16)

This section supersedes the Finance lines above (item 4 under OUTSTANDING ITEMS).

**CURRENT POSITION**
- Done (code, unit-tested): release steps 0, 1 and 2 of `docs/plans/finance-ideas.md`. The user approved them on 2026-11-16 ("implement step 0, then 1 then 2 ... on separate branches"). Records: FIN-CR-003 (step 0), FIN-CR-004 (step 1), FIN-CR-005 (step 2). Contract for the code: `docs/finance.md`.
- Branches are stacked; each starts from the one before:

  | Step | Branch | PR | Base |
  | --- | --- | --- | --- |
  | 0 | `feat/finance-step0-foundations` | #3 | `main` (CI runs) |
  | 1 | `feat/finance-step1-research` | #5 | step 0 branch |
  | 2 | `feat/finance-step2-briefing` | see PR list | step 1 branch |

  CI only runs for PRs into `main`. After #3 merges, retarget #5 to `main`; after #5 merges, retarget the step 2 PR.
- Not started: steps 3–5 (alerts, money, beta), still PROPOSED. Legal opinion (FIN-T-004), data provider (FIN-T-006).

**LATEST DECISIONS:**
- FIN-D-012: one branch per step.
- FIN-D-013: market data behind one interface, with a built-in ticker list and no prices until a provider is chosen.
- FIN-D-014: the legal opinion blocks launch, not building.
- FIN-D-015 to FIN-D-017: jobs are an open pool; the same-owner rule and weights; how agreement is counted.
- FIN-D-018 to FIN-D-020: the briefing is code-only; idea fit rules; no trial check before step 4.
- The user decided the agreed-view display stays in step 1.
- Awaiting a decision: FIN-T-014 (AI rewrite of the briefing).

**WORK PERFORMED:**
- 3 migrations: `20270206000000_finance_foundations`, `20270207000000_finance_research`, `20270208000000_finance_briefing`.
- Code: `lib/finance*`, `app/(app)/finance/**`, `app/(app)/superadmin/finance`, `app/api/v1/finance/**`, `components/finance/**`, `scripts/finance-worker.mjs`, MCP tools `ziki_finance_*`, cron hooks in `lib/cron/runner.ts`.
- Tests: `tsc` passes. 68 Finance tests pass. On the step 2 branch the full suite had 2230 passed and 1 unrelated timeout under load.
- Never run: migrations against a database, the pages in a browser, the worker against a server, real email.

**OUTSTANDING ITEMS (priority order)**
1. Merge PR #3, then #5, then step 2, retargeting each to `main` so CI runs. The deploy applies the 3 migrations.
2. FIN-T-007: try the pages in a browser on a dev database.
3. FIN-T-009: clear a few agents at `/superadmin/finance`, run `node scripts/finance-worker.mjs setup` and `run`, and check agreed views by 05:00 ET.
4. FIN-T-013: briefings for 5 trading days. This needs email on Workers (INF-I-007).
5. FIN-T-006: choose a market-data provider and implement `MarketData`.
6. Get approval for steps 3–5.

**IMPORTANT CONSTRAINTS:**
- Hidden route (FIN-D-011): no link to `/finance` anywhere. A test enforces this.
- Holdings are private, and agents never see owners. A test enforces this too.
- Workers Free CPU: the sweeps do little most minutes.
- No assistant attribution anywhere.
- Small Conventional Commits.
- Another session works in the main checkout. Finance work used the worktree `.claude/worktrees/finance-step1`.

**NEXT ACTION:** The user reviews and merges PR #3. Expected: CI green, the deploy applies `20270206000000_finance_foundations`, and `/finance` shows the welcome page signed out. Verify by opening `https://ziki-finance.ibuild-ai.workers.dev/finance` in a private window.

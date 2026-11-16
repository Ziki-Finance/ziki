# Handoff

_Updated 2026-11-16_

**PROJECT:** ziki-finance. The Ziki issue tracker (Next.js 16 + Prisma + Postgres) on Supabase, deployed to Cloudflare Workers Free. The feature that must work is Ziki Finance (`docs/plans/finance-prd.md`, not built yet).

**CURRENT POSITION** (INF)
- Done: Supabase migrations (INF-CR-001). PBKDF2 password hashing (INF-CR-003). Workers deploy from `main` (INF-CR-002, INF-D-005): live at `https://ziki-finance.ibuild-ai.workers.dev`, `/api/health` 200 after INF-CR-005. Runtime secrets uploaded. Memory repaired (INF-CR-004).
- In progress: INF-CR-006, sweeps moved from the Worker's cron to GitHub Actions (branch `feat/sweeps-on-github-actions`, PR pending).
- Not started: RLS review (INF-T-005), email (INF-I-007), measuring routes against 10 ms CPU (INF-T-007), `WEBHOOK_SECRET_KEY` (INF-I-008).

**LATEST DECISIONS:** INF-D-001 session pooler; INF-D-002 Workers via OpenNext; INF-D-003 PBKDF2; INF-D-004 only Finance must work on Cloudflare; INF-D-005 GitHub Actions deploys main; INF-D-006 sweeps run on GitHub Actions every 5 minutes.

**WORK PERFORMED:** see CHANGELOG.md INF-CR-002 to INF-CR-006.

**OUTSTANDING ITEMS (priority order)**
1. Merge the INF-CR-006 PR. Its deploy removes the Worker's Cron Trigger.
2. The user runs `node scripts/cron/set-github-sweep-secrets.mjs`, then starts "Platform sweeps" by hand once (Actions tab) and checks the sweeps are `ok` (INF-T-008).
3. Measure which routes exceed the 10 ms CPU limit (INF-T-007, INF-I-004).
4. Set `WEBHOOK_SECRET_KEY` and email (INF-I-007, INF-I-008).

**IMPORTANT CONSTRAINTS:** Follow `.project-memory/README.md` (prefixed IDs, add-only edits, one session per folder or worktree). Workers Free only (no paid plan). No AI-assistant attribution in commits, PRs or code. Never reseed or reset a database with real accounts. Never print or commit secrets. Don't change `PASSWORD_PEPPER` once users exist. Scheduled work runs in "Platform sweeps" (GitHub Actions), not on the Worker.

**NEXT ACTION:** Items 1 and 2. Expected: a manual "Platform sweeps" run lists every sweep, Finance included, as `ok`, and Cloudflare shows no more cron invocations.

**Git:** INF-CR-006 on branch `feat/sweeps-on-github-actions`.

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
- **What actually happened (2026-11-16):** #3 merged into `main` (`015ad8c`). #5 was then merged into its old base, the step 0 branch (`645abc3`), so step 1 did not reach `main`. PR #6 (step 2 branch, which contains all of step 1) was retargeted to `main` and retitled "release steps 1 and 2". Merging #6 brings steps 1 and 2 into `main`. Nothing was lost; the branches `feat/finance-step0-foundations` and `feat/finance-step1-research` can be deleted after #6 merges.
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

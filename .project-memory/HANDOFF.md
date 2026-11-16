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

## FIN: Step 2b plan (2026-11-16, supersedes the FIN section above where they differ)

**CURRENT POSITION**
- Steps 0, 1 and 2 are all in `main`: PR #3 (step 0) and PR #6 (steps 1 and 2; #5 had merged into the step 0 branch, so #6 was retargeted to `main`). `main` = `ccf66d52`.
- Step 2b (FIN-CR-006, `docs/plans/finance-step2b-review.md`) is **APPROVED** by the user: ideas 18–22 and 24–28. Idea 23 is dropped (FIN-I-001 resolved). Step 3 waits until step 2b is done and verified.
- Step 2b work is on branch `feat/finance-step2b` (worktree `.claude/worktrees/finance-step1`). So far it holds only the review docs and this plan. **No step 2b code is written yet.**
- The plan below was shown to the user on 2026-11-16, and the user asked for it to be written here. **The user has not yet said "go ahead"**. Get that before writing code.

**THE PLAN: four PRs into `main`, each in small Conventional Commits, each raising the version**

*PR A: fixes that need no market data*
1. **Idea 19.** Staff set the agreement numbers on `/superadmin/finance`: agreement needed (default 3), a manager agent's vote weight (default 3), and the Sell bar (default agreement needed + 1). Each must be a whole number ≥ 1, and the Sell bar can't be below agreement needed. Store them in a one-row settings table with an audit row per change (who, when, old and new), read at settle time. Remove `FINANCE_AGREEMENT_NEEDED`, `FINANCE_SELL_AGREEMENT_NEEDED` and the fixed `FINANCE_MANAGER_VOTE_WEIGHT` from `lib/finance/agreement.ts` (FIN-D-022).
2. **Idea 22.** A "Just watch instead" button in setup (`components/finance/finance-setup.tsx`) adds the chosen stock with no shares. The "empty shares = watch" hint stays.
3. **Idea 24.** `isBriefingTime` in `lib/finance/briefing.ts` accepts 07:00–09:59 local (still Monday to Friday, not on US market holidays). The briefing records when it was sent. After 10:00 the day is skipped.
4. **Idea 27, part 1.** Remove the "More" link and the average-price field from setup and "+ Add". They ask only for the stock and shares, with "Just watch" as the other choice.

*PR B: Finnhub market data (idea 18, with ideas 21 and 27)*
1. **The key.** Ask the user for their existing Finnhub key at the start. Never search for, guess or use any other key, and never put it in chat, logs, git or memory. Give the user the command to run themselves:
   - locally: add `FINNHUB_API_KEY=...` to `.env` (never committed);
   - `.env.example`: add an empty `FINNHUB_API_KEY=` line;
   - Cloudflare: add `FINNHUB_API_KEY` to the list in `scripts/cloudflare/upload-secrets.mjs`, then have the user run `node scripts/cloudflare/upload-secrets.mjs` or `npx wrangler secret put FINNHUB_API_KEY`.
2. **A Finnhub `MarketData`** in `lib/finance/market-data.ts`: search, symbol lookup, quote, news and earnings. Without a key it falls back to the built-in directory and shows "—". Finnhub is called from nowhere else.
3. **Rate limit.** Spread the evening snapshots across the cron runs so the free plan's limit (about 60 calls a minute) is never exceeded. The snapshot then has real close, change % and headlines, so jobs also start for news, big moves and earnings, and every agreed view saves `priceAtAgreement`.
4. **Holdings table:** "Today" change and a 30-day sparkline.
5. **Idea 21.** "Overall: your holdings rose X% yesterday (S&P 500: Y%)" from shares × closes, leaving out watch-only stocks, plus one market sentence built by code (FIN-D-018 stays: no AI). Both are left out when prices are missing.
6. **Idea 27, parts 2–3.** Save `addedPrice` and `addedAt` when a stock is added, and show "Up 4% since you added it". On the holding page, an optional "Price per share you paid" shows profit ("You're up $120 (+15%)"), stored in the existing `avgCost`. Profit is information only. No message suggests selling because of the price paid, and agents never see it.

*PR C: every stock considered, and industry interests (ideas 20 and 26)*
1. **Idea 20.** An evening scan of every US stock and ETF by code only: no agents, no AI. It sets aside stocks that are too small, penny stocks, thinly traded or too new. Company profiles (size, industry, listing date) are cached on `FinanceTicker` and refreshed on a rotation to stay within rate limits.
2. A weekly shortlist (default 100, set by staff on `/superadmin/finance`, with pin and exclude) goes to agents as ordinary review jobs. They are never told why a stock was chosen. The new job reason enum value needs **its own migration** (AGENTS.md).
3. "Ideas for you" picks from agreed Keep/Buy views of tracked and shortlisted stocks, so a new user sees ideas within a day or two.
4. **Idea 26.** An optional "Industries you're interested in" field in setup and the ⋯ menu:
   - It picks from a fixed plain-English list, with type-to-filter and no free text.
   - Picks show as tags with an ×. There's no maximum, and zero is fine.
   - Finnhub's industry strings are mapped onto the list.
   - Ideas prefer the person's industries ("Fits your interest in Healthcare"). When none has an idea yet, the page says agents are looking.
   - The shortlist is weighted by how many people picked each industry, with a minimum share each. Only counts are used.
   - Staff see the counts.

*PR D: "Watch how it works" demo (idea 28)*
- A 60–90 second time-lapse from "Mon 16:30" to "Fri 07:00": queue, views, verdicts, agreement, the 07:00 briefing, one example alert, then 30 days later with a wrong call included.
- Controls: play/pause, 1× and 2×, next step, close. Keyboard-friendly. With reduced motion, it plays as steps. It works at phone width.
- It's on the welcome page, the Finance page (most visible while empty) and the ⋯ menu.
- It's labelled "Demo, example data", uses made-up companies and agents only (never real tickers), and shows the notice footer.
- It runs from a fixed script in the browser: no database writes, no Inbox or email, no agents, AI or market data, and never the person's holdings.

*Then: idea 25, try it for real (FIN-T-007)*
- Apply the migrations on a **test** database (never the real one).
- In the browser, a test user sets up, adds stocks, watches one, sells one and changes their answers. Staff grant clearance.
- 2–3 cleared test agents post views and verdicts in one simulated night. Agreed views show on the pages. A 07:00 briefing appears in the Inbox (and in the email log until INF-I-007).
- Screenshots go in the change log.

**Testing for each PR (AGENTS.md):** write the whole change first, then run `pnpm verify:ready` once and fix everything in one pass. Use `pnpm verify:recheck` after repairs. Run `pnpm test:cli` for API changes (CI runs it on every PR).

**RISKS AND OPEN POINTS FOR THE USER**
1. **Finnhub's free plan probably has no price history** (daily candles return 403 in user reports). Check this with the key first. If it is blocked:
   - the 30-day sparkline builds up from our own nightly snapshots and fills in over 30 days;
   - the S&P 500 uses the SPY ETF's quote, labelled "S&P 500 (SPY)";
   - idea 27's "pick the date you bought" can only use dates we have snapshots for, so leave it out until a paid plan.
   Ask the user to confirm.
2. **Disk space:** C: has about 1.3 GB free, which may not be enough for a local Postgres in Docker for idea 25. Options: a separate scratch test database, never the real Supabase one, or free some space.
3. **Housekeeping:** delete the leftover remote branch `feat/finance-step1-agent-research` (it holds the other session's INF-CR-005 commit, already in `main`) **only after the user confirms**. The merged branches `feat/finance-step0-foundations`, `feat/finance-step1-research` and `feat/finance-step2-briefing` can also go, with the user's OK.
4. Briefing emails need email on Cloudflare (INF-I-007). Until then, briefings reach the Inbox only.

**IMPORTANT CONSTRAINTS**
- Everything in the FIN section above still applies: hidden route, private holdings, Workers Free CPU, no assistant attribution, small Conventional Commits.
- The worktree's `node_modules` is a link to the main checkout's (low disk). Running `prisma generate` here changes the client the main checkout uses too.
- Another session works in the main checkout.

**NEXT ACTION:** Get the user's "go ahead" on this plan, then start PR A on `feat/finance-step2b` with idea 19. Expected: staff can change the three numbers, and a settle uses them. Verify with `pnpm verify:ready` and by changing a number on `/superadmin/finance` on a test database.

## FIN: Step 2b in progress (2026-11-16, supersedes the NEXT ACTION above)

- **The user gave the "go ahead" on 2026-11-16** ("go ahead with 2b in its own worktree, its going to be in a new branch anyways"). PR A..D as planned above are authorised; idea 18 still needs the user's Finnhub key before PR B.
- The user asked for the 2b work to live in a **new worktree and a new branch**, not in the existing `feat/finance-step2b` checkout:
  - worktree `.claude/worktrees/finance-step2b-a`, branch `feat/finance-step2b-a`, based on `33d71335` (carries the step 2b docs).
  - `node_modules` there is a junction to the main checkout's, as before. No `pnpm install` was run (disk: about 1.2 GB free).
- The old worktree `.claude/worktrees/finance-step1` (branch `feat/finance-step2b`) still exists and is untouched.
- Also in this branch: INF-CR-006, which tracks `CLAUDE.md` and points `AGENTS.md` at it.
- **The main checkout** (`C:\Users\USER\Downloads\hng_zedu_egret\ziki-finance`) is on `fix/workers-db-socket` at `8b01a247`, 2 commits ahead and 30 behind `origin/main`, with uncommitted memory edits from an earlier session. Its `.project-memory/HANDOFF.md` has none of the Finance sections. Read this worktree's copy instead until that checkout is reconciled.
- **PR A is written and verified (2026-11-16):** ideas 19, 22, 24 and 27 part 1, as recorded in `CHANGELOG.md` under `FIN-CR-006 PR A`. `pnpm verify:ready` (first run) found 5 unit failures and a typecheck OOM; the repairs are in the same entry, and the recheck (a full run, because `NODE_OPTIONS`, `package.json` and `prisma/schema.prisma` changed) passed lint and typecheck with 2235 of 2236 unit tests green. The one failure is the known load timeout in `tests/security/organisation-membership.test.ts` (5354 ms against 5000 ms), which passes alone 17/17 and imports no finance file.
- **NEXT ACTION:** the user asked that this commit **not** become a pull request until they say so. When they do, open it against `emerjent/ziki` `main`. Before that, the migration `20270209000000_finance_settings` has not been run against a database and the pages have not been opened in a browser; both are worth doing on a copy. After PR A: PR B (idea 18) is blocked on the user's Finnhub key, which must never be printed or committed.

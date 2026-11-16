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
- Also in this branch: INF-CR-007, which tracks `CLAUDE.md` and points `AGENTS.md` at it. (It was written as INF-CR-006 and INF-T-008; those IDs went to the sweeps move (INF-CR-006, INF-T-008) when that reached `main` first, so the conflict with it was resolved by renumbering.)
- **The main checkout** (`C:\Users\USER\Downloads\hng_zedu_egret\ziki-finance`) is on `fix/workers-db-socket` at `8b01a247`, 2 commits ahead and 30 behind `origin/main`, with uncommitted memory edits from an earlier session. Its `.project-memory/HANDOFF.md` has none of the Finance sections. Read this worktree's copy instead until that checkout is reconciled.
- **PR A is written and verified (2026-11-16):** ideas 19, 22, 24 and 27 part 1, as recorded in `CHANGELOG.md` under `FIN-CR-006 PR A`. `pnpm verify:ready` (first run) found 5 unit failures and a typecheck OOM; the repairs are in the same entry, and the recheck (a full run, because `NODE_OPTIONS`, `package.json` and `prisma/schema.prisma` changed) passed lint and typecheck with 2235 of 2236 unit tests green. The one failure is the known load timeout in `tests/security/organisation-membership.test.ts` (5354 ms against 5000 ms), which passes alone 17/17 and imports no finance file.
- **NEXT ACTION:** the user asked that this commit **not** become a pull request until they say so. They then gave the word on 2026-11-16, and it is **PR #8** against `Ziki-Finance/ziki` `main` (the repo the checkout actually points at, as PRs #1–#7 did; `emerjent/ziki` is not the remote here). Before merging, the migration `20270209000000_finance_settings` has not been run against a database and the pages have not been opened in a browser; both are worth doing on a copy. After PR A: PR B (idea 18) is blocked on the user's Finnhub key, which must never be printed or committed.

## FIN: Step 2b, PR C and PR D — handover (2026-11-16)

**Read this section first if you are picking up step 2b.** PR A and PR B are done; this is what's left: PR C (ideas 20, 26) and PR D (idea 28), then idea 25 (the end-to-end try).

### Where things actually are right now

- **PR A** — idea 19 (staff-set agreement numbers), 22 (Just watch), 24 (late briefing window), 27 part 1 (no "More"). Merged into `main` as **PR #8**.
- **PR B** — idea 18 (Finnhub), 21 (overall/market lines), 27 parts 2–3 (profit layers). Written by an earlier session on branch `feat/finance-step2b-b` (worktree `.claude/worktrees/finance-step2b-a`), but left broken and untested: an unused import, a doubled +/- sign on two lines, no `FINNHUB_API_KEY` in `.env.example`/`upload-secrets.mjs`, zero tests for two new modules, and 6 existing tests it silently broke. This session continued it from the same commit on a **new local branch in a different worktree** (`.claude/worktrees/finance-step1`, branch `finance-step2b-b-continue` locally), because `feat/finance-step2b-b` was already checked out elsewhere and can't be checked out twice. Fixed everything above (see `CHANGELOG.md` → `FIN-CR-006 PR B`), added `tests/finance/finance-prices.test.ts` and `tests/finance/finance-finnhub.test.ts`, pushed to `origin/feat/finance-step2b-b`, and opened as **PR #11** against `main` (the user asked for it once PR A's merge was confirmed). Clean and mergeable; CI/Auto-fix is watching it.
- **Verification on PR B:** `npx eslint` and `npx tsc --noEmit`, run standalone, both passed. `tests/finance`: 107/107. The combined `pnpm verify:ready` (lint+typecheck together) crashed outright on this box — about 1.2 GB free disk and 1.3 GB free RAM with other worktrees active, not enough headroom. Running lint and typecheck one at a time works; a less-constrained box or a quieter moment should still run the real `pnpm verify:ready` before merging. The migration (`20270210100000_finance_holding_cost`) has not touched a real database, and no Finnhub key has ever been in this repo (`.env` here or in the main checkout's), so the live provider path is unexercised — FIN-T-020.
- **Two worktrees exist for step 2b** at the same time: `.claude/worktrees/finance-step2b-a` (branch now `feat/finance-step2b-b`, per the other session's own handoff) and `.claude/worktrees/finance-step1` (this one, now on local branch `finance-step2b-b-continue`, pushed as `origin/feat/finance-step2b-b`). **Before starting PR C, check which of the two is still being actively driven** (`git worktree list`, and whether either has uncommitted changes) so two sessions don't collide on the same branch. If both are idle, either can continue; this handover assumes whoever reads it continues from `origin/feat/finance-step2b-b` (the pushed state), in a **fresh** local branch off that commit, in whichever worktree is free.
- The stale branch `feat/finance-step2b` (worktree `.claude/worktrees/finance-step1`, before it was repointed) is superseded and holds nothing PR B doesn't already have. The planned-but-abandoned branch `feat/finance-step1-agent-research` is also still sitting on origin, holding an old INF-CR-005 commit already in `main`. Both are safe to delete once the user confirms — don't delete anything without asking (`.project-memory/README.md`, and the user's own standing rule to confirm before deleting).

### PR C — idea 20 (scan every stock, rotating shortlist) and idea 26 (industry interests)

**Scope it down.** The review doc (`docs/plans/finance-step2b-review.md`, idea 20) describes scanning all ~9,000 US stocks and ETFs nightly. Finnhub's free plan makes the *symbol list* free (`/stock/symbol?exchange=US`), but profile data per symbol (`/stock/profile2`, for market cap/industry) still costs one call each, and at 55 calls/minute that's hours to cover the whole universe once, let alone "refreshed on a rotation." Don't try to screen the whole universe in one PR. A workable, honest scope:

1. **Extend `MarketData`** (`lib/finance/market-data.ts`) with one more method, something like `listCandidates(): Promise<TickerMatch[]>` — Finnhub implementation calls `/stock/symbol?exchange=US` once (cheap, one call, not per-symbol), filtered the same way `matchOf` in `finnhub.ts` already filters search results (common stock / ETP, no dotted or slashed symbols). The directory fallback just returns `TICKER_DIRECTORY` as-is (it's already "every stock" in the no-provider world).
2. **A nightly profile-fetch step**, rate-limited like `takeSnapshots` (a small batch per minute, e.g. 20, tracked by a `profileFetchedAt` column on `FinanceTicker` so it rotates through candidates that have never been profiled, or whose profile is oldest). Add to `FinanceTicker`: `marketCap Decimal?`, `industry String?`, `listedAt DateTime?`, `profileFetchedAt DateTime?`. One more migration.
3. **Screening**: a pure function, `isShortlistEligible(ticker)` — has a profile, market cap above a floor (penny/micro-cap test), listed long enough ago (not brand new). Keep the floor numbers as constants, not configurable yet (idea 20 doesn't ask staff to tune these, only the shortlist *size*).
4. **The shortlist itself**: extend `FinanceSettings` (idea 19's table, `lib/finance/settings.ts`) with `shortlistSize Int @default(100)`. Add `shortlistPinned Boolean @default(false)` and `shortlistExcluded Boolean @default(false)` directly on `FinanceTicker` (staff set these per ticker, from the staff page — simplest shape, no join table). A ticker is "on the shortlist" if `onShortlistUntil` (a new nullable `DateTime` on `FinanceTicker`) is in the future; a nightly step picks eligible, non-excluded tickers (pinned ones always included) up to `shortlistSize`, preferring those least recently on it, and sets `onShortlistUntil` to a week out. Extend `TRACKED` in `research.ts` to include `OR: [{holdings:{some:{soldAt:null}}}, {onShortlistUntil:{gt: now}}]` so shortlisted tickers get review jobs exactly like held ones, with a new `FinanceJobReason` value `"shortlist"` — **that enum value is its own migration**, per `AGENTS.md`'s migration rule (a new enum value can't be used in the same transaction that adds it).
5. **Idea 26 (industries)**: a fixed list of ~10 plain-English industries (`lib/finance/industries.ts`, a `const` array + a `mapFinnhubIndustry(raw: string | null): Industry | null` that buckets Finnhub's `finnhubIndustry` string from `/stock/profile2` onto it). Add `FinanceProfile.industries String[]` (empty = no preference) — a multi-select in setup (optional, after the two questions, never blocking) and the "⋯" menu, reusing the tag-with-× pattern (nothing like it exists yet in this codebase; a plain multi-select `<select multiple>` styled as chips is the simplest honest version — don't over-build a custom dropdown-with-search component for this). `ideasFor` (`lib/finance/ideas.ts`) prefers agreed views on tickers whose cached `FinanceTicker.industry` matches one of the person's picked industries, still filtered by risk (FIN-D-019 stays). For the shortlist weighting ("more picks → more of the week's shortlist"), keep it simple: count `FinanceProfile.industries` across all profiles (one query, `groupBy` or an in-memory tally — there's no existing precedent for counting array-field values in this schema, so a plain `findMany({select:{industries:true}})` + tally in code is more honest than a fragile raw SQL `unnest`), weight each industry's share of the shortlist proportionally with a floor (e.g. never below 1 slot if any eligible ticker exists in it), and expose the counts read-only on `/superadmin/finance`.

Files to touch: `prisma/schema.prisma` + 2 migrations (ticker profile columns + shortlist settings; the new enum value), `lib/finance/market-data.ts`, `lib/finance/finnhub.ts` (`listCandidates`), `lib/finance/universe.ts` (new — screening + shortlist building, pure where possible), `lib/finance/industries.ts` (new), `lib/finance/settings.ts` (shortlist size), `lib/finance/research.ts` (`TRACKED`, the new job reason, the nightly profile/shortlist steps called from `sweepFinance`), `lib/finance/ideas.ts` (industry preference), `lib/finance/holdings.ts` or `app/actions/finance.ts` (saving industries), `components/finance/finance-setup.tsx` + holding-forms (the industries field), `app/(app)/superadmin/finance/page.tsx` (shortlist size, pin/exclude, industry counts). Test everything pure (screening, weighting, industry mapping) the way `finance-agreement.test.ts` and `finance-prices.test.ts` do — no database needed for most of it.

### PR D — idea 28 ("Watch how it works" demo)

Entirely client-side, no backend at all: a scripted animation component, `components/finance/how-it-works-demo.tsx` (or similar), with made-up data baked into the component (fake companies — never real tickers — fake agent names), a clock readout, play/pause, 1×/2× speed, next-step, close, and a `prefers-reduced-motion` fallback that jumps between steps instead of animating. Button on the welcome page (`finance-welcome.tsx`), the Finance page's empty-ish state, and the "⋯" menu (`holding-forms.tsx`'s `FinanceProfileMenu`, or a sibling menu item). This is genuinely independent of PR C — it can be built and merged whenever, including before C if that's easier to land first (the review doc's own note: "it can be built at any point in step 2b"). No new migration, no new API route, no agent-facing change at all. Keep it as a single self-contained client component plus its own test file if any of its step-by-step logic is extracted as pure functions (e.g. a `nextStep(current)` state machine is worth testing; the SVG/animation rendering itself isn't).

### After C and D: idea 25 (try it for real)

Needs a disposable test database — **never** the shared dev one and never production (`AGENTS.md`'s migration rules: test on a copy via `pg_dump`, point `DATABASE_URL` at the copy, `prisma migrate deploy`, check, drop it). Given this box's ~1.2 GB free disk, a local Postgres via `docker compose up -d` may not fit; ask the user whether to use a scratch Supabase database instead, or free disk space first, before attempting it.

### Standing reminders for whoever continues this

- Small Conventional Commits, one logical change each (the user's explicit preference this session).
- No assistant attribution anywhere, ever (commits, PRs, code, docs).
- Ask before opening a PR, before deleting a branch, and before touching anything outside this worktree.
- Write the whole change first; run the full verification once at the end, fix everything together, recheck — don't run tests between every edit (`AGENTS.md` → Testing). On this resource-constrained box, run lint and typecheck **separately** if the combined `pnpm verify:ready` crashes; it is not a code problem, it is this machine.

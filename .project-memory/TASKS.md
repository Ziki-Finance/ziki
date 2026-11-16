# Tasks

> IDs carry a workstream prefix (`FIN-`, `INF-`); see `README.md`. Add new rows at the end of your own section.

# FIN: Ziki Finance product

## FIN-CR-002 — Ziki Finance v1 plan, written as ideas
- Created: 2026-11-16. Plan: `docs/plans/finance-ideas.md` (17 ideas in release steps 0–4, plus a step 5 beta checklist; each says what we want to achieve, what is expected, why, and what it depends on).
- History: first drafted as a technical Phase 0 plan (`finance-phase0-plan.md`). SUPERSEDED the same day at the user's request: the user wants the plan as ideas covering all of v1. That file was removed.
- Approval: PROPOSED, awaiting user approval.
- Implementation: NOT STARTED. Verification: N/A.
- Update 2026-11-16: APPROVED for steps 0–2 (see CHANGELOG FIN-CR-002). Steps 3–5 still PROPOSED.

| ID | Task | Status |
|----|------|--------|
| FIN-T-004 | Legal review before public launch (PRD §10) | Referenced by FIN-RISK-001; the original task text was lost (INF-CR-004). Not started. |
| FIN-T-005 | Release step 0, ideas 1–5 (FIN-CR-003) | Code done on `feat/finance-step0-foundations`; unit-tested; not yet run against a database or in a browser |
| FIN-T-006 | Choose a market-data provider (PRD §9.3) and implement `MarketData` for it (FIN-D-013) | Not started; business decision |
| FIN-T-007 | Try the Finance pages in a browser against a dev database (setup, add, edit, sell, stop watching, staff clearance) | Not started |
| FIN-T-008 | Release step 1, ideas 6–9 (FIN-CR-004) | Code done on `feat/finance-step1-research`; unit-tested; PR stacked on step 0 |
| FIN-T-009 | Staff-only overnight test: clear a few agents, run the finance worker, check every held ticker gets an agreed view by 05:00 ET (PRD §12 step 1 exit check) | Not started; needs step 1 merged and deployed |
| FIN-T-010 | Extend the NYSE holiday list in `lib/finance/calendar.ts` for 2028 before the end of 2027 | Not started |
| FIN-T-011 | Start-at-sign-in for the finance worker (like `security-worker.mjs install`) | Not started; optional |
| FIN-T-012 | Release step 2, ideas 10–12 (FIN-CR-005) | Code done on `feat/finance-step2-briefing`; unit-tested; PR stacked on step 1 |
| FIN-T-013 | Step 2 exit check: test users get a briefing at about 07:00 local for 5 trading days running (Inbox and email) | Not started; needs steps 0–2 merged and deployed, cleared agents (FIN-T-009) and working email on Workers (INF-I-007) |
| FIN-T-014 | Decide whether to add an AI rewrite of the briefing's wording (FIN-D-018 is code-only for now) | Not started; product decision |
| FIN-T-015 | Idea 19: staff-set agreement numbers on `/superadmin/finance` (FIN-CR-006 PR A) | Done 2026-11-16 on `feat/finance-step2b-a`; lint and typecheck green, unit 2235/2236 (one load timeout, unrelated) |
| FIN-T-016 | Idea 22: "Just watch instead" in setup (FIN-CR-006 PR A) | Done 2026-11-16 on `feat/finance-step2b-a`; lint and typecheck green, unit 2235/2236 (one load timeout, unrelated) |
| FIN-T-017 | Idea 24: briefing window 07:00–09:59 local (FIN-CR-006 PR A) | Done 2026-11-16 on `feat/finance-step2b-a`; lint and typecheck green, unit 2235/2236 (one load timeout, unrelated) |
| FIN-T-018 | Idea 27 part 1: no "More"/average price in setup and "+ Add" (FIN-CR-006 PR A) | Done 2026-11-16 on `feat/finance-step2b-a`; lint and typecheck green, unit 2235/2236 (one load timeout, unrelated) |
| FIN-T-019 | Idea 18: Finnhub market data; idea 21: overall/market lines; idea 27 parts 2–3: profit layers (FIN-CR-006 PR B) | Done 2026-11-16 on `feat/finance-step2b-b`; found broken and fixed (see CHANGELOG); lint and typecheck green standalone, `tests/finance` 107/107; full `pnpm verify:ready` not completed on this box (resource-constrained) |
| FIN-T-020 | Get a Finnhub key into this repo's `.env` (idea 18) and confirm search/quote/news work for real | Not started; needs the user's existing key, never in chat |

# INF: Infrastructure and deployment

| ID | Task | Status |
|----|------|--------|
| INF-T-001 | Apply Prisma migrations to Supabase | Done, verified 2026-11-16 |
| INF-T-002 | Seed first-time data (super admin, zedu org) with `pnpm db:seed` | Not started; needs the user's OK and SUPER_ADMIN_* set |
| INF-T-003 | Choose the Cloudflare approach | Done: Workers via OpenNext (INF-D-002) |
| INF-T-004 | Implement the Cloudflare deployment (INF-CR-002) | Done; PR #1 green; first deploy pending merge |
| INF-T-005 | Decide on Supabase Row Level Security for tables in `public` (Data API exposure, INF-I-003) | Not started |
| INF-T-006 | After the first deploy: upload runtime secrets (`node scripts/cloudflare/upload-secrets.mjs`), re-run the deploy, add the Google OAuth redirect URI | Not started |
| INF-T-007 | Measure which routes exceed 10 ms CPU on Workers Free (INF-I-004) | Not started |
| INF-T-008 | The user runs `node scripts/cron/set-github-sweep-secrets.mjs`, then a manual "Platform sweeps" run; confirm the sweeps reach Supabase (INF-CR-006) | Not started |
| INF-T-009 | Track `CLAUDE.md` and link it from `AGENTS.md` (INF-CR-007) | Done 2026-11-16 |

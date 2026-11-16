# Tasks

> IDs carry a workstream prefix (`FIN-`, `INF-`); see `README.md`. Add new rows at the end of your own section.

# FIN: Ziki Finance product

## FIN-CR-002 — Ziki Finance v1 plan, written as ideas
- Created: 2026-11-16. Plan: `docs/plans/finance-ideas.md` (17 ideas in release steps 0–4, plus a step 5 beta checklist; each says what we want to achieve, what is expected, why, and what it depends on).
- History: first drafted as a technical Phase 0 plan (`finance-phase0-plan.md`). SUPERSEDED the same day at the user's request: the user wants the plan as ideas covering all of v1. That file was removed.
- Approval: PROPOSED, awaiting user approval.
- Implementation: NOT STARTED. Verification: N/A.

| ID | Task | Status |
|----|------|--------|
| FIN-T-004 | Legal review before public launch (PRD §10) | Referenced by FIN-RISK-001; the original task text was lost (INF-CR-004). Not started. |
| FIN-T-005 | Release step 0, ideas 1–5 (FIN-CR-003) | Code done on `feat/finance-step0-foundations`; unit-tested; not yet run against a database or in a browser |
| FIN-T-006 | Choose a market-data provider (PRD §9.3) and implement `MarketData` for it (FIN-D-013) | Not started; business decision |
| FIN-T-007 | Try the Finance pages in a browser against a dev database (setup, add, edit, sell, stop watching, staff clearance) | Not started |

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

# Current State

_Last updated: 2026-11-16_

> IDs carry a workstream prefix (`FIN-`, `INF-`); see `README.md`.

## Summary
The Ziki issue tracker (Next.js 16, Prisma 6, PostgreSQL) runs on a **Supabase** database and is set up to deploy to **Cloudflare Workers (Free plan)** from `main`. The feature that must work is **Ziki Finance** (`docs/plans/finance-prd.md` v0.2, approved as a document; release steps 0–2 and step 2b PRs A and B are built and merged into `main`, unit-tested only). Other features may stay broken on Cloudflare (INF-D-004).

## Database (Supabase)
- Project ref `nsdgkigavaqbxlasfans`, AWS eu-west-1. The direct host is IPv6-only, so `.env` uses the session pooler `aws-1-eu-west-1.pooler.supabase.com:5432` (INF-D-001).
- All 235 migrations applied 2026-11-16 (INF-CR-001, verified). Not seeded.

## Cloudflare (INF)
- Workers via OpenNext, Free plan only (INF-D-002, INF-I-004). Live at `https://ziki-finance.ibuild-ai.workers.dev`; `/api/health` returns 200 since INF-CR-005 (2026-11-16). Runtime secrets uploaded. Hyperdrive `ziki-supabase` in use.
- Deploys from `main` through GitHub Actions after CI and the malware scan (INF-D-005).
- Platform sweeps run every 5 minutes on GitHub Actions, not on the Worker (INF-D-006, INF-CR-006; verified 2026-11-16, all 18 sweeps ok).

## Finance feature (FIN)
- PRD v0.2 and wireframes approved as documents (FIN-CR-001). The v1 plan as 17 ideas is PROPOSED (FIN-CR-002). Workers-Free risks for it: INF-I-005.
- 2026-11-16: FIN-CR-002 APPROVED for release steps 0–2 and built, each on its own stacked branch, unit-tested only:
  - Step 0 foundations (FIN-CR-003): `feat/finance-step0-foundations`, PR #3 into `main`.
  - Step 1 agent research (FIN-CR-004): `feat/finance-step1-research`, PR #5 into the step 0 branch.
  - Step 2 daily briefing (FIN-CR-005): `feat/finance-step2-briefing`, PR into the step 1 branch.
- Merged into `main` on 2026-11-16: PR #3 (step 0), PR #6 (steps 1–2), PR #8 (step 2b PR A: ideas 19, 22, 24, 27 part 1), PR #11 (step 2b PR B: idea 18, idea 21, idea 27 parts 2–3). `main` is `c51b9899`, version 0.1.216.
- Unlisted demo page from PR #12: `/finance/demo` shows the finished page with made-up data; `/finance/demo/ACME` and `/finance/demo/CTSO` carry example holdings, one down and one up. It reads nothing and saves nothing.
- Not tried in a browser or against a database, and no market-data key has ever been in this repo (FIN-D-013, FIN-T-020), so prices fall back to the built-in directory. Steps 3–5 (alerts, money, beta) are still PROPOSED. PR C (ideas 20, 26) and PR D (idea 28) are not started. Contract: `docs/finance.md`.
- The record of this repair is INF-CR-008.
